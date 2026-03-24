import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { AccessTokenPayload } from 'src/services/auth.service';
import { RedisService } from './redis.service';

type SubscriptionStatus = 'FREE' | 'PAID';

interface RateLimitIdentity {
  key: string;
  subscriptionStatus: SubscriptionStatus;
}

@Injectable()
export class SubscriptionRateLimitGuard implements CanActivate {
  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const identity = await this.resolveIdentity(request);
    const windowSeconds = this.getPositiveNumberConfig(
      'RATE_LIMIT_WINDOW_SECONDS',
      60,
    );
    const limit =
      identity.subscriptionStatus === 'PAID'
        ? this.getPositiveNumberConfig('RATE_LIMIT_PAID_LIMIT', 120)
        : this.getPositiveNumberConfig('RATE_LIMIT_FREE_LIMIT', 30);

    const key = `rate-limit:${identity.subscriptionStatus}:${identity.key}`;
    const { count, resetInSeconds } =
      await this.redisService.incrementWithWindow(key, windowSeconds);

    response.setHeader('X-RateLimit-Limit', String(limit));
    response.setHeader(
      'X-RateLimit-Remaining',
      String(Math.max(limit - count, 0)),
    );
    response.setHeader('X-RateLimit-Reset', String(resetInSeconds));

    if (count > limit) {
      throw new HttpException(
        'Rate limit exceeded for current subscription plan',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private async resolveIdentity(request: Request): Promise<RateLimitIdentity> {
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      return {
        key: this.getAnonymousKey(request),
        subscriptionStatus: 'FREE',
      };
    }

    const payload = await this.verifyAccessToken(token);
    if (!payload || !payload.sub) {
      return {
        key: this.getAnonymousKey(request),
        subscriptionStatus: 'FREE',
      };
    }

    const subscriptionStatus: SubscriptionStatus =
      payload.subscriptionStatus === 'PAID' ? 'PAID' : 'FREE';

    return {
      key: payload.sub,
      subscriptionStatus,
    };
  }

  private async verifyAccessToken(
    token: string,
  ): Promise<AccessTokenPayload | null> {
    const secret = this.configService.get<string>('JWT_ACCESS_SECRET');
    if (!secret) {
      return null;
    }

    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(
        token,
        {
          secret,
        },
      );

      if (payload.type !== 'access') {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private getAnonymousKey(request: Request): string {
    return request.ip || request.socket.remoteAddress || 'anonymous';
  }

  private getPositiveNumberConfig(key: string, fallback: number): number {
    const raw = this.configService.get<string>(key);
    if (!raw) {
      return fallback;
    }

    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return fallback;
    }

    return Math.floor(parsed);
  }
}
