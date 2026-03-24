import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from 'src/dtos/user.dto';
import { RedisService } from 'src/infrastructure/redis.service';
import { UserEntity } from 'src/prisma-mappers';
import { UsersRepository } from 'src/repositories/users.repository';

@Injectable()
export class UserService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly redisService: RedisService,
  ) {}

  async getUsers(params: { cursor?: string; limit: number }) {
    const { cursor, limit } = params;
    const cacheKey = `users:cursor=${cursor ?? 'null'}:limit=${limit}`;
    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const result = await this.usersRepository.findMany({ cursor, limit });
    this.redisService.set(cacheKey, result, 60);
    return result;
  }

  async getUserById(id: string) {
    const cacheKey = this.getUserByIdCacheKey(id);
    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const publicUser = this.toPublicUser(user);
    void this.redisService.set(cacheKey, publicUser, 60);
    return publicUser;
  }

  async updateUser(id: string, input: UpdateUserDto) {
    if (input.displayName === undefined && input.password === undefined) {
      throw new BadRequestException(
        'At least one of displayName or password must be provided.',
      );
    }

    const updatePayload: {
      displayName?: string;
      password?: string;
    } = {};

    if (input.displayName !== undefined) {
      const normalizedDisplayName = input.displayName.trim();
      if (!normalizedDisplayName) {
        throw new BadRequestException('displayName cannot be empty.');
      }
      updatePayload.displayName = normalizedDisplayName;
    }

    if (input.password !== undefined) {
      updatePayload.password = await bcrypt.hash(input.password, 12);
    }

    const updated = await this.usersRepository.updateById(id, updatePayload);
    if (!updated) {
      throw new NotFoundException('User not found.');
    }

    void this.redisService.del(this.getUserByIdCacheKey(id));
    return this.toPublicUser(updated);
  }

  private getUserByIdCacheKey(id: string): string {
    return `users:id=${id}`;
  }

  private toPublicUser(user: UserEntity) {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      subscriptionStatus: user.subscriptionStatus,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
