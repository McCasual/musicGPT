import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User, UsersRepository } from '../repositories/users.repository';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { SignUpDto } from 'src/dtos/signup.dto';
import * as bcrypt from 'bcrypt';
import { UserEntity } from 'src/prisma-mappers';
import { randomUUID, createHash } from 'crypto';
import { parseDurationToMs } from 'src/utils';
import { toUser } from 'src/prisma-mappers';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult extends AuthTokens {
  user: {
    id: string;
    email: string;
    displayName: string;
    subscriptionStatus: string;
  };
}

export interface AccessTokenPayload {
  sub: string;
  email: string;
  subscriptionStatus: User['subscriptionStatus'];
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  tokenId: string;
  type: 'refresh';
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async login(
    email: string,
    password: string,
  ): Promise<{ access_token: string }> {
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException();
    }
    const result = await bcrypt.compare(password, user.password);
    if (!result) {
      throw new UnauthorizedException();
    }
    return {
      access_token: await this.issueAccessToken(toUser(user)),
    };
  }

  async register(input: SignUpDto) {
    const exists = await this.usersRepository.findByEmail(input.email);

    if (exists) {
      throw new ConflictException('User with email already exists.');
    }

    const hash = await bcrypt.hash(input.password, 12);
    const user = await this.usersRepository.create({
      email: input.email,
      password: hash,
      displayName: input.displayName,
    });
    return { user, ...(await this.issueTokens(toUser(user))) };
  }

  private async issueAccessToken(user: UserEntity): Promise<string> {
    const accessTtl =
      this.configService.get<string>('ACCESS_TOKEN_TTL') || '15m';
    const accessTtlSeconds = Math.floor(parseDurationToMs(accessTtl) / 1000);
    const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET');

    const accessPayload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      subscriptionStatus: user.subscriptionStatus,
      type: 'access',
    };

    return this.jwtService.signAsync(accessPayload, {
      secret: accessSecret,
      expiresIn: accessTtlSeconds,
    });
  }

  private async issueTokens(user: UserEntity) {
    const refreshTtl =
      this.configService.get<string>('REFRESH_TOKEN_TTL') || '7d';
    const refreshTtlSeconds = Math.floor(parseDurationToMs(refreshTtl) / 1000);
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');

    const refreshTokenId = randomUUID();

    const refreshPayload: RefreshTokenPayload = {
      sub: user.id,
      tokenId: refreshTokenId,
      type: 'refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.issueAccessToken(user),
      this.jwtService.signAsync(refreshPayload, {
        secret: refreshSecret,
        expiresIn: refreshTtlSeconds,
      }),
    ]);

    const expiresAt = new Date(Date.now() + refreshTtlSeconds * 1000);
    await this.refreshTokenRepository.create({
      id: refreshTokenId,
      userId: user.id,
      tokenHash: this.hashToken(refreshToken),
      expiresAt,
    });
    return {
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const tokenRow = await this.refreshTokenRepository.findById(
      payload.tokenId,
    );
    const tokenHash = this.hashToken(refreshToken);

    if (
      !tokenRow ||
      tokenRow.tokenHash !== tokenHash ||
      tokenRow.expiresAt.getTime() < Date.now() ||
      tokenRow.revokedAt
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersRepository.findById(tokenRow.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const revoked = await this.refreshTokenRepository.revokeIfActive(
      tokenRow.id,
      tokenHash,
    );
    if (!revoked) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.issueTokens(user);
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    let payload: RefreshTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(token, {
        secret: refreshSecret,
      });
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return payload;
}
  async logout(refreshToken: string) {
    const payload = await this.verifyRefreshToken(refreshToken);
    const tokenHash = this.hashToken(refreshToken);
    const tokenRow = await this.refreshTokenRepository.findById(payload.tokenId);
    
    if (!tokenRow || tokenRow.tokenHash !== tokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    await this.refreshTokenRepository.revokeById(tokenRow.id);
  }
}
