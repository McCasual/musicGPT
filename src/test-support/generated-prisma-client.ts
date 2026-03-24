export const SubscriptionStatus = {
  FREE: 'FREE',
  PAID: 'PAID',
} as const;

export type SubscriptionStatus =
  (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export const PromptStatus = {
  COMPLETED: 'COMPLETED',
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
} as const;

export type PromptStatus = (typeof PromptStatus)[keyof typeof PromptStatus];

export interface User {
  id: string;
  email: string;
  password: string;
  displayName: string;
  subscriptionStatus: SubscriptionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Prompt {
  id: string;
  userId: string;
  text: string;
  status: PromptStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Audio {
  id: string;
  promptId: string;
  userId: string;
  title: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PrismaClient {
  audio = {
    create: async () => null,
    findFirst: async () => null,
    findMany: async () => [],
    updateMany: async () => ({ count: 0 }),
  };

  prompt = {
    create: async () => null,
    findMany: async () => [],
    findUnique: async () => null,
    update: async () => null,
    updateMany: async () => ({ count: 0 }),
  };

  refreshToken = {
    create: async () => null,
    findUnique: async () => null,
    update: async () => null,
    updateMany: async () => ({ count: 0 }),
  };

  subscription = {
    create: async () => null,
    findFirst: async () => null,
    update: async () => null,
    updateMany: async () => ({ count: 0 }),
  };

  user = {
    create: async () => null,
    findMany: async () => [],
    findUnique: async () => null,
    updateMany: async () => ({ count: 0 }),
  };

  constructor(..._args: unknown[]) {}

  async $connect() {}

  async $disconnect() {}

  async $transaction<T>(callback: (tx: PrismaClient) => Promise<T>): Promise<T> {
    return callback(this);
  }
}
