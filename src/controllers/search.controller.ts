import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  ApiErrorResponseDto,
  SearchResponseDto,
} from 'src/docs/swagger.schemas';
import { SearchQueryDto } from 'src/dtos/search.dto';
import { AuthGuard } from 'src/infrastructure/auth.guard';
import { SubscriptionRateLimitGuard } from 'src/infrastructure/subscription-rate-limit.guard';
import { SearchService } from 'src/services/search.service';

@Controller('search')
@UseGuards(SubscriptionRateLimitGuard, AuthGuard)
@ApiTags('search')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Missing or invalid bearer token.',
  type: ApiErrorResponseDto,
})
@ApiTooManyRequestsResponse({
  description: 'Rate limit exceeded for current subscription tier.',
  type: ApiErrorResponseDto,
})
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('')
  @ApiOperation({
    summary: 'Unified search',
    description:
      'Performs full-text search across users and audio with independent cursor-based pagination for each result bucket.',
  })
  @ApiOkResponse({
    description: 'Search results grouped by entity type.',
    type: SearchResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Missing search query or invalid input.',
    type: ApiErrorResponseDto,
  })
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
