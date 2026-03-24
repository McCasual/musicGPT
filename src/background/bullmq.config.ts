import { BullRootModuleOptions } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';

export function createBullmqRootOptions(
  configService: ConfigService,
): BullRootModuleOptions {
  return {
    connection: {
      url: configService.get<string>('REDIS_URL')?.trim() || 'redis://localhost:6379',
    },
  };
}
