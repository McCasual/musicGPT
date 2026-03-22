import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './controllers/app.controller';
import { AuthController } from './controllers/auth.controller';
import { AuthGuard } from './infrastructure/auth.guard';
import { PrismaService } from './infrastructure/prisma.service';
import { UsersRepository } from './repositories/users.repository';
import { AppService } from './services/app.service';
import { AuthService } from './services/auth.service';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';

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
  controllers: [AppController, AuthController],
  providers: [
    AppService,
    AuthService,
    UsersRepository,
    RefreshTokenRepository,
    PrismaService,
    AuthGuard,
  ],
})
export class AppModule {}
