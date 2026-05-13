import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LikesService {
  constructor(private readonly prisma: PrismaService) {}

  async like(userId: string, videoId: string) {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      select: { id: true, userId: true },
    });
    if (!video) throw new NotFoundException('Video tapılmadı');

    await this.prisma.$transaction(async (tx) => {
      try {
        await tx.like.create({ data: { userId, videoId } });
      } catch {
        return; // already liked
      }
      await tx.video.update({
        where: { id: videoId },
        data: { likeCount: { increment: 1 } },
      });
      await tx.user.update({
        where: { id: video.userId },
        data: { likeCount: { increment: 1 } },
      });
      if (video.userId !== userId) {
        await tx.notification.create({
          data: {
            userId: video.userId,
            actorId: userId,
            type: 'LIKE',
            videoId,
          },
        });
      }
    });

    return { liked: true };
  }

  async unlike(userId: string, videoId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const deleted = await tx.like.deleteMany({ where: { userId, videoId } });
      if (deleted.count === 0) return false;
      await tx.video.update({
        where: { id: videoId },
        data: { likeCount: { decrement: 1 } },
      });
      const video = await tx.video.findUnique({
        where: { id: videoId },
        select: { userId: true },
      });
      if (video) {
        await tx.user.update({
          where: { id: video.userId },
          data: { likeCount: { decrement: 1 } },
        });
      }
      return true;
    });

    return { liked: false, changed: result };
  }
}
