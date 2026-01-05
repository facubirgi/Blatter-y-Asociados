import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import compression from 'compression';
// import cors from 'cors'; // Ya no se usa, CORS habilitado en NestFactory.create()

async function bootstrap() {
  console.log('🌐 Creando app NestJS...');
  console.log('📍 FRONTEND_URL:', process.env.FRONTEND_URL);
  console.log('📍 NODE_ENV:', process.env.NODE_ENV);

  const app = await NestFactory.create(AppModule);

  // 🌐 CORS - Configuración explícita con enableCors()
  console.log('🔧 Configurando CORS...');
  app.enableCors({
    origin: [
      'https://estudioblatter.netlify.app',
      'http://localhost:5173',
      'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin'],
    exposedHeaders: ['Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 200,
  });

  console.log('✅ CORS configurado correctamente');

  // 🔒 Seguridad: Helmet.js
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    }),
  );
  console.log('✅ Helmet activado para seguridad HTTP');

  // ⚡ Performance: Compresión gzip
  app.use(compression());

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
    .setDescription(
      'API para gestión de clientes y operaciones de estudio contable',
    )
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
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Aplicación corriendo en: http://0.0.0.0:${port}/api`);
  console.log(`📚 Documentación Swagger: http://0.0.0.0:${port}/api/docs`);
  console.log(`✅ Backend listo para recibir requests`);
}
bootstrap();