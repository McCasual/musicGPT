import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma.service';
import { toUser } from 'src/prisma-mappers';

// This should be a real class/interface representing a user entity
export type User = any;

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

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
}