import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadGatewayResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  ApiErrorResponseDto,
  SubscriptionCancelResponseDto,
  SubscriptionInitiateResponseDto,
  SubscriptionStatusResponseDto,
} from 'src/docs/swagger.schemas';
import { Request } from 'express';
import { SubscribeDto } from 'src/dtos/subscribe.dto';
import { AuthGuard } from 'src/infrastructure/auth.guard';
import { SubscriptionRateLimitGuard } from 'src/infrastructure/subscription-rate-limit.guard';
import { SubscriptionService } from 'src/services/subscribe.service';

interface AuthenticatedRequest extends Request {
  user?: {
    sub?: string;
  };
}

@Controller('subscription')
@UseGuards(SubscriptionRateLimitGuard, AuthGuard)
@ApiTags('subscription')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Missing or invalid bearer token.',
  type: ApiErrorResponseDto,
})
@ApiTooManyRequestsResponse({
  description: 'Rate limit exceeded for current subscription tier.',
  type: ApiErrorResponseDto,
})
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post('subscribe')
  @ApiOperation({
    summary: 'Initiate paid subscription',
    description:
      'Creates a Khalti payment session for the `PAID` tier. This endpoint only accepts `PAID` requests.',
  })
  @ApiCreatedResponse({
    description: 'Paid subscription checkout session initiated.',
    type: SubscriptionInitiateResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid request payload or unsupported subscription type.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'User already has an active paid subscription.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found.',
    type: ApiErrorResponseDto,
  })
  @ApiBadGatewayResponse({
    description: 'Payment gateway initiation failed.',
    type: ApiErrorResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Gateway integration config is missing or invalid.',
    type: ApiErrorResponseDto,
  })
  subscribe(@Req() req: AuthenticatedRequest, @Body() body: SubscribeDto) {
    return this.subscriptionService.subscribe(this.getUserId(req), body);
  }

  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel subscription',
    description:
      'Cancels the active subscription and resets the user tier back to `FREE`.',
  })
  @ApiOkResponse({
    description: 'Subscription canceled.',
    type: SubscriptionCancelResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found.',
    type: ApiErrorResponseDto,
  })
  cancel(@Req() req: AuthenticatedRequest) {
    return this.subscriptionService.cancelSubscription(this.getUserId(req));
  }

  @Get('status')
  @ApiOperation({
    summary: 'Sync payment status',
    description:
      'Looks up payment status by `pidx`, syncs stored subscription status, and updates the effective user tier.',
  })
  @ApiQuery({
    name: 'pidx',
    required: true,
    description: 'Khalti payment identifier returned during initiation.',
    example: 'HTvA7f7sQFmYhL8DYM1WJx',
  })
  @ApiOkResponse({
    description: 'Latest subscription payment status.',
    type: SubscriptionStatusResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Missing required query parameter `pidx`.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Subscription not found for provided pidx.',
    type: ApiErrorResponseDto,
  })
  @ApiBadGatewayResponse({
    description: 'Payment gateway lookup failed.',
    type: ApiErrorResponseDto,
  })
  updateSubscriptionStatus(@Query('pidx') pidx: string) {
    const normalizedPidx = pidx?.trim();
    if (!normalizedPidx) {
      throw new BadRequestException("Query parameter 'pidx' is required.");
    }

    return this.subscriptionService.checkPaymentStatus(normalizedPidx);
  }

  private getUserId(req: AuthenticatedRequest): string {
    const userId = req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException('Invalid access token payload.');
    }

    return userId;
  }
}
