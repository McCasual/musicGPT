import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { PromptSchedulerModule } from 'src/prompt-scheduler.module';

async function bootstrap() {
  try {
    await NestFactory.createApplicationContext(PromptSchedulerModule);
    new Logger('PromptScheduler').log('Prompt scheduler process is running.');
  } catch (error) {
    const logger = new Logger('PromptScheduler');
    logger.error(
      'Prompt scheduler failed to start.',
      error instanceof Error ? error.stack : String(error),
    );
    process.exit(1);
  }
}

void bootstrap();
