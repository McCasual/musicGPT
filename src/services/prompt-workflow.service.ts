import { Injectable } from '@nestjs/common';
import { PromptSchedulingCandidate } from 'src/background/prompt-jobs';
import { PromptCompletedRealtimeEvent } from 'src/realtime/prompt-notification.events';
import {
  CompletePromptWithAudioInput,
  PromptRepository,
} from 'src/repositories/prompt.repository';

export type ClaimPromptForProcessingResult =
  | { status: 'NOT_FOUND' }
  | { status: 'ALREADY_COMPLETED' }
  | { status: 'ALREADY_CLAIMED' }
  | { status: 'CLAIMED'; promptText: string };

@Injectable()
export class PromptWorkflowService {
  constructor(private readonly promptRepository: PromptRepository) {}

  async findPendingForScheduling(
    limit: number,
  ): Promise<PromptSchedulingCandidate[]> {
    const candidates = await this.promptRepository.findPendingForScheduling(limit);
    return candidates.map((candidate) => ({
      id: candidate.id,
      userId: candidate.userId,
      text: candidate.text,
      createdAt: candidate.createdAt,
      subscriptionStatus:
        candidate.subscriptionStatus === 'PAID' ? 'PAID' : 'FREE',
    }));
  }

  async claimPromptForProcessing(
    promptId: string,
  ): Promise<ClaimPromptForProcessingResult> {
    const prompt = await this.promptRepository.findById(promptId);
    if (!prompt) {
      return { status: 'NOT_FOUND' };
    }

    if (prompt.status === 'COMPLETED') {
      return { status: 'ALREADY_COMPLETED' };
    }

    if (prompt.status === 'PENDING') {
      const markedAsProcessing = await this.promptRepository.markProcessing(
        promptId,
      );

      if (!markedAsProcessing) {
        return { status: 'ALREADY_CLAIMED' };
      }
    }

    return { status: 'CLAIMED', promptText: prompt.text };
  }

  async completePromptWithAudio(
    input: CompletePromptWithAudioInput,
  ): Promise<boolean> {
    const completedPrompt = await this.promptRepository.completeWithAudio(input);
    return Boolean(completedPrompt && completedPrompt.status === 'COMPLETED');
  }

  async markPromptPending(promptId: string): Promise<void> {
    await this.promptRepository.markPending(promptId);
  }

  async buildPromptCompletedEvent(
    promptId: string,
  ): Promise<PromptCompletedRealtimeEvent | null> {
    const completedPrompt =
      await this.promptRepository.findByIdWithLatestAudio(promptId);

    if (!completedPrompt || completedPrompt.status !== 'COMPLETED') {
      return null;
    }

    const latestAudio = completedPrompt.audios[0] ?? null;

    return {
      userId: completedPrompt.userId,
      prompt: {
        id: completedPrompt.id,
        text: completedPrompt.text,
        status: 'COMPLETED',
        createdAt: completedPrompt.createdAt.toISOString(),
        updatedAt: completedPrompt.updatedAt.toISOString(),
      },
      audio: latestAudio
        ? {
            id: latestAudio.id,
            title: latestAudio.title,
            url: latestAudio.url,
            createdAt: latestAudio.createdAt.toISOString(),
            updatedAt: latestAudio.updatedAt.toISOString(),
          }
        : null,
    };
  }
}
