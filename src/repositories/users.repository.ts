import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma.service';
import { toUser } from 'src/prisma-mappers';

// This should be a real class/interface representing a user entity
export type User = any;

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) { }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return user ? user : null;
  }

  async create(input: {
    email: string;
    password: string;
    displayName: string;
  }) {
    const created = await this.prisma.user.create({
      data: {
        email: input.email,
        password: input.password,
        displayName: input.displayName,
      },
    });
    return toUser(created);
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? toUser(user) : null;
  }

  async findMany(params: { cursor?: string; limit: number }) {
    const { cursor, limit } = params;
    const users = await this.prisma.user.findMany({
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'asc' },
    });

    let nextCursor: string | null = null;
    if (users.length > limit) {
      nextCursor = users[limit].id;
      users.pop();
    }
    return { users: { data: users.map(toUser), meta: { next_cursor: nextCursor } } }
  };

  async updateById(
    id: string,
    input: {
      displayName?: string;
      password?: string;
    },
  ) {
    const data: {
      displayName?: string;
      password?: string;
    } = {};

    if (input.displayName !== undefined) {
      data.displayName = input.displayName;
    }
    if (input.password !== undefined) {
      data.password = input.password;
    }

    if (Object.keys(data).length === 0) {
      return this.findById(id);
    }

    const updatedRows = await this.prisma.user.updateMany({
      where: { id },
      data,
    });
    if (updatedRows.count === 0) {
      return null;
    }

    const updatedUser = await this.prisma.user.findUnique({ where: { id } });
    return updatedUser ? toUser(updatedUser) : null;
  }
}
