import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createBullmqRootOptions } from 'src/background/bullmq.config';
import { PromptNotificationPublisherService } from 'src/background/prompt-notification-publisher.service';
import { PromptProcessorWorker } from 'src/background/prompt-processor.worker';
import { PROMPT_PROCESSING_QUEUE } from 'src/background/prompt-jobs';
import { PrismaService } from 'src/infrastructure/prisma.service';
import { PromptRepository } from 'src/repositories/prompt.repository';
import { PromptWorkflowService } from 'src/services/prompt-workflow.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: createBullmqRootOptions,
    }),
    BullModule.registerQueue({ name: PROMPT_PROCESSING_QUEUE }),
  ],
  providers: [
    PrismaService,
    PromptRepository,
    PromptWorkflowService,
    PromptNotificationPublisherService,
    PromptProcessorWorker,
  ],
})
export class PromptWorkerModule {}
