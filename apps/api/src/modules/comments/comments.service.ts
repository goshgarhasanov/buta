import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(videoId: string, cursor?: string, limit = 20) {
    const items = await this.prisma.comment.findMany({
      where: { videoId, parentId: null, deletedAt: null },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: [{ pinnedAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, verified: true },
        },
      },
    });
    const nextCursor = items.length > limit ? items.pop()!.id : null;
    return { items, nextCursor };
  }

  async create(userId: string, videoId: string, text: string, parentId?: string) {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      select: { id: true, userId: true },
    });
    if (!video) throw new NotFoundException('Video tapılmadı');

    return this.prisma.$transaction(async (tx) => {
      const comment = await tx.comment.create({
        data: { videoId, userId, text, parentId },
      });
      await tx.video.update({
        where: { id: videoId },
        data: { commentCount: { increment: 1 } },
      });
      if (parentId) {
        await tx.comment.update({
          where: { id: parentId },
          data: { replyCount: { increment: 1 } },
        });
      }
      if (video.userId !== userId) {
        await tx.notification.create({
          data: {
            userId: video.userId,
            actorId: userId,
            type: parentId ? 'REPLY' : 'COMMENT',
            videoId,
            commentId: comment.id,
          },
        });
      }
      return comment;
    });
  }

  async delete(userId: string, commentId: string) {
    const c = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!c) throw new NotFoundException();
    if (c.userId !== userId) throw new ForbiddenException();

    await this.prisma.$transaction([
      this.prisma.comment.update({
        where: { id: commentId },
        data: { deletedAt: new Date(), text: '[silindi]' },
      }),
      this.prisma.video.update({
        where: { id: c.videoId },
        data: { commentCount: { decrement: 1 } },
      }),
    ]);
  }
}
