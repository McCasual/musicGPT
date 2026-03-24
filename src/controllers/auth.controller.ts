import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LoginDto } from '../dtos/login.dto';
import {
  ApiErrorResponseDto,
  AuthLoginResponseDto,
  AuthRegisterResponseDto,
  AuthTokenPairResponseDto,
  LogoutResponseDto,
} from 'src/docs/swagger.schemas';
import { SignUpDto } from 'src/dtos/signup.dto';
import { AuthService } from '../services/auth.service';
import { RefreshDto } from 'src/dtos/refresh.dto';
import { AuthGuard } from 'src/infrastructure/auth.guard';
import { SubscriptionRateLimitGuard } from 'src/infrastructure/subscription-rate-limit.guard';

@Controller('auth')
@UseGuards(SubscriptionRateLimitGuard)
@ApiTags('auth')
@ApiTooManyRequestsResponse({
  description: 'Rate limit exceeded for current subscription tier.',
  type: ApiErrorResponseDto,
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({
    summary: 'Login',
    description:
      'Authenticates a user with email and password and returns an access token.',
  })
  @ApiOkResponse({
    description: 'Successful login response.',
    type: AuthLoginResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Request validation failed.',
    type: ApiErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials.',
    type: ApiErrorResponseDto,
  })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('register')
  @ApiOperation({
    summary: 'Register',
    description: 'Creates a user account and issues access + refresh tokens.',
  })
  @ApiCreatedResponse({
    description: 'Successful registration response.',
    type: AuthRegisterResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Request validation failed.',
    type: ApiErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'A user with this email already exists.',
    type: ApiErrorResponseDto,
  })
  register(@Body() body: SignUpDto) {
    return this.authService.register(body);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh tokens',
    description:
      'Verifies a refresh token, rotates it, and returns a new access/refresh pair.',
  })
  @ApiOkResponse({
    description: 'Tokens successfully refreshed.',
    type: AuthTokenPairResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Request validation failed.',
    type: ApiErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Refresh token is invalid, expired, or revoked.',
    type: ApiErrorResponseDto,
  })
  refresh(@Body() body: RefreshDto) {
    return this.authService.refresh(body.refreshToken);
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout',
    description: 'Revokes the provided refresh token.',
  })
  @ApiOkResponse({
    description: 'Logout completed and refresh token revoked.',
    type: LogoutResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Request validation failed.',
    type: ApiErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Refresh token is invalid.',
    type: ApiErrorResponseDto,
  })
  logout(@Body() body: RefreshDto) {
    return this.authService.logout(body.refreshToken);
  }
}
