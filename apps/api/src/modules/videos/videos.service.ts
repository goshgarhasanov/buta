import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import type { InitUploadDto, FinalizeUploadDto, UpdateVideoDto } from './dto/videos.dto';

@Injectable()
export class VideosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async initUpload(userId: string, dto: InitUploadDto) {
    const presigned = await this.storage.presignVideoUpload(userId, dto.contentType);

    const video = await this.prisma.video.create({
      data: {
        userId,
        originalKey: presigned.key,
        durationSec: 0,
        width: 0,
        height: 0,
        aspectRatio: 9 / 16,
        sizeBytes: BigInt(0),
        status: 'UPLOADING',
        caption: dto.caption,
      },
    });

    return {
      videoId: video.id,
      uploadUrl: presigned.uploadUrl,
      key: presigned.key,
      expiresInSec: presigned.expiresInSec,
    };
  }

  async finalizeUpload(userId: string, videoId: string, dto: FinalizeUploadDto) {
    const video = await this.prisma.video.findUnique({ where: { id: videoId } });
    if (!video) throw new NotFoundException('Video tapılmadı');
    if (video.userId !== userId) throw new ForbiddenException('Bu video sizə məxsus deyil');

    await this.prisma.video.update({
      where: { id: videoId },
      data: {
        durationSec: dto.durationSec,
        width: dto.width,
        height: dto.height,
        aspectRatio: dto.width / dto.height,
        sizeBytes: BigInt(dto.sizeBytes),
        status: 'PROCESSING',
      },
    });

    // TODO: BullMQ-yə transcode job qoy
    // await this.transcodeQueue.add('transcode', { videoId });

    return { status: 'queued', videoId };
  }

  async getById(id: string) {
    const video = await this.prisma.video.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            verified: true,
          },
        },
        hashtags: { include: { hashtag: true } },
        audio: true,
      },
    });
    if (!video || video.status !== 'READY') {
      throw new NotFoundException('Video tapılmadı');
    }
    return video;
  }

  async update(userId: string, id: string, dto: UpdateVideoDto) {
    const video = await this.prisma.video.findUnique({ where: { id } });
    if (!video) throw new NotFoundException('Video tapılmadı');
    if (video.userId !== userId) throw new ForbiddenException();

    return this.prisma.video.update({
      where: { id },
      data: { caption: dto.caption, visibility: dto.visibility },
    });
  }

  async remove(userId: string, id: string) {
    const video = await this.prisma.video.findUnique({ where: { id } });
    if (!video) throw new NotFoundException();
    if (video.userId !== userId) throw new ForbiddenException();

    await this.prisma.video.update({
      where: { id },
      data: { status: 'REMOVED', deletedAt: new Date() },
    });
  }

  async incrementView(videoId: string, userId?: string, watchPercent = 0, source?: string) {
    await this.prisma.$transaction([
      this.prisma.videoView.create({
        data: { videoId, userId, watchPercent, source },
      }),
      this.prisma.video.update({
        where: { id: videoId },
        data: { viewCount: { increment: 1 } },
      }),
    ]);
  }
}
