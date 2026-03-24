import { Job } from 'bullmq';
import {
  PromptSchedulingCandidate,
  SchedulePendingPromptsJobData,
  SCHEDULE_PENDING_PROMPTS_JOB,
} from 'src/background/prompt-jobs';
import { PromptQueueService } from 'src/background/prompt-queue.service';
import { PromptSchedulerWorker } from 'src/background/prompt-scheduler.worker';
import { PromptRepository } from 'src/repositories/prompt.repository';

describe('PromptSchedulerWorker', () => {
  let promptRepository: { findPendingForScheduling: jest.Mock };
  let promptQueueService: { enqueuePrompt: jest.Mock };
  let worker: PromptSchedulerWorker;

  beforeEach(() => {
    promptRepository = {
      findPendingForScheduling: jest.fn(),
    };

    promptQueueService = {
      enqueuePrompt: jest.fn(),
    };

    worker = new PromptSchedulerWorker(
      promptRepository as unknown as PromptRepository,
      promptQueueService as unknown as PromptQueueService,
    );
  });

  it('scans pending prompts and enqueues each one for processing', async () => {
    const prompts: PromptSchedulingCandidate[] = [
      {
        createdAt: new Date('2026-03-24T00:00:00.000Z'),
        id: 'prompt-1',
        subscriptionStatus: 'PAID',
        text: 'first prompt',
        userId: 'user-1',
      },
      {
        createdAt: new Date('2026-03-24T00:00:01.000Z'),
        id: 'prompt-2',
        subscriptionStatus: 'FREE',
        text: 'second prompt',
        userId: 'user-2',
      },
    ];

    promptRepository.findPendingForScheduling.mockResolvedValue(prompts);

    await worker.process({
      data: { batchSize: 2 },
      id: 'scheduler-job-1',
      name: SCHEDULE_PENDING_PROMPTS_JOB,
    } as Job<SchedulePendingPromptsJobData>);

    expect(promptRepository.findPendingForScheduling).toHaveBeenCalledWith(2);
    expect(promptQueueService.enqueuePrompt).toHaveBeenNthCalledWith(
      1,
      prompts[0],
    );
    expect(promptQueueService.enqueuePrompt).toHaveBeenNthCalledWith(
      2,
      prompts[1],
    );
  });
});
