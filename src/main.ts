import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Self Backend API')
    .setDescription(
      [
        'API documentation for authentication, subscription management, prompt simulation, search, users, and audio.',
        '',
        'Subscription tiers:',
        '- FREE: lower request throughput and lower prompt scheduling priority.',
        '- PAID: higher request throughput and higher prompt scheduling priority.',
        '',
        'Prompt simulation lifecycle:',
        '- `PENDING`: prompt accepted by API and waiting to be scheduled.',
        '- `PROCESSING`: prompt picked by worker and simulation is running.',
        '- `COMPLETED`: simulation finished and generated audio is stored.',
        '',
        'Realtime completion notifications are emitted on Socket.IO namespace `/notifications` with event name `prompt.completed`.',
      ].join('\n'),
    )
    .setVersion('1.0.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Supply a valid access token in the format: Bearer <token>.',
    })
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
