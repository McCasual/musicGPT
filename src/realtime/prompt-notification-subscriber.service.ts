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
import { PromptNotificationsGateway } from 'src/realtime/prompt-notifications.gateway';

@Injectable()
export class PromptNotificationSubscriberService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PromptNotificationSubscriberService.name);
  private readonly subscriber: RedisClientType;

  constructor(
    private readonly configService: ConfigService,
    private readonly notificationsGateway: PromptNotificationsGateway,
  ) {
    const url =
      this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    this.subscriber = createClient({ url });
    this.subscriber.on('error', (error) => {
      this.logger.error(`Redis subscriber error: ${String(error)}`);
    });
  }

  async onModuleInit(): Promise<void> {
    await this.subscriber.connect();
    await this.subscriber.subscribe(PROMPT_COMPLETED_CHANNEL, (message) => {
      this.handleMessage(message);
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.subscriber.isOpen) {
      return;
    }

    await this.subscriber.unsubscribe(PROMPT_COMPLETED_CHANNEL);
    await this.subscriber.quit();
  }

  private handleMessage(message: string): void {
    try {
      const parsed: unknown = JSON.parse(message);

      if (!this.isPromptCompletedEvent(parsed)) {
        this.logger.warn(
          'Ignored prompt completed notification with invalid payload shape.',
        );
        return;
      }

      this.notificationsGateway.emitPromptCompleted(parsed);
    } catch (error) {
      this.logger.warn(
        `Ignored invalid prompt completed notification: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private isPromptCompletedEvent(
    value: unknown,
  ): value is PromptCompletedRealtimeEvent {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const candidate = value as PromptCompletedRealtimeEvent;

    if (!candidate.userId || typeof candidate.userId !== 'string') {
      return false;
    }

    if (!candidate.prompt || typeof candidate.prompt !== 'object') {
      return false;
    }

    return (
      typeof candidate.prompt.id === 'string' &&
      typeof candidate.prompt.text === 'string' &&
      candidate.prompt.status === 'COMPLETED' &&
      typeof candidate.prompt.createdAt === 'string' &&
      typeof candidate.prompt.updatedAt === 'string'
    );
  }
}
