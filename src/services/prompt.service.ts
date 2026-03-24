import { Injectable } from '@nestjs/common';
import { PromptRepository } from 'src/repositories/prompt.repository';

@Injectable()
export class PromptService {
  constructor(private readonly promptRepository: PromptRepository) {}

  async generate(userId: string, input: { text: string }) {
    return this.promptRepository.create(input.text, userId);
  }
}
