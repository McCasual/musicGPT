import { ConfigService } from '@nestjs/config';
import { SubscriptionStatus } from 'generated/prisma/client';
import { Queue } from 'bullmq';
import {
  PROCESS_PROMPT_JOB,
  PROMPT_SCHEDULER_JOB_ID,
  SCHEDULE_PENDING_PROMPTS_JOB,
} from 'src/background/prompt-jobs';
import { PromptQueueService } from 'src/background/prompt-queue.service';

describe('PromptQueueService', () => {
  let processingQueue: { add: jest.Mock };
  let schedulerQueue: { upsertJobScheduler: jest.Mock };
  let configService: { get: jest.Mock };
  let service: PromptQueueService;

  beforeEach(() => {
    processingQueue = {
      add: jest.fn(),
    };

    schedulerQueue = {
      upsertJobScheduler: jest.fn(),
    };

    configService = {
      get: jest.fn((key: string) => {
        if (key === 'PROMPT_SCHEDULER_CRON') {
          return '*/30 * * * * *';
        }

        if (key === 'PROMPT_SCHEDULER_BATCH_SIZE') {
          return '40';
        }

        return undefined;
      }),
    };

    service = new PromptQueueService(
      processingQueue as unknown as Queue,
      schedulerQueue as unknown as Queue,
      configService as unknown as ConfigService,
    );
  });

  it('registers the repeatable cron scheduler job', async () => {
    const registration = await service.registerScheduler();

    expect(registration).toEqual({
      batchSize: 40,
      cronPattern: '*/30 * * * * *',
    });
    expect(schedulerQueue.upsertJobScheduler).toHaveBeenCalledWith(
      PROMPT_SCHEDULER_JOB_ID,
      { pattern: '*/30 * * * * *' },
      {
        data: { batchSize: 40 },
        name: SCHEDULE_PENDING_PROMPTS_JOB,
        opts: {
          removeOnComplete: 1000,
          removeOnFail: 1000,
        },
      },
    );
  });

  it('assigns paid prompts a higher queue priority than free prompts', async () => {
    await service.enqueuePrompt({
      createdAt: new Date('2026-03-24T00:00:00.000Z'),
      id: 'paid-prompt',
      subscriptionStatus: SubscriptionStatus.PAID,
      text: 'paid prompt',
      userId: 'user-1',
    });
    await service.enqueuePrompt({
      createdAt: new Date('2026-03-24T00:00:00.000Z'),
      id: 'free-prompt',
      subscriptionStatus: SubscriptionStatus.FREE,
      text: 'free prompt',
      userId: 'user-2',
    });

    expect(processingQueue.add).toHaveBeenNthCalledWith(
      1,
      PROCESS_PROMPT_JOB,
      { promptId: 'paid-prompt' },
      expect.objectContaining({
        jobId: 'prompt-paid-prompt',
        priority: 1,
      }),
    );
    expect(processingQueue.add).toHaveBeenNthCalledWith(
      2,
      PROCESS_PROMPT_JOB,
      { promptId: 'free-prompt' },
      expect.objectContaining({
        jobId: 'prompt-free-prompt',
        priority: 10,
      }),
    );
  });
});
