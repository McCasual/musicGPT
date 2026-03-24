import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AudioRepository } from 'src/repositories/audio.repository';

@Injectable()
export class AudioService {
  constructor(private readonly audioRepository: AudioRepository) {}

  async listUserAudios(userId: string) {
    return this.audioRepository.findManyByUserId(userId);
  }

  async getUserAudioById(userId: string, audioId: string) {
    const audio = await this.audioRepository.findByIdForUser(audioId, userId);
    if (!audio) {
      throw new NotFoundException('Audio not found.');
    }
    return audio;
  }

  async updateUserAudioTitle(userId: string, audioId: string, title: string) {
    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
      throw new BadRequestException('title cannot be empty.');
    }

    const updated = await this.audioRepository.updateTitleForUser(
      audioId,
      userId,
      normalizedTitle,
    );

    if (!updated) {
      throw new NotFoundException('Audio not found.');
    }

    return updated;
  }
}
