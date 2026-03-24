import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { SearchQueryDto } from 'src/dtos/search.dto';
import { AuthGuard } from 'src/infrastructure/auth.guard';
import { SubscriptionRateLimitGuard } from 'src/infrastructure/subscription-rate-limit.guard';
import { SearchService } from 'src/services/search.service';

@Controller('search')
@UseGuards(SubscriptionRateLimitGuard, AuthGuard)
@ApiBearerAuth()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('')
  unifiedSearch(@Query() query: SearchQueryDto) {
    const parsedLimit = Number(query.limit ?? 20);
    const limit = Math.min(
      Math.max(Number.isFinite(parsedLimit) ? parsedLimit : 20, 1),
      100,
    );

    return this.searchService.search({
      q: query.q,
      limit,
      usersCursor: query.users_cursor?.trim() || undefined,
      audioCursor: query.audio_cursor?.trim() || undefined,
    });
  }
}
