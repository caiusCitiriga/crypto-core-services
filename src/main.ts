import helmet from 'helmet';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppConfig } from '@core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());
  const allowedOrigins = AppConfig.allowedRestOrigins;
  app.enableCors({
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
  });

  if (AppConfig.enableSwagger) {
    const config = new DocumentBuilder()
      .setTitle('Crypto Core Services API')
      .build();

    SwaggerModule.setup(
      'swagger',
      app,
      SwaggerModule.createDocument(app, config),
    );
  }

  await app
    .listen(AppConfig.port)
    .then(() =>
      Logger.verbose(`[CCS] Server running on port: ${AppConfig.port}`),
    );
  await app.startAllMicroservices();
}
bootstrap();
