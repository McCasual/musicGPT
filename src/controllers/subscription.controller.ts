import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Query,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
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
@ApiBearerAuth()
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post('subscribe')
  subscribe(@Req() req: AuthenticatedRequest, @Body() body: SubscribeDto) {
    return this.subscriptionService.subscribe(this.getUserId(req), body);
  }

  @Post('cancel')
  cancel(@Req() req: AuthenticatedRequest) {
    return this.subscriptionService.cancelSubscription(this.getUserId(req));
  }

  @Get('status')
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
