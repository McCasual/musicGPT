import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { PromptQueueService } from 'src/background/prompt-queue.service';

@Injectable()
export class PromptSchedulerBootstrapService
  implements OnApplicationBootstrap
{
  private readonly logger = new Logger(PromptSchedulerBootstrapService.name);

  constructor(private readonly promptQueueService: PromptQueueService) {}

  async onApplicationBootstrap() {
    const registration = await this.promptQueueService.registerScheduler();

    this.logger.log(
      `Registered prompt scheduler with cron "${registration.cronPattern}" and batch size ${registration.batchSize}.`,
    );
  }
}
