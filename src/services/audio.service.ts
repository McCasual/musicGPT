import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RedisService } from 'src/infrastructure/redis.service';
import { AudioRepository } from 'src/repositories/audio.repository';

@Injectable()
export class AudioService {
  constructor(
    private readonly audioRepository: AudioRepository,
    private readonly redisService: RedisService,
  ) {}

  async listUserAudios(params: {
    userId: string;
    cursor?: string;
    limit: number;
  }) {
    const { userId, cursor, limit } = params;
    const cacheKey = this.getListCacheKey({ userId, cursor, limit });
    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const result = await this.audioRepository.findManyByUserId({
      userId,
      cursor,
      limit,
    });
    void this.redisService.set(cacheKey, result, 60);
    return result;
  }

  async getUserAudioById(userId: string, audioId: string) {
    const cacheKey = this.getDetailCacheKey(userId, audioId);
    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const audio = await this.audioRepository.findByIdForUser(audioId, userId);
    if (!audio) {
      throw new NotFoundException('Audio not found.');
    }

    void this.redisService.set(cacheKey, audio, 60);
    return audio;
  }

  async updateUserAudioTitle(userId: string, audioId: string, title: string) {
    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
      throw new BadRequestException('title cannot be empty.');
    }

    const updated = await this.audioRepository.updateTitleForUser(
      audioId,
      userId,
      normalizedTitle,
    );

    if (!updated) {
      throw new NotFoundException('Audio not found.');
    }

    void this.redisService.del(this.getDetailCacheKey(userId, audioId));
    return updated;
  }

  private getListCacheKey(params: {
    userId: string;
    cursor?: string;
    limit: number;
  }): string {
    const { userId, cursor, limit } = params;
    return `${this.getListCachePrefix(userId)}cursor=${cursor ?? 'null'}:limit=${limit}`;
  }

  private getListCachePrefix(userId: string): string {
    return `audio:user=${userId}:`;
  }

  private getDetailCacheKey(userId: string, audioId: string): string {
    return `audio:user=${userId}:id=${audioId}`;
  }
}
