import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiErrorResponseDto } from 'src/docs/swagger.schemas';
import { AuthGuard } from 'src/infrastructure/auth.guard';
import { SubscriptionRateLimitGuard } from 'src/infrastructure/subscription-rate-limit.guard';
import { AppService } from '../services/app.service';

@Controller()
@UseGuards(SubscriptionRateLimitGuard, AuthGuard)
@ApiTags('system')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Missing or invalid bearer token.',
  type: ApiErrorResponseDto,
})
@ApiTooManyRequestsResponse({
  description: 'Rate limit exceeded for current subscription tier.',
  type: ApiErrorResponseDto,
})
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Protected health check',
    description:
      'Simple authenticated endpoint used to verify API availability and token validity.',
  })
  @ApiOkResponse({
    description: 'Health check response string.',
    schema: {
      type: 'string',
      example: 'Hello World!',
    },
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
