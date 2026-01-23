import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enable CORS with cookie credentials
  app.enableCors({
    origin: configService.get('clientUrl'),
    credentials: true,
  });

  // Add cookie parser middleware
  app.use(cookieParser());

  // Add global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  const config = new DocumentBuilder()
    .setTitle('API')
    .setDescription('API description')
    .setVersion('1.0')
    .addTag('user')
    .addCookieAuth('accessToken', {
      type: 'http',
      in: 'cookie',
      scheme: 'Bearer',
      description: 'JWT Token stored in HTTP-only cookie',
    })
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Token in Authorization header',
      },
      'bearer',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = configService.get('port');
  await app.listen(port);
  console.log(`Application is running on port ${port}`);
}
bootstrap();
