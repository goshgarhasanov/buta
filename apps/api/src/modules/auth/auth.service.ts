import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { RegisterDto, LoginDto } from './dto/auth.dto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens & { userId: string }> {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: dto.username },
          dto.email ? { email: dto.email } : { id: '__never__' },
          dto.phone ? { phone: dto.phone } : { id: '__never__' },
        ],
      },
    });
    if (existing) {
      throw new ConflictException('İstifadəçi adı, email və ya telefon artıq qeydiyyatdadır');
    }

    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });

    const user = await this.prisma.user.create({
      data: {
        username: dto.username.toLowerCase(),
        email: dto.email?.toLowerCase(),
        phone: dto.phone,
        passwordHash,
        displayName: dto.displayName ?? dto.username,
      },
    });

    const tokens = await this.issueTokens(user.id, user.username, user.role);
    return { userId: user.id, ...tokens };
  }

  async login(dto: LoginDto, meta?: { ip?: string; userAgent?: string }): Promise<AuthTokens> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: dto.identifier.toLowerCase() },
          { email: dto.identifier.toLowerCase() },
          { phone: dto.identifier },
        ],
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Yanlış istifadəçi adı və ya parol');
    }
    if (user.deletedAt) {
      throw new UnauthorizedException('Hesab silinib');
    }

    const ok = await argon2.verify(user.passwordHash, dto.password);
    if (!ok) throw new UnauthorizedException('Yanlış istifadəçi adı və ya parol');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastSeenAt: new Date() },
    });

    return this.issueTokens(user.id, user.username, user.role, meta);
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    if (!refreshToken) throw new UnauthorizedException('Refresh token yoxdur');
    const hash = this.hashToken(refreshToken);

    const session = await this.prisma.session.findUnique({
      where: { refreshTokenHash: hash },
      include: { user: true },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token etibarsızdır');
    }

    // Rotation: köhnəni revoke et, yenisini ver
    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(session.user.id, session.user.username, session.user.role);
  }

  async logout(refreshToken: string): Promise<void> {
    if (!refreshToken) return;
    const hash = this.hashToken(refreshToken);
    await this.prisma.session.updateMany({
      where: { refreshTokenHash: hash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueTokens(
    userId: string,
    username: string,
    role: string,
    meta?: { ip?: string; userAgent?: string },
  ): Promise<AuthTokens> {
    const payload = { sub: userId, username, role };

    const accessToken = await this.jwt.signAsync(payload);

    const refreshRaw = randomBytes(48).toString('hex');
    const refreshHash = this.hashToken(refreshRaw);
    const refreshTtlDays = Number(
      (this.config.get<string>('JWT_REFRESH_TTL', '30d') as string).replace('d', ''),
    );

    await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash: refreshHash,
        expiresAt: new Date(Date.now() + refreshTtlDays * 86400 * 1000),
        ip: meta?.ip,
        userAgent: meta?.userAgent,
      },
    });

    return { accessToken, refreshToken: refreshRaw };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
