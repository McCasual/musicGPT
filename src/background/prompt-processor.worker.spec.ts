import { ConfigService } from '@nestjs/config';
import { PromptStatus } from 'generated/prisma/client';
import { Job } from 'bullmq';
import {
  PROCESS_PROMPT_JOB,
  ProcessPromptJobData,
} from 'src/background/prompt-jobs';
import { PromptProcessorWorker } from 'src/background/prompt-processor.worker';
import { PromptRepository } from 'src/repositories/prompt.repository';

describe('PromptProcessorWorker', () => {
  let promptRepository: {
    completeWithAudio: jest.Mock;
    findById: jest.Mock;
    markPending: jest.Mock;
    markProcessing: jest.Mock;
  };
  let configService: { get: jest.Mock };
  let worker: PromptProcessorWorker;

  beforeEach(() => {
    promptRepository = {
      completeWithAudio: jest.fn(),
      findById: jest.fn(),
      markPending: jest.fn(),
      markProcessing: jest.fn(),
    };

    configService = {
      get: jest.fn((key: string) => {
        if (key === 'PROMPT_PROCESSING_DELAY_MS') {
          return '1';
        }

        if (key === 'PROMPT_AUDIO_URL') {
          return '/audios/test.mp3';
        }

        return undefined;
      }),
    };

    worker = new PromptProcessorWorker(
      promptRepository as unknown as PromptRepository,
      configService as unknown as ConfigService,
    );
  });

  it('marks pending prompts as processing and completes them with audio', async () => {
    promptRepository.findById.mockResolvedValue({
      id: 'prompt-1',
      status: PromptStatus.PENDING,
      text: 'Generate a mellow synthwave track for me',
    });
    promptRepository.markProcessing.mockResolvedValue(true);
    promptRepository.completeWithAudio.mockResolvedValue({
      id: 'prompt-1',
      status: PromptStatus.COMPLETED,
    });

    await worker.process({
      data: { promptId: 'prompt-1' },
      id: 'job-1',
      name: PROCESS_PROMPT_JOB,
    } as Job<ProcessPromptJobData>);

    expect(promptRepository.markProcessing).toHaveBeenCalledWith('prompt-1');
    expect(promptRepository.completeWithAudio).toHaveBeenCalledWith({
      promptId: 'prompt-1',
      title: 'Generate a mellow synthwave track for me',
      url: '/audios/test.mp3',
    });
    expect(promptRepository.markPending).not.toHaveBeenCalled();
  });

  it('moves prompts back to pending if processing fails', async () => {
    promptRepository.findById.mockResolvedValue({
      id: 'prompt-2',
      status: PromptStatus.PENDING,
      text: 'Generate a mellow synthwave track for me',
    });
    promptRepository.markProcessing.mockResolvedValue(true);
    promptRepository.completeWithAudio.mockRejectedValue(new Error('boom'));

    await expect(
      worker.process({
        data: { promptId: 'prompt-2' },
        id: 'job-2',
        name: PROCESS_PROMPT_JOB,
      } as Job<ProcessPromptJobData>),
    ).rejects.toThrow('boom');

    expect(promptRepository.markPending).toHaveBeenCalledWith('prompt-2');
  });
});
