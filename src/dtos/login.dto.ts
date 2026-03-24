import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Email used for account login.',
    example: 'hi@anukuladhikari.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Account password (minimum 8 characters).',
    example: 'changeme123',
    minLength: 8,
  })
  @MinLength(8)
  password!: string;
}
