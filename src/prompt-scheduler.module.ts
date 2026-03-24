import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createBullmqRootOptions } from 'src/background/bullmq.config';
import { PromptQueueService } from 'src/background/prompt-queue.service';
import { PromptSchedulerBootstrapService } from 'src/background/prompt-scheduler-bootstrap.service';
import { PromptSchedulerWorker } from 'src/background/prompt-scheduler.worker';
import {
  PROMPT_PROCESSING_QUEUE,
  PROMPT_SCHEDULER_QUEUE,
} from 'src/background/prompt-jobs';
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
    BullModule.registerQueue(
      { name: PROMPT_SCHEDULER_QUEUE },
      { name: PROMPT_PROCESSING_QUEUE },
    ),
  ],
  providers: [
    PrismaService,
    PromptRepository,
    PromptWorkflowService,
    PromptQueueService,
    PromptSchedulerBootstrapService,
    PromptSchedulerWorker,
  ],
})
export class PromptSchedulerModule {}
