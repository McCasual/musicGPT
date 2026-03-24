import { ApiProperty } from '@nestjs/swagger';
import { LoginDto } from './login.dto';

export class SignUpDto extends LoginDto {
  @ApiProperty({
    description: 'Public display name for the new account.',
    example: 'Anukul Adhikari',
  })
  displayName!: string;
}
