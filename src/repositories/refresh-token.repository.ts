import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma.service';
import { toRefreshToken } from 'src/prisma-mappers';

@Injectable()
export class RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    const created = await this.prisma.refreshToken.create({
      data: {
        id: input.id,
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
      },
    });
    return toRefreshToken(created);
  }

  async findById(id: string) {
    const found = await this.prisma.refreshToken.findUnique({
      where: { id },
    });
    return found ? toRefreshToken(found) : null;
  }

  async revokeIfActive(id: string, tokenHash: string) {
    const now = new Date();
    const { count } = await this.prisma.refreshToken.updateMany({
      where: {
        id,
        tokenHash,
        revokedAt: null,
        expiresAt: {
          gt: now,
        },
      },
      data: {
        revokedAt: now,
      },
    });
    return count === 1;
  }

  async revokeById(id: string) {
    await this.prisma.refreshToken.update({
      where: { id },
      data: {
        revokedAt: new Date(),
      },
    });
  }
}
