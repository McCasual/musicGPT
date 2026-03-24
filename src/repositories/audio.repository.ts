import { Injectable } from '@nestjs/common';
import { Audio } from 'generated/prisma/client';
import { PrismaService } from 'src/infrastructure/prisma.service';

@Injectable()
export class AudioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManyByUserId(userId: string): Promise<Audio[]> {
    return this.prisma.audio.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByIdForUser(id: string, userId: string): Promise<Audio | null> {
    return this.prisma.audio.findFirst({
      where: { id, userId },
    });
  }

  async updateTitleForUser(
    id: string,
    userId: string,
    title: string,
  ): Promise<Audio | null> {
    const updated = await this.prisma.audio.updateMany({
      where: { id, userId },
      data: { title },
    });

    if (updated.count === 0) {
      return null;
    }

    return this.findByIdForUser(id, userId);
  }
}
