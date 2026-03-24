import {
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { PromptDto } from 'src/dtos/prompt.dto';
import { AuthGuard } from 'src/infrastructure/auth.guard';
import { PromptService } from 'src/services/prompt.service';

interface AuthenticatedRequest extends Request {
  user?: {
    sub?: string;
  };
}

@Controller('prompts')
export class PromptController {
  constructor(private readonly promptService: PromptService) {}

  @Post('')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  root(@Req() req: AuthenticatedRequest, @Body() promptDto: PromptDto) {
    return this.promptService.generate(this.getUserId(req), promptDto);
  }

  private getUserId(req: AuthenticatedRequest): string {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Invalid access token payload.');
    }
    return userId;
  }
}
