import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FollowsService {
  constructor(private readonly prisma: PrismaService) {}

  async follow(followerId: string, targetUsername: string) {
    const target = await this.prisma.user.findUnique({ where: { username: targetUsername } });
    if (!target) throw new NotFoundException('İstifadəçi tapılmadı');
    if (target.id === followerId) throw new BadRequestException('Özünüzü izləyə bilməzsiniz');

    await this.prisma.$transaction(async (tx) => {
      try {
        await tx.follow.create({
          data: { followerId, followingId: target.id },
        });
      } catch {
        return;
      }
      await tx.user.update({
        where: { id: followerId },
        data: { followingCount: { increment: 1 } },
      });
      await tx.user.update({
        where: { id: target.id },
        data: { followerCount: { increment: 1 } },
      });
      await tx.notification.create({
        data: { userId: target.id, actorId: followerId, type: 'FOLLOW' },
      });
    });

    return { following: true };
  }

  async unfollow(followerId: string, targetUsername: string) {
    const target = await this.prisma.user.findUnique({ where: { username: targetUsername } });
    if (!target) throw new NotFoundException();

    await this.prisma.$transaction(async (tx) => {
      const deleted = await tx.follow.deleteMany({
        where: { followerId, followingId: target.id },
      });
      if (deleted.count === 0) return;
      await tx.user.update({
        where: { id: followerId },
        data: { followingCount: { decrement: 1 } },
      });
      await tx.user.update({
        where: { id: target.id },
        data: { followerCount: { decrement: 1 } },
      });
    });

    return { following: false };
  }
}
