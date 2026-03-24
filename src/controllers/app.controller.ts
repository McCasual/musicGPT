import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/infrastructure/auth.guard';
import { SubscriptionRateLimitGuard } from 'src/infrastructure/subscription-rate-limit.guard';
import { AppService } from '../services/app.service';

@Controller()
@UseGuards(SubscriptionRateLimitGuard, AuthGuard)
@ApiBearerAuth()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
