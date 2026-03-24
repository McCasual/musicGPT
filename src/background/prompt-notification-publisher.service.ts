import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisClientType, createClient } from 'redis';
import {
  PROMPT_COMPLETED_CHANNEL,
  PromptCompletedRealtimeEvent,
} from 'src/realtime/prompt-notification.events';

@Injectable()
export class PromptNotificationPublisherService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PromptNotificationPublisherService.name);
  private readonly publisher: RedisClientType;

  constructor(private readonly configService: ConfigService) {
    const url =
      this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    this.publisher = createClient({ url });
    this.publisher.on('error', (error) => {
      this.logger.error(`Redis publisher error: ${String(error)}`);
    });
  }

  async onModuleInit(): Promise<void> {
    await this.publisher.connect();
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.publisher.isOpen) {
      return;
    }

    await this.publisher.quit();
  }

  async publishPromptCompleted(
    event: PromptCompletedRealtimeEvent,
  ): Promise<void> {
    await this.publisher.publish(PROMPT_COMPLETED_CHANNEL, JSON.stringify(event));
  }
}
