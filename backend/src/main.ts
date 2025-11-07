import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para el frontend
  app.enableCors({
    origin: 'http://localhost:5173', // URL del frontend Vite
    credentials: true,
  });

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Prefijo global para la API
  app.setGlobalPrefix('api');

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('CRM Contable API')
    .setDescription('API para gestión de clientes y operaciones de estudio contable')
    .setVersion('1.0')
    .addTag('Autenticación', 'Endpoints de autenticación y gestión de usuarios')
    .addTag('Clientes', 'Gestión de clientes del estudio')
    .addTag('Operaciones', 'Gestión de operaciones contables')
    .addTag('Dashboard', 'Estadísticas y resúmenes')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingrese el token JWT',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'CRM Contable - API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Aplicación corriendo en: http://localhost:${port}/api`);
  console.log(`📚 Documentación Swagger: http://localhost:${port}/api/docs`);
}
bootstrap();