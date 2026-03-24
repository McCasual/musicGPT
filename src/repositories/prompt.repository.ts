import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma.service';
import { Prompt } from 'generated/prisma/client';

@Injectable()
export class PromptRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(text: string, userId: string): Promise<Prompt> {
    return this.prisma.prompt.create({
      data: {
        text: text,
        userId: userId,
      },
    });
  }
}
