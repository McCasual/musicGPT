import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './controllers/app.controller';
import { AuthController } from './controllers/auth.controller';
import { SubscriptionController } from './controllers/subscription.controller';
import { AuthGuard } from './infrastructure/auth.guard';
import { PrismaService } from './infrastructure/prisma.service';
import { RedisService } from './infrastructure/redis.service';
import { SubscriptionRateLimitGuard } from './infrastructure/subscription-rate-limit.guard';
import { PromptNotificationSubscriberService } from './realtime/prompt-notification-subscriber.service';
import { PromptNotificationsGateway } from './realtime/prompt-notifications.gateway';
import { UsersRepository } from './repositories/users.repository';
import { SubscriptionRepository } from './repositories/subscription.repository';
import { AppService } from './services/app.service';
import { AuthService } from './services/auth.service';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { SubscriptionService } from './services/subscribe.service';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';
import { AudioController } from './controllers/audio.controller';
import { PromptController } from './controllers/prompt.controller';
import { SearchController } from './controllers/search.controller';
import { AudioRepository } from './repositories/audio.repository';
import { PromptRepository } from './repositories/prompt.repository';
import { SearchRepository } from './repositories/search.repository';
import { AudioService } from './services/audio.service';
import { PromptService } from './services/prompt.service';
import { SearchService } from './services/search.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.register({
      global: true,
      secret: 'supersecret-changelater',
      signOptions: { expiresIn: '60s' },
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
    }),
  ],
  controllers: [
    AppController,
    UserController,
    AuthController,
    SubscriptionController,
    PromptController,
    AudioController,
    SearchController,
  ],
  providers: [
    AppService,
    AuthService,
    SubscriptionService,
    AudioService,
    SearchService,
    UserService,
    AudioRepository,
    SearchRepository,
    UsersRepository,
    PromptRepository,
    PromptService,
    SubscriptionRepository,
    RefreshTokenRepository,
    PrismaService,
    RedisService,
    PromptNotificationsGateway,
    PromptNotificationSubscriberService,
    AuthGuard,
    SubscriptionRateLimitGuard,
  ],
})
export class AppModule {}
