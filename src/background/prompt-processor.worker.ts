import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { setTimeout as sleep } from 'node:timers/promises';
import {
  PROCESS_PROMPT_JOB,
  ProcessPromptJobData,
  PROMPT_PROCESSING_QUEUE,
} from 'src/background/prompt-jobs';
import { PromptNotificationPublisherService } from 'src/background/prompt-notification-publisher.service';
import { PromptWorkflowService } from 'src/services/prompt-workflow.service';

@Injectable()
@Processor(PROMPT_PROCESSING_QUEUE, { concurrency: 5 })
export class PromptProcessorWorker extends WorkerHost {
  private readonly logger = new Logger(PromptProcessorWorker.name);

  constructor(
    private readonly promptWorkflowService: PromptWorkflowService,
    private readonly configService: ConfigService,
    private readonly promptNotificationPublisher: PromptNotificationPublisherService,
  ) {
    super();
  }

  async process(job: Job<ProcessPromptJobData>) {
    if (job.name !== PROCESS_PROMPT_JOB) {
      this.logger.warn(`Ignoring unsupported processing job "${job.name}".`);
      return;
    }

    const promptId = job.data?.promptId;
    if (!promptId) {
      throw new Error('Missing promptId for prompt processing job.');
    }

    const claimResult =
      await this.promptWorkflowService.claimPromptForProcessing(promptId);
    if (claimResult.status === 'NOT_FOUND') {
      this.logger.warn(`Prompt ${promptId} was not found. Skipping job ${job.id}.`);
      return;
    }

    if (claimResult.status === 'ALREADY_COMPLETED') {
      return { promptId, status: 'COMPLETED' };
    }

    if (claimResult.status === 'ALREADY_CLAIMED') {
      this.logger.warn(`Prompt ${promptId} is already claimed by another worker.`);
      return;
    }

    try {
      await sleep(this.getPositiveInt('PROMPT_PROCESSING_DELAY_MS', 5000));

      const completed = await this.promptWorkflowService.completePromptWithAudio({
        promptId,
        title: this.buildAudioTitle(claimResult.promptText),
        url:
          this.configService.get<string>('PROMPT_AUDIO_URL')?.trim() ||
          '/audios/processed-prompt.mp3',
      });

      if (completed) {
        await this.publishPromptCompletedEvent(promptId);
      }

      return completed ? { promptId, status: 'COMPLETED' } : null;
    } catch (error) {
      await this.promptWorkflowService.markPromptPending(promptId);
      throw error;
    }
  }

  private async publishPromptCompletedEvent(promptId: string): Promise<void> {
    const event =
      await this.promptWorkflowService.buildPromptCompletedEvent(promptId);
    if (!event) {
      return;
    }

    await this.promptNotificationPublisher.publishPromptCompleted(event);
  }

  private buildAudioTitle(text: string): string {
    const normalized = text.trim();

    if (!normalized) {
      return 'Generated audio';
    }

    if (normalized.length <= 60) {
      return normalized;
    }

    return `${normalized.slice(0, 57)}...`;
  }

  private getPositiveInt(key: string, fallback: number): number {
    const parsed = Number(this.configService.get<string>(key));

    if (!Number.isInteger(parsed) || parsed <= 0) {
      return fallback;
    }

    return parsed;
  }
}
