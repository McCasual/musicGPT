import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './controllers/app.controller';
import { AuthController } from './controllers/auth.controller';
import { SubscriptionController } from './controllers/subscription.controller';
import { AuthGuard } from './infrastructure/auth.guard';
import { PrismaService } from './infrastructure/prisma.service';
import { RedisService } from './infrastructure/redis.service';
import { UsersRepository } from './repositories/users.repository';
import { SubscriptionRepository } from './repositories/subscription.repository';
import { AppService } from './services/app.service';
import { AuthService } from './services/auth.service';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { SubscriptionService } from './services/subscribe.service';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';
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
  ],
  controllers: [AppController, UserController, AuthController, SubscriptionController],
  providers: [
    AppService,
    AuthService,
    SubscriptionService,
    UserService,
    UsersRepository,
    SubscriptionRepository,
    RefreshTokenRepository,
    PrismaService,
    RedisService,
    AuthGuard,
  ],
})
export class AppModule {}
