import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { LoginDto } from '../dtos/login.dto';
import { SignUpDto } from 'src/dtos/signup.dto';
import { AuthService } from '../services/auth.service';
import { RefreshDto } from 'src/dtos/refresh.dto';
import { AuthGuard } from 'src/infrastructure/auth.guard';
import { SubscriptionRateLimitGuard } from 'src/infrastructure/subscription-rate-limit.guard';

@Controller('auth')
@UseGuards(SubscriptionRateLimitGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('register')
  register(@Body() body: SignUpDto) {
    return this.authService.register(body);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refresh(@Body() body: RefreshDto) {
    return this.authService.refresh(body.refreshToken);
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  logout(@Body() body: RefreshDto) {
    return this.authService.logout(body.refreshToken);
  }
}
