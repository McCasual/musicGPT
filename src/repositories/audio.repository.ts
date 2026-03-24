import { Injectable } from '@nestjs/common';
import { Audio } from 'generated/prisma/client';
import { PrismaService } from 'src/infrastructure/prisma.service';

@Injectable()
export class AudioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManyByUserId(params: {
    userId: string;
    cursor?: string;
    limit: number;
  }) {
    const { userId, cursor, limit } = params;
    const audios = await this.prisma.audio.findMany({
      where: { userId },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'asc' },
    });

    let nextCursor: string | null = null;
    if (audios.length > limit) {
      nextCursor = audios[limit].id;
      audios.pop();
    }

    return { audio: { data: audios, meta: { next_cursor: nextCursor } } };
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
