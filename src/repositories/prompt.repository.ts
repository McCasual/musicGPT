import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma.service';
import {
  Prompt,
  PromptStatus,
  SubscriptionStatus,
} from 'generated/prisma/client';

export interface CompletePromptWithAudioInput {
  promptId: string;
  title: string;
  url: string;
}

export interface PromptSchedulingCandidate {
  id: string;
  userId: string;
  text: string;
  createdAt: Date;
  subscriptionStatus: SubscriptionStatus;
}

@Injectable()
export class PromptRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(text: string, userId: string): Promise<Prompt> {
    return this.prisma.prompt.create({
      data: {
        status: PromptStatus.PENDING,
        text: text,
        userId: userId,
      },
    });
  }

  async findPendingForScheduling(
    limit: number,
  ): Promise<PromptSchedulingCandidate[]> {
    const paidPrompts = await this.prisma.prompt.findMany({
      where: {
        status: PromptStatus.PENDING,
        user: {
          is: {
            subscriptionStatus: SubscriptionStatus.PAID,
          },
        },
      },
      take: limit,
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            subscriptionStatus: true,
          },
        },
      },
    });

    if (paidPrompts.length >= limit) {
      return paidPrompts.map((prompt) => ({
        createdAt: prompt.createdAt,
        id: prompt.id,
        subscriptionStatus: prompt.user.subscriptionStatus,
        text: prompt.text,
        userId: prompt.userId,
      }));
    }

    const freePrompts = await this.prisma.prompt.findMany({
      where: {
        status: PromptStatus.PENDING,
        user: {
          is: {
            subscriptionStatus: SubscriptionStatus.FREE,
          },
        },
      },
      take: limit - paidPrompts.length,
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            subscriptionStatus: true,
          },
        },
      },
    });

    return [...paidPrompts, ...freePrompts].map((prompt) => ({
      createdAt: prompt.createdAt,
      id: prompt.id,
      subscriptionStatus: prompt.user.subscriptionStatus,
      text: prompt.text,
      userId: prompt.userId,
    }));
  }

  async findById(id: string): Promise<Prompt | null> {
    return this.prisma.prompt.findUnique({
      where: { id },
    });
  }

  async findByIdWithLatestAudio(id: string) {
    return this.prisma.prompt.findUnique({
      where: { id },
      include: {
        audios: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  async markPending(id: string): Promise<boolean> {
    const updated = await this.prisma.prompt.updateMany({
      where: { id },
      data: { status: PromptStatus.PENDING },
    });

    return updated.count > 0;
  }

  async markProcessing(id: string): Promise<boolean> {
    const updated = await this.prisma.prompt.updateMany({
      where: {
        id,
        status: PromptStatus.PENDING,
      },
      data: { status: PromptStatus.PROCESSING },
    });

    return updated.count > 0;
  }

  async completeWithAudio(
    input: CompletePromptWithAudioInput,
  ): Promise<Prompt | null> {
    return this.prisma.$transaction(async (tx) => {
      const prompt = await tx.prompt.findUnique({
        where: { id: input.promptId },
      });

      if (!prompt) {
        return null;
      }

      if (prompt.status === PromptStatus.COMPLETED) {
        return prompt;
      }

      const existingAudio = await tx.audio.findFirst({
        where: { promptId: input.promptId },
      });

      if (!existingAudio) {
        await tx.audio.create({
          data: {
            promptId: input.promptId,
            title: input.title,
            url: input.url,
            userId: prompt.userId,
          },
        });
      }

      return tx.prompt.update({
        where: { id: input.promptId },
        data: { status: PromptStatus.COMPLETED },
      });
    });
  }
}
