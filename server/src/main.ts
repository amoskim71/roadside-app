import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as session from 'express-session';
import * as path from 'path';
import { NotFoundExceptionFilter } from './filters/not-found-exception.filter';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'a secret',
      saveUninitialized: false,
      resave: false, //@TODO: depends on session store
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, //1 day
      },
    }),
  );

  //serve react frontend
  app.use(express.static(path.resolve(__dirname, '../../client/build')));

  Logger.log(
    'Serving static assets from ' +
      path.resolve(__dirname, '../../client/build'),
    'Bootstrap',
  );
  app.useGlobalFilters(new NotFoundExceptionFilter());
  app.useGlobalPipes(new ValidationPipe());

  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT || 3001);
}
bootstrap();
