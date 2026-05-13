import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeedService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * "For You" feed — MVP:
   *   - Son 7 gün public, READY
   *   - Sort: hotnessScore desc, sonra createdAt desc
   *   - Diversity: eyni müəlifdən ardıcıl 3 video → sonradan post-process
   *
   * Sonra: ML scoring, watch history-yə görə personalizasiya, exploration.
   */
  async forYou(userId: string | undefined, cursor?: string, limit = 10) {
    const where = {
      status: 'READY' as const,
      visibility: 'PUBLIC' as const,
      createdAt: { gte: new Date(Date.now() - 7 * 86400 * 1000) },
    };

    const videos = await this.prisma.video.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: [{ hotnessScore: 'desc' }, { createdAt: 'desc' }],
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
        audio: { select: { id: true, name: true, artistName: true } },
      },
    });

    const nextCursor = videos.length > limit ? videos.pop()!.id : null;

    // Cari istifadəçinin like statusu
    let liked: Set<string> = new Set();
    if (userId && videos.length) {
      const likes = await this.prisma.like.findMany({
        where: { userId, videoId: { in: videos.map((v) => v.id) } },
        select: { videoId: true },
      });
      liked = new Set(likes.map((l) => l.videoId));
    }

    return {
      items: videos.map((v) => ({ ...v, isLiked: liked.has(v.id) })),
      nextCursor,
    };
  }

  async following(userId: string, cursor?: string, limit = 10) {
    const follows = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const ids = follows.map((f) => f.followingId);
    if (!ids.length) return { items: [], nextCursor: null };

    const videos = await this.prisma.video.findMany({
      where: { userId: { in: ids }, status: 'READY', visibility: { in: ['PUBLIC', 'FOLLOWERS'] } },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, verified: true },
        },
      },
    });

    const nextCursor = videos.length > limit ? videos.pop()!.id : null;
    return { items: videos, nextCursor };
  }
}
