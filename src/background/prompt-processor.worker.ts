import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PromptStatus } from 'generated/prisma/client';
import { Job } from 'bullmq';
import { setTimeout as sleep } from 'node:timers/promises';
import {
  PROCESS_PROMPT_JOB,
  ProcessPromptJobData,
  PROMPT_PROCESSING_QUEUE,
} from 'src/background/prompt-jobs';
import { PromptRepository } from 'src/repositories/prompt.repository';

@Injectable()
@Processor(PROMPT_PROCESSING_QUEUE, { concurrency: 5 })
export class PromptProcessorWorker extends WorkerHost {
  private readonly logger = new Logger(PromptProcessorWorker.name);

  constructor(
    private readonly promptRepository: PromptRepository,
    private readonly configService: ConfigService,
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

    const prompt = await this.promptRepository.findById(promptId);
    if (!prompt) {
      this.logger.warn(`Prompt ${promptId} was not found. Skipping job ${job.id}.`);
      return;
    }

    if (prompt.status === PromptStatus.COMPLETED) {
      return prompt;
    }

    if (prompt.status === PromptStatus.PENDING) {
      const markedAsProcessing =
        await this.promptRepository.markProcessing(promptId);

      if (!markedAsProcessing) {
        this.logger.warn(`Prompt ${promptId} is already claimed by another worker.`);
        return;
      }
    }

    try {
      await sleep(this.getPositiveInt('PROMPT_PROCESSING_DELAY_MS', 5000));

      return await this.promptRepository.completeWithAudio({
        promptId,
        title: this.buildAudioTitle(prompt.text),
        url:
          this.configService.get<string>('PROMPT_AUDIO_URL')?.trim() ||
          '/audios/processed-prompt.mp3',
      });
    } catch (error) {
      await this.promptRepository.markPending(promptId);
      throw error;
    }
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
