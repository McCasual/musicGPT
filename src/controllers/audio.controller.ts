import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { GetAudiosQueryDto, UpdateAudioTitleDto } from 'src/dtos/audio.dto';
import { AuthGuard } from 'src/infrastructure/auth.guard';
import { AudioService } from 'src/services/audio.service';

interface AuthenticatedRequest extends Request {
  user?: {
    sub?: string;
  };
}

@Controller('audio')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class AudioController {
  constructor(private readonly audioService: AudioService) {}

  @Get('')
  listMyAudios(
    @Req() req: AuthenticatedRequest,
    @Query() query: GetAudiosQueryDto,
  ) {
    const cursor = query.cursor?.trim() || undefined;
    const parsedLimit = Number(query.limit ?? 20);
    const limit = Math.min(
      Math.max(Number.isFinite(parsedLimit) ? parsedLimit : 20, 1),
      100,
    );

    return this.audioService.listUserAudios({
      userId: this.getUserId(req),
      cursor,
      limit,
    });
  }

  @Get(':id')
  getMyAudioById(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.audioService.getUserAudioById(this.getUserId(req), id);
  }

  @Put(':id')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  updateMyAudioTitle(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateAudioTitleDto,
  ) {
    return this.audioService.updateUserAudioTitle(
      this.getUserId(req),
      id,
      body.title,
    );
  }

  private getUserId(req: AuthenticatedRequest): string {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Invalid access token payload.');
    }
    return userId;
  }
}
