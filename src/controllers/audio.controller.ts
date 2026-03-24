import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import {
  ApiErrorResponseDto,
  AudioDto,
  AudioListResponseDto,
} from 'src/docs/swagger.schemas';
import { GetAudiosQueryDto, UpdateAudioTitleDto } from 'src/dtos/audio.dto';
import { AuthGuard } from 'src/infrastructure/auth.guard';
import { SubscriptionRateLimitGuard } from 'src/infrastructure/subscription-rate-limit.guard';
import { AudioService } from 'src/services/audio.service';

interface AuthenticatedRequest extends Request {
  user?: {
    sub?: string;
  };
}

@Controller('audio')
@UseGuards(SubscriptionRateLimitGuard, AuthGuard)
@ApiTags('audio')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Missing or invalid bearer token.',
  type: ApiErrorResponseDto,
})
@ApiTooManyRequestsResponse({
  description: 'Rate limit exceeded for current subscription tier.',
  type: ApiErrorResponseDto,
})
export class AudioController {
  constructor(private readonly audioService: AudioService) {}

  @Get('')
  @ApiOperation({
    summary: 'List my audio',
    description: 'Returns current user audio records using cursor pagination.',
  })
  @ApiOkResponse({
    description: 'Paginated audio response.',
    type: AudioListResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid pagination inputs.',
    type: ApiErrorResponseDto,
  })
  listMyAudios(
    @Req() req: AuthenticatedRequest,
    @Query() query: GetAudiosQueryDto,
  ) {
    const cursor = query.cursor?.trim() || undefined;
    const parsedLimit = Number(query.limit ?? 20);
    const limit = Math.min(
      Math.max(Number.isFinite(parsedLimit) ? parsedLimit : 20, 1),
      100,
    );

    return this.audioService.listUserAudios({
      userId: this.getUserId(req),
      cursor,
      limit,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get my audio by id',
    description: 'Returns one audio record owned by the authenticated user.',
  })
  @ApiParam({
    name: 'id',
    description: 'Audio UUID.',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Audio found.',
    type: AudioDto,
  })
  @ApiNotFoundResponse({
    description: 'Audio not found for user.',
    type: ApiErrorResponseDto,
  })
  getMyAudioById(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.audioService.getUserAudioById(this.getUserId(req), id);
  }

  @Put(':id')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  @ApiOperation({
    summary: 'Update my audio title',
    description: 'Updates the title of one audio record owned by the user.',
  })
  @ApiParam({
    name: 'id',
    description: 'Audio UUID.',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Updated audio.',
    type: AudioDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid payload or empty title.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Audio not found for user.',
    type: ApiErrorResponseDto,
  })
  updateMyAudioTitle(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateAudioTitleDto,
  ) {
    return this.audioService.updateUserAudioTitle(
      this.getUserId(req),
      id,
      body.title,
    );
  }

  private getUserId(req: AuthenticatedRequest): string {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Invalid access token payload.');
    }
    return userId;
  }
}
