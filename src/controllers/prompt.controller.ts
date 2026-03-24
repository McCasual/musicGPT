import {
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  ApiErrorResponseDto,
  PromptCompletedRealtimeEventDto,
  PromptCreatedResponseDto,
} from 'src/docs/swagger.schemas';
import { Request } from 'express';
import { PromptDto } from 'src/dtos/prompt.dto';
import { AuthGuard } from 'src/infrastructure/auth.guard';
import { SubscriptionRateLimitGuard } from 'src/infrastructure/subscription-rate-limit.guard';
import { PROMPT_COMPLETED_EVENT_NAME } from 'src/realtime/prompt-notification.events';
import { PromptService } from 'src/services/prompt.service';

interface AuthenticatedRequest extends Request {
  user?: {
    sub?: string;
  };
}

@Controller('prompts')
@UseGuards(SubscriptionRateLimitGuard, AuthGuard)
@ApiTags('prompts')
@ApiBearerAuth()
@ApiExtraModels(PromptCompletedRealtimeEventDto)
@ApiUnauthorizedResponse({
  description: 'Missing or invalid bearer token.',
  type: ApiErrorResponseDto,
})
@ApiTooManyRequestsResponse({
  description: 'Rate limit exceeded for current subscription tier.',
  type: ApiErrorResponseDto,
})
export class PromptController {
  constructor(private readonly promptService: PromptService) {}

  @Post('')
  @ApiOperation({
    summary: 'Submit prompt simulation',
    description: [
      'Creates a new prompt and starts the prompt simulation lifecycle.',
      '',
      'Lifecycle:',
      '- `PENDING`: created by this endpoint.',
      '- `PROCESSING`: claimed by background worker.',
      '- `COMPLETED`: worker generated audio and finalized prompt.',
      '',
      'Subscription tiers affect scheduling priority: `PAID` prompts are enqueued ahead of `FREE` prompts.',
      '',
      `Realtime completion event: Socket.IO namespace \`/notifications\`, event \`${PROMPT_COMPLETED_EVENT_NAME}\`.`,
    ].join('\n'),
  })
  @ApiCreatedResponse({
    description:
      'Prompt accepted and persisted in `PENDING` state. Status transitions continue asynchronously. Completion event payload schema is documented as `PromptCompletedRealtimeEventDto`.',
    type: PromptCreatedResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid prompt payload.',
    type: ApiErrorResponseDto,
  })
  root(@Req() req: AuthenticatedRequest, @Body() promptDto: PromptDto) {
    return this.promptService.generate(this.getUserId(req), promptDto);
  }

  private getUserId(req: AuthenticatedRequest): string {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Invalid access token payload.');
    }
    return userId;
  }
}
