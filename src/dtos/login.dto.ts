import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'hi@anukuladhikari.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'changeme' })
  @MinLength(8)
  password: string;
}
