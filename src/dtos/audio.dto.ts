import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

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
