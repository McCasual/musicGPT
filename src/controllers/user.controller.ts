import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  ApiErrorResponseDto,
  PublicUserDto,
  UsersListResponseDto,
} from 'src/docs/swagger.schemas';
import { GetUsersQueryDto, UpdateUserDto } from 'src/dtos/user.dto';
import { AuthGuard } from 'src/infrastructure/auth.guard';
import { SubscriptionRateLimitGuard } from 'src/infrastructure/subscription-rate-limit.guard';
import { UserService } from 'src/services/user.service';

@Controller('users')
@UseGuards(SubscriptionRateLimitGuard, AuthGuard)
@ApiTags('users')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Missing or invalid bearer token.',
  type: ApiErrorResponseDto,
})
@ApiTooManyRequestsResponse({
  description: 'Rate limit exceeded for current subscription tier.',
  type: ApiErrorResponseDto,
})
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({
    summary: 'List users',
    description: 'Returns users using cursor-based pagination.',
  })
  @ApiOkResponse({
    description: 'Paginated users response.',
    type: UsersListResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid pagination inputs.',
    type: ApiErrorResponseDto,
  })
  listUsers(@Query() query: GetUsersQueryDto) {
    const cursor = query.cursor?.trim() || undefined;
    const parsedLimit = Number(query.limit ?? 20);
    const limit = Math.min(
      Math.max(Number.isFinite(parsedLimit) ? parsedLimit : 20, 1),
      100,
    );

    return this.userService.getUsers({
      cursor,
      limit,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by id',
    description: 'Returns one public user profile by UUID.',
  })
  @ApiParam({
    name: 'id',
    description: 'User UUID.',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'User found.',
    type: PublicUserDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found.',
    type: ApiErrorResponseDto,
  })
  getUserById(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.getUserById(id);
  }

  @Put(':id')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  @ApiOperation({
    summary: 'Update user',
    description: 'Updates a user displayName and/or password.',
  })
  @ApiParam({
    name: 'id',
    description: 'User UUID.',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Updated user profile.',
    type: PublicUserDto,
  })
  @ApiBadRequestResponse({
    description:
      'Invalid payload, empty displayName, or no updatable fields provided.',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found.',
    type: ApiErrorResponseDto,
  })
  updateUserById(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateUserDto,
  ) {
    return this.userService.updateUser(id, body);
  }
}
