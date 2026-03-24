import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class GetAudiosQueryDto {
  @ApiPropertyOptional({
    description: 'Opaque cursor returned by the previous /audio page.',
    example: 'f3d8a6a7-65f6-4f2a-9f6f-8fca12e7a1ad',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Number of audios to return.',
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

export class UpdateAudioTitleDto {
  @ApiProperty({
    description: 'Updated title for the audio.',
    example: 'Lo-fi beat v2',
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  title!: string;
}
