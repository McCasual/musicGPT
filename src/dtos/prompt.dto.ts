import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class PromptDto {
  @ApiProperty({
    description: 'Prompt text used by the simulation worker to generate audio.',
    example: "generate ankit shrestha's like music for me",
    minLength: 10,
  })
  @IsString()
  @MinLength(10)
  text!: string;
}
