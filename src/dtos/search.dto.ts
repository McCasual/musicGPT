import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class SearchQueryDto {
  @ApiPropertyOptional({
    description: 'Search query text.',
    example: 'ankit',
    minLength: 1,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  q?: string;

  @ApiPropertyOptional({
    description: 'Number of results per entity type to return.',
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

  @ApiPropertyOptional({
    description: 'Cursor for users search results.',
    example: 'f3d8a6a7-65f6-4f2a-9f6f-8fca12e7a1ad',
  })
  @IsOptional()
  @IsString()
  users_cursor?: string;

  @ApiPropertyOptional({
    description: 'Cursor for audio search results.',
    example: 'f3d8a6a7-65f6-4f2a-9f6f-8fca12e7a1ad',
  })
  @IsOptional()
  @IsString()
  audio_cursor?: string;
}
