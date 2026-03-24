import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { UpdateAudioTitleDto } from 'src/dtos/audio.dto';
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
  listMyAudios(@Req() req: AuthenticatedRequest) {
    return this.audioService.listUserAudios(this.getUserId(req));
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
    return this.audioService.updateUserAudioTitle(this.getUserId(req), id, body.title);
  }

  private getUserId(req: AuthenticatedRequest): string {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Invalid access token payload.');
    }
    return userId;
  }
}
