import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🌐 CORS - CONFIGURACIÓN MÁS EXPLÍCITA
  console.log('🌐 Configurando CORS...');
  console.log('📍 FRONTEND_URL:', process.env.FRONTEND_URL);
  console.log('📍 NODE_ENV:', process.env.NODE_ENV);

  app.enableCors({
    origin: (origin, callback) => {
      console.log('🔍 CORS Request from origin:', origin);
      // Permitir TODOS los orígenes temporalmente
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Credentials',
      'Access-Control-Allow-Headers',
      'Access-Control-Allow-Methods',
    ],
    exposedHeaders: ['Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 200, // Cambio de 204 a 200
    maxAge: 86400, // Cache preflight por 24 horas
  });

  console.log('✅ CORS configurado correctamente');

  // 🔒 Seguridad: Helmet.js TEMPORALMENTE DESACTIVADO PARA DEBUG
  // app.use(
  //   helmet({
  //     crossOriginResourcePolicy: { policy: 'cross-origin' },
  //     crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  //   }),
  // );
  console.log('⚠️ Helmet desactivado temporalmente para debug');

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

  console.log(`🚀 Aplicación corriendo en: http://localhost:${port}/api`);
  console.log(`📚 Documentación Swagger: http://localhost:${port}/api/docs`);
}
bootstrap();