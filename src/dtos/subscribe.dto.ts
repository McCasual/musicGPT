import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class SubscribeDto {
  @ApiProperty({ example: 'PAID', enum: ['FREE', 'PAID'] })
  @IsIn(['FREE', 'PAID'])
  type: 'FREE' | 'PAID';
}
