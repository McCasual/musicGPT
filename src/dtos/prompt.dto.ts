import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class PromptDto {
  @ApiProperty({ example: "generate ankit shrestha's like music for me"})
  @IsString()
  @MinLength(10)
  text: string;
}