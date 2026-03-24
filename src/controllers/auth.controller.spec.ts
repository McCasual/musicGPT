import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthGuard } from '../infrastructure/auth.guard';
import { RedisService } from '../infrastructure/redis.service';
import { SubscriptionRateLimitGuard } from '../infrastructure/subscription-rate-limit.guard';
import { AuthService } from '../services/auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: { signIn: jest.fn() },
        },
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
          provide: JwtService,
          useValue: { verifyAsync: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
