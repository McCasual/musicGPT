import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from '../services/app.service';
import { AuthGuard } from '../infrastructure/auth.guard';
import { RedisService } from '../infrastructure/redis.service';
import { SubscriptionRateLimitGuard } from '../infrastructure/subscription-rate-limit.guard';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: AuthGuard,
          useValue: { canActivate: jest.fn().mockResolvedValue(true) },
        },
        {
          provide: SubscriptionRateLimitGuard,
          useValue: { canActivate: jest.fn().mockResolvedValue(true) },
        },
        {
          provide: RedisService,
          useValue: {
            incrementWithWindow: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
        {
          provide: JwtService,
          useValue: { verifyAsync: jest.fn() },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
