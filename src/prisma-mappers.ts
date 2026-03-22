import { User, RefreshToken } from 'generated/prisma/client';

export interface UserEntity {
  id: string;
  email: string;
  password: string;
  displayName: string;
  subscriptionStatus: User['subscriptionStatus'];
  createdAt: Date;
  updatedAt: Date;
}

export interface RefreshTokenEntity {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt: Date | null;
  updatedAt: Date;
}

export function toUser(user: User): UserEntity {
  return {
    id: user.id,
    email: user.email,
    password: user.password,
    displayName: user.displayName,
    subscriptionStatus: user.subscriptionStatus,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function toRefreshToken(token: RefreshToken): RefreshTokenEntity {
  return {
    id: token.id,
    userId: token.userId,
    tokenHash: token.tokenHash,
    expiresAt: token.expiresAt,
    createdAt: token.createdAt,
    revokedAt: token.revokedAt,
    updatedAt: token.updatedAt,
  };
}
