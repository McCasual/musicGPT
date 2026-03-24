import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SubscriptionTier {
  FREE = 'FREE',
  PAID = 'PAID',
}

export enum PromptSimulationStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
}

export class ApiErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code for the failed request.',
    example: 400,
  })
  statusCode!: number;

  @ApiProperty({
    description: 'Error message returned by the API.',
    oneOf: [
      { type: 'string', example: 'Bad Request' },
      {
        type: 'array',
        items: { type: 'string' },
        example: ['q is required.'],
      },
    ],
  })
  message!: string | string[];

  @ApiPropertyOptional({
    description: 'Framework-generated short error label.',
    example: 'Bad Request',
  })
  error?: string;
}

export class CursorPaginationMetaDto {
  @ApiProperty({
    description: 'Opaque cursor to request the next page. Null means no more data.',
    nullable: true,
    example: 'f3d8a6a7-65f6-4f2a-9f6f-8fca12e7a1ad',
  })
  next_cursor!: string | null;
}

export class PublicUserDto {
  @ApiProperty({
    description: 'User identifier.',
    format: 'uuid',
    example: '1ce29f74-e63d-48b6-81f8-f0bf1ece96a0',
  })
  id!: string;

  @ApiProperty({
    description: 'Unique email address.',
    example: 'hi@anukuladhikari.com',
  })
  email!: string;

  @ApiProperty({
    description: 'Public display name.',
    example: 'Anukul Adhikari',
  })
  displayName!: string;

  @ApiProperty({
    description: 'Current subscription tier.',
    enum: SubscriptionTier,
    example: SubscriptionTier.FREE,
  })
  subscriptionStatus!: SubscriptionTier;

  @ApiProperty({
    description: 'Creation timestamp (ISO 8601).',
    format: 'date-time',
    example: '2026-03-24T09:12:31.234Z',
  })
  createdAt!: string;

  @ApiProperty({
    description: 'Last update timestamp (ISO 8601).',
    format: 'date-time',
    example: '2026-03-24T09:15:55.234Z',
  })
  updatedAt!: string;
}

export class UserSearchResultDto extends PublicUserDto {
  @ApiProperty({
    description: 'PostgreSQL full-text ranking score.',
    example: 0.7332,
  })
  fts_score!: number;
}

export class AudioDto {
  @ApiProperty({
    description: 'Audio identifier.',
    format: 'uuid',
    example: 'f3d8a6a7-65f6-4f2a-9f6f-8fca12e7a1ad',
  })
  id!: string;

  @ApiProperty({
    description: 'Prompt identifier that produced this audio.',
    format: 'uuid',
    example: 'fce2f3d8-aaaa-4f2a-9f6f-8fca12e7a1ad',
  })
  promptId!: string;

  @ApiProperty({
    description: 'Owner user identifier.',
    format: 'uuid',
    example: '1ce29f74-e63d-48b6-81f8-f0bf1ece96a0',
  })
  userId!: string;

  @ApiProperty({
    description: 'Title of generated audio.',
    example: 'Lo-fi beat v2',
  })
  title!: string;

  @ApiProperty({
    description: 'Resolvable URL for the generated audio.',
    example: '/audios/processed-prompt.mp3',
  })
  url!: string;

  @ApiProperty({
    description: 'Creation timestamp (ISO 8601).',
    format: 'date-time',
    example: '2026-03-24T09:22:10.123Z',
  })
  createdAt!: string;

  @ApiProperty({
    description: 'Last update timestamp (ISO 8601).',
    format: 'date-time',
    example: '2026-03-24T09:22:10.123Z',
  })
  updatedAt!: string;
}

export class AudioSearchResultDto extends AudioDto {
  @ApiProperty({
    description: 'PostgreSQL full-text ranking score.',
    example: 0.6148,
  })
  fts_score!: number;
}

export class UsersPageDto {
  @ApiProperty({
    description: 'User rows in the current page.',
    type: [PublicUserDto],
  })
  data!: PublicUserDto[];

  @ApiProperty({
    description: 'Pagination metadata for users page.',
    type: CursorPaginationMetaDto,
  })
  meta!: CursorPaginationMetaDto;
}

export class AudioPageDto {
  @ApiProperty({
    description: 'Audio rows in the current page.',
    type: [AudioDto],
  })
  data!: AudioDto[];

  @ApiProperty({
    description: 'Pagination metadata for audio page.',
    type: CursorPaginationMetaDto,
  })
  meta!: CursorPaginationMetaDto;
}

export class SearchUsersPageDto {
  @ApiProperty({
    description: 'Matched users for this page.',
    type: [UserSearchResultDto],
  })
  data!: UserSearchResultDto[];

  @ApiProperty({
    description: 'Pagination metadata for user search results.',
    type: CursorPaginationMetaDto,
  })
  meta!: CursorPaginationMetaDto;
}

export class SearchAudioPageDto {
  @ApiProperty({
    description: 'Matched audio rows for this page.',
    type: [AudioSearchResultDto],
  })
  data!: AudioSearchResultDto[];

  @ApiProperty({
    description: 'Pagination metadata for audio search results.',
    type: CursorPaginationMetaDto,
  })
  meta!: CursorPaginationMetaDto;
}

export class UsersListResponseDto {
  @ApiProperty({
    description: 'Paginated users response bucket.',
    type: UsersPageDto,
  })
  users!: UsersPageDto;
}

export class AudioListResponseDto {
  @ApiProperty({
    description: 'Paginated audio response bucket.',
    type: AudioPageDto,
  })
  audio!: AudioPageDto;
}

export class SearchResponseDto {
  @ApiProperty({
    description: 'Paginated user search bucket.',
    type: SearchUsersPageDto,
  })
  users!: SearchUsersPageDto;

  @ApiProperty({
    description: 'Paginated audio search bucket.',
    type: SearchAudioPageDto,
  })
  audio!: SearchAudioPageDto;
}

export class AuthLoginResponseDto {
  @ApiProperty({
    description: 'Short-lived bearer access token.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.access.token',
  })
  access_token!: string;
}

export class AuthTokenPairResponseDto {
  @ApiProperty({
    description: 'Short-lived bearer access token.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.access.token',
  })
  accessToken!: string;

  @ApiProperty({
    description: 'Longer-lived refresh token.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh.token',
  })
  refreshToken!: string;
}

export class AuthRegisterResponseDto extends AuthTokenPairResponseDto {
  @ApiProperty({
    description: 'Public profile for the created account.',
    type: PublicUserDto,
  })
  user!: PublicUserDto;
}

export class LogoutResponseDto {
  @ApiProperty({
    description: 'Logout status message.',
    example: 'Logged out.',
  })
  message!: string;
}

export class SubscriptionInitiateResponseDto {
  @ApiProperty({
    description: 'Human readable initiation message.',
    example: 'Khalti payment initiated.',
  })
  message!: string;

  @ApiProperty({
    description: 'Gateway transaction handle.',
    example: 'HTvA7f7sQFmYhL8DYM1WJx',
  })
  pidx!: string;

  @ApiProperty({
    description: 'Payment URL to complete checkout.',
    example: 'https://khalti.com/epayment/start/HTvA7f7sQFmYhL8DYM1WJx',
  })
  paymentUrl!: string;

  @ApiProperty({
    description: 'Gateway expiration timestamp, when provided by the gateway.',
    format: 'date-time',
    nullable: true,
    example: '2026-03-24T10:45:00.000Z',
  })
  expiresAt!: string | null;

  @ApiProperty({
    description: 'Purchase order identifier generated by backend.',
    example: 'subscription-1ce29f74-e63d-48b6-81f8-f0bf1ece96a0-1711298707357',
  })
  purchaseOrderId!: string;
}

export class SubscriptionCancelResponseDto {
  @ApiProperty({
    description: 'Human readable cancellation message.',
    example: 'Subscription canceled.',
  })
  message!: string;

  @ApiProperty({
    description: 'Tier after cancellation.',
    enum: SubscriptionTier,
    example: SubscriptionTier.FREE,
  })
  subscriptionStatus!: SubscriptionTier;
}

export class SubscriptionStatusResponseDto {
  @ApiProperty({
    description: 'Gateway transaction handle.',
    example: 'HTvA7f7sQFmYhL8DYM1WJx',
  })
  pidx!: string;

  @ApiProperty({
    description: 'Latest payment gateway status.',
    example: 'Completed',
  })
  status!: string;

  @ApiProperty({
    description: 'Gateway transaction id, if available.',
    nullable: true,
    example: '0000ABC123',
  })
  transactionId!: string | null;

  @ApiProperty({
    description: 'Whether paid subscription is currently active.',
    example: true,
  })
  active!: boolean;
}

export class PromptCreatedResponseDto {
  @ApiProperty({
    description: 'Prompt identifier.',
    format: 'uuid',
    example: 'db581091-82d7-4d0d-8305-b4ed8a7d3f39',
  })
  id!: string;

  @ApiProperty({
    description: 'Owner user identifier.',
    format: 'uuid',
    example: '1ce29f74-e63d-48b6-81f8-f0bf1ece96a0',
  })
  userId!: string;

  @ApiProperty({
    description: 'Prompt input text submitted by the user.',
    example: "generate ankit shrestha's like music for me",
  })
  text!: string;

  @ApiProperty({
    description:
      'Prompt simulation lifecycle status. New prompts start as PENDING, are moved to PROCESSING by workers, and finish as COMPLETED.',
    enum: PromptSimulationStatus,
    example: PromptSimulationStatus.PENDING,
  })
  status!: PromptSimulationStatus;

  @ApiProperty({
    description: 'Creation timestamp (ISO 8601).',
    format: 'date-time',
    example: '2026-03-24T09:26:33.221Z',
  })
  createdAt!: string;

  @ApiProperty({
    description: 'Last update timestamp (ISO 8601).',
    format: 'date-time',
    example: '2026-03-24T09:26:33.221Z',
  })
  updatedAt!: string;
}

export class PromptCompletedRealtimePromptDto {
  @ApiProperty({
    format: 'uuid',
    example: 'db581091-82d7-4d0d-8305-b4ed8a7d3f39',
  })
  id!: string;

  @ApiProperty({
    example: "generate ankit shrestha's like music for me",
  })
  text!: string;

  @ApiProperty({
    enum: [PromptSimulationStatus.COMPLETED],
    example: PromptSimulationStatus.COMPLETED,
  })
  status!: PromptSimulationStatus.COMPLETED;

  @ApiProperty({
    format: 'date-time',
    example: '2026-03-24T09:26:33.221Z',
  })
  createdAt!: string;

  @ApiProperty({
    format: 'date-time',
    example: '2026-03-24T09:26:41.221Z',
  })
  updatedAt!: string;
}

export class PromptCompletedRealtimeAudioDto {
  @ApiProperty({
    format: 'uuid',
    example: 'f3d8a6a7-65f6-4f2a-9f6f-8fca12e7a1ad',
  })
  id!: string;

  @ApiProperty({
    example: 'Lo-fi beat v2',
  })
  title!: string;

  @ApiProperty({
    example: '/audios/processed-prompt.mp3',
  })
  url!: string;

  @ApiProperty({
    format: 'date-time',
    example: '2026-03-24T09:26:41.001Z',
  })
  createdAt!: string;

  @ApiProperty({
    format: 'date-time',
    example: '2026-03-24T09:26:41.001Z',
  })
  updatedAt!: string;
}

export class PromptCompletedRealtimeEventDto {
  @ApiProperty({
    format: 'uuid',
    example: '1ce29f74-e63d-48b6-81f8-f0bf1ece96a0',
  })
  userId!: string;

  @ApiProperty({
    type: PromptCompletedRealtimePromptDto,
  })
  prompt!: PromptCompletedRealtimePromptDto;

  @ApiProperty({
    type: PromptCompletedRealtimeAudioDto,
    nullable: true,
  })
  audio!: PromptCompletedRealtimeAudioDto | null;
}
