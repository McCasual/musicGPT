import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { PromptWorkerModule } from 'src/prompt-worker.module';

async function bootstrap() {
  try {
    await NestFactory.createApplicationContext(PromptWorkerModule);
    new Logger('PromptWorker').log('Prompt worker process is running.');
  } catch (error) {
    const logger = new Logger('PromptWorker');
    logger.error(
      'Prompt worker failed to start.',
      error instanceof Error ? error.stack : String(error),
    );
    process.exit(1);
  }
}

void bootstrap();
