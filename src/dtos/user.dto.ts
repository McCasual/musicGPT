import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class GetUsersQueryDto {
  @ApiPropertyOptional({
    description: 'Opaque cursor returned by the previous /users page.',
    example: 'f3d8a6a7-65f6-4f2a-9f6f-8fca12e7a1ad',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Number of users to return.',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Updated display name for the user.',
    example: 'Anukul Updated',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  displayName?: string;

  @ApiPropertyOptional({
    description: 'Updated password for the user.',
    example: 'changeme123',
    minLength: 8,
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
