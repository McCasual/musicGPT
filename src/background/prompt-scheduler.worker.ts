import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  PROMPT_SCHEDULER_QUEUE,
  SchedulePendingPromptsJobData,
  SCHEDULE_PENDING_PROMPTS_JOB,
} from 'src/background/prompt-jobs';
import { PromptQueueService } from 'src/background/prompt-queue.service';
import { PromptWorkflowService } from 'src/services/prompt-workflow.service';

@Injectable()
@Processor(PROMPT_SCHEDULER_QUEUE, { concurrency: 1 })
export class PromptSchedulerWorker extends WorkerHost {
  private readonly logger = new Logger(PromptSchedulerWorker.name);

  constructor(
    private readonly promptWorkflowService: PromptWorkflowService,
    private readonly promptQueueService: PromptQueueService,
  ) {
    super();
  }

  async process(job: Job<SchedulePendingPromptsJobData>) {
    if (job.name !== SCHEDULE_PENDING_PROMPTS_JOB) {
      this.logger.warn(`Ignoring unsupported scheduler job "${job.name}".`);
      return;
    }

    const pendingPrompts =
      await this.promptWorkflowService.findPendingForScheduling(
        this.resolveBatchSize(job.data?.batchSize),
      );

    for (const prompt of pendingPrompts) {
      await this.promptQueueService.enqueuePrompt(prompt);
    }

    return {
      enqueued: pendingPrompts.length,
    };
  }

  private resolveBatchSize(batchSize?: number): number {
    if (!Number.isInteger(batchSize) || batchSize! <= 0) {
      return 25;
    }

    return batchSize!;
  }
}
