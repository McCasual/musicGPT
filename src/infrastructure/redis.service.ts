import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisClientType, createClient } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: RedisClientType;

  constructor(private readonly configService: ConfigService) {
    const url =
      this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    this.client = createClient({ url });
    this.client.on('error', (error) => {
      this.logger.error(`Redis client error: ${String(error)}`);
    });
  }

  async onModuleInit() {
    await this.client.connect();
  }

  async onModuleDestroy() {
    if (!this.client.isOpen) {
      return;
    }
    await this.client.quit();
  }

  async incrementWithWindow(
    key: string,
    windowSeconds: number,
  ): Promise<{ count: number; resetInSeconds: number }> {
    const count = await this.client.incr(key);

    if (count === 1) {
      await this.client.expire(key, windowSeconds);
      return { count, resetInSeconds: windowSeconds };
    }

    let ttl = await this.client.ttl(key);
    if (ttl < 0) {
      await this.client.expire(key, windowSeconds);
      ttl = windowSeconds;
    }

    return { count, resetInSeconds: ttl };
  }

  async get(key: string): Promise<object | null> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: object, ttlSeconds: number = 60): Promise<void> {
    await this.client.set(key, JSON.stringify(value), { EX: ttlSeconds });
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }
}
