import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import {
  PROCESS_PROMPT_JOB,
  PROMPT_PROCESSING_QUEUE,
  PROMPT_SCHEDULER_JOB_ID,
  PROMPT_SCHEDULER_QUEUE,
  PromptSchedulingCandidate,
  ProcessPromptJobData,
  SchedulePendingPromptsJobData,
  SCHEDULE_PENDING_PROMPTS_JOB,
  getPromptJobPriority,
} from 'src/background/prompt-jobs';

export interface PromptSchedulerRegistration {
  cronPattern: string;
  batchSize: number;
}

@Injectable()
export class PromptQueueService {
  constructor(
    @InjectQueue(PROMPT_PROCESSING_QUEUE)
    private readonly processingQueue: Queue<ProcessPromptJobData>,
    @InjectQueue(PROMPT_SCHEDULER_QUEUE)
    private readonly schedulerQueue: Queue<SchedulePendingPromptsJobData>,
    private readonly configService: ConfigService,
  ) {}

  async registerScheduler(): Promise<PromptSchedulerRegistration> {
    const registration = {
      cronPattern:
        this.configService.get<string>('PROMPT_SCHEDULER_CRON')?.trim() ||
        '*/15 * * * * *',
      batchSize: this.getPositiveInt('PROMPT_SCHEDULER_BATCH_SIZE', 25),
    };

    await this.schedulerQueue.upsertJobScheduler(
      PROMPT_SCHEDULER_JOB_ID,
      {
        pattern: registration.cronPattern,
      },
      {
        name: SCHEDULE_PENDING_PROMPTS_JOB,
        data: { batchSize: registration.batchSize },
        opts: {
          removeOnComplete: 1000,
          removeOnFail: 1000,
        },
      },
    );

    return registration;
  }

  async enqueuePrompt(prompt: PromptSchedulingCandidate): Promise<void> {
    await this.processingQueue.add(
      PROCESS_PROMPT_JOB,
      { promptId: prompt.id },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        jobId: `prompt-${prompt.id}`,
        priority: getPromptJobPriority(prompt.subscriptionStatus),
        removeOnComplete: 1000,
        removeOnFail: 1000,
      },
    );
  }

  private getPositiveInt(key: string, fallback: number): number {
    const parsed = Number(this.configService.get<string>(key));

    if (!Number.isInteger(parsed) || parsed <= 0) {
      return fallback;
    }

    return parsed;
  }
}
