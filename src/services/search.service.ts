import { BadRequestException, Injectable } from '@nestjs/common';
import { SearchRepository } from 'src/repositories/search.repository';

@Injectable()
export class SearchService {
  constructor(private readonly searchRepository: SearchRepository) {}

  async search(params: {
    q?: string;
    limit: number;
    usersCursor?: string;
    audioCursor?: string;
  }) {
    const q = params.q?.trim();
    if (!q) {
      throw new BadRequestException('q is required.');
    }

    return this.searchRepository.search({
      q,
      limit: params.limit,
      usersCursor: params.usersCursor,
      audioCursor: params.audioCursor,
    });
  }
}
