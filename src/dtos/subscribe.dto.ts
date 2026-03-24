import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { SubscriptionTier } from 'src/docs/swagger.schemas';

export class SubscribeDto {
  @ApiProperty({
    description:
      'Subscription tier to apply. Only PAID can be initiated from this endpoint.',
    enum: SubscriptionTier,
    example: SubscriptionTier.PAID,
  })
  @IsEnum(SubscriptionTier)
  type!: SubscriptionTier;
}
