import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: this.publicSelect(),
    });
    if (!user || (user as any).deletedAt) throw new NotFoundException('İstifadəçi tapılmadı');
    return user;
  }

  async getById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.publicSelect(),
    });
    if (!user) throw new NotFoundException('İstifadəçi tapılmadı');
    return user;
  }

  async updateProfile(
    userId: string,
    data: { displayName?: string; bio?: string; avatarUrl?: string; coverUrl?: string },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: this.publicSelect(),
    });
  }

  async listVideosByUser(username: string, cursor?: string, limit = 20) {
    const user = await this.prisma.user.findUnique({ where: { username }, select: { id: true } });
    if (!user) throw new NotFoundException('İstifadəçi tapılmadı');

    return this.prisma.video.findMany({
      where: { userId: user.id, status: 'READY', visibility: 'PUBLIC' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        thumbnailUrl: true,
        previewGifUrl: true,
        durationSec: true,
        viewCount: true,
        likeCount: true,
        createdAt: true,
      },
    });
  }

  private publicSelect() {
    return {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      coverUrl: true,
      verified: true,
      followerCount: true,
      followingCount: true,
      videoCount: true,
      likeCount: true,
      createdAt: true,
    };
  }
}
