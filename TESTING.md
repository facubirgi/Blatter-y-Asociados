# 🧪 Documentación de Testing

Este documento describe la estrategia de testing implementada para el proyecto CRM Contable "Blatter y Asociados".

## 📋 Tabla de Contenidos

- [Tecnologías de Testing](#tecnologías-de-testing)
- [Estructura de Tests](#estructura-de-tests)
- [Ejecutar Tests](#ejecutar-tests)
- [Cobertura de Código](#cobertura-de-código)
- [CI/CD](#cicd)
- [Mejores Prácticas](#mejores-prácticas)

---

## 🛠️ Tecnologías de Testing

### Backend (NestJS)
- **Jest**: Framework de testing principal
- **@nestjs/testing**: Módulo de testing de NestJS
- **Supertest**: Testing de endpoints HTTP (E2E)
- **TypeScript**: Tipado fuerte en tests

### Frontend (React + Vite)
- **Vitest**: Framework de testing moderno y rápido
- **@testing-library/react**: Testing de componentes React
- **@testing-library/jest-dom**: Matchers personalizados para DOM
- **@testing-library/user-event**: Simulación de interacciones de usuario
- **jsdom**: Entorno DOM para tests

---

## 📁 Estructura de Tests

### Backend
```
backend/
├── src/
│   ├── auth/
│   │   ├── auth.service.ts
│   │   └── auth.service.spec.ts      ✅ 14 tests
│   ├── clientes/
│   │   ├── clientes.service.ts
│   │   └── clientes.service.spec.ts   ✅ 21 tests
│   ├── operaciones/
│   │   ├── operaciones.service.ts
│   │   └── operaciones.service.spec.ts ✅ 28 tests
│   └── ...
└── coverage/                           📊 Reportes de cobertura
```

**Total Backend: 63 tests unitarios**

### Frontend
```
frontend/
├── src/
│   ├── services/
│   │   ├── authService.ts
│   │   ├── authService.test.ts        ✅ 17 tests
│   │   ├── operacionService.ts
│   │   └── operacionService.test.ts   ✅ 18 tests
│   └── test/
│       └── setup.ts                    ⚙️ Configuración global
├── vitest.config.ts                    ⚙️ Config de Vitest
└── coverage/                           📊 Reportes de cobertura
```

**Total Frontend: 35 tests unitarios**

---

## 🚀 Ejecutar Tests

### Backend (NestJS + Jest)

```bash
cd backend

# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Generar reporte de cobertura
npm run test:cov

# Ejecutar tests en modo debug
npm run test:debug

# Ejecutar tests E2E
npm run test:e2e
```

### Frontend (React + Vitest)

```bash
cd frontend

# Ejecutar todos los tests una vez
npm test -- --run

# Ejecutar tests en modo watch
npm test

# Generar reporte de cobertura
npm run test:cov -- --run

# Ejecutar tests con UI interactiva
npm run test:ui
```

---

## 📊 Cobertura de Código

### Métricas Actuales

#### Backend
```
----------------------------|---------|----------|---------|---------|
File                        | % Stmts | % Branch | % Funcs | % Lines |
----------------------------|---------|----------|---------|---------|
All files                   |   47.23 |    32.78 |   43.83 |   48.13 |
 auth/auth.service.ts       |     100 |    86.66 |     100 |     100 |
 clientes/clientes.service  |     100 |    92.85 |     100 |     100 |
 operaciones/operaciones... |   87.36 |    64.28 |   93.75 |   87.09 |
----------------------------|---------|----------|---------|---------|
```

**Servicios críticos: 87-100% de cobertura** ✅

#### Frontend
```
Los servicios principales (authService, operacionService) tienen 100% de cobertura en tests unitarios.
```

### Objetivos de Cobertura

| Categoría          | Objetivo | Actual |
|--------------------|----------|--------|
| Services (Backend) | 90%      | 95%    |
| Services (Frontend)| 90%      | 100%   |
| Controllers        | 70%      | 0%*    |
| Componentes        | 60%      | 0%*    |

\* *Pendiente de implementación*

---

## 🔄 CI/CD

### GitHub Actions

El proyecto incluye un pipeline automatizado que se ejecuta en cada push y pull request:

**Archivo**: `.github/workflows/tests.yml`

#### Jobs del Pipeline:

1. **backend-tests**:
   - Instala Node.js 20
   - Levanta PostgreSQL en contenedor
   - Ejecuta linter
   - Ejecuta tests unitarios
   - Genera reporte de cobertura

2. **frontend-tests**:
   - Instala Node.js 20
   - Ejecuta linter
   - Ejecuta tests
   - Build de producción
   - Genera reporte de cobertura

3. **summary**:
   - Genera resumen de resultados

### Triggers

```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
```

### Estado de los Tests

Los badges de estado se pueden agregar al README:

```markdown
![Backend Tests](https://github.com/tu-usuario/estudio/workflows/Tests%20y%20Cobertura/badge.svg)
```

---

## ✅ Mejores Prácticas

### Principios de Testing

1. **AAA Pattern (Arrange, Act, Assert)**:
   ```typescript
   it('debe crear una operación', async () => {
     // Arrange
     const createDto = { tipo: 'DECLARACION_IMPUESTOS', ... };

     // Act
     const result = await service.create(createDto);

     // Assert
     expect(result).toBeDefined();
     expect(result.tipo).toBe(createDto.tipo);
   });
   ```

2. **Tests Aislados**:
   - Cada test debe ser independiente
   - Usar `beforeEach` para reset de estado
   - No compartir datos mutables entre tests

3. **Mocking de Dependencias**:
   ```typescript
   const mockRepository = {
     findOne: jest.fn(),
     save: jest.fn(),
   };
   ```

4. **Nombres Descriptivos**:
   ```typescript
   // ❌ Mal
   it('test 1', () => {});

   // ✅ Bien
   it('debe lanzar BadRequestException si el monto pagado excede el total', () => {});
   ```

5. **Coverage != Calidad**:
   - 100% de cobertura no garantiza tests de calidad
   - Enfocarse en casos de uso críticos y edge cases

### Testing de Casos Críticos

#### Backend - Pagos Parciales
```typescript
describe('Sistema de Pagos Parciales', () => {
  it('montoPagado = 0 → Estado: PENDIENTE');
  it('0 < montoPagado < monto → Estado: EN_PROCESO');
  it('montoPagado >= monto → Estado: COMPLETADO + fechaCompletado');
  it('montoPagado > monto → BadRequestException');
});
```

#### Frontend - Autenticación
```typescript
describe('authService', () => {
  it('debe guardar token en localStorage al login');
  it('debe eliminar token al logout');
  it('debe retornar true en isAuthenticated si hay token');
  it('debe hacer requests con token en headers');
});
```

---

## 🎯 Roadmap de Testing

### ✅ Completado
- [x] Configuración de Jest (Backend)
- [x] Configuración de Vitest (Frontend)
- [x] Tests unitarios de Services (Backend)
- [x] Tests unitarios de Services (Frontend)
- [x] CI/CD con GitHub Actions
- [x] Reportes de cobertura

### 🔄 En Progreso
- [ ] Tests de Controllers (Backend)
- [ ] Tests de Componentes React (Frontend)

### 📅 Futuro
- [ ] Tests E2E con Playwright
- [ ] Tests de integración con base de datos real
- [ ] Visual regression testing
- [ ] Performance testing
- [ ] Security testing (OWASP)

---

## 🐛 Debugging de Tests

### Backend (Jest)

```bash
# Modo debug con breakpoints
npm run test:debug

# Ejecutar un solo archivo
npm test -- auth.service.spec.ts

# Modo verbose
npm test -- --verbose
```

### Frontend (Vitest)

```bash
# UI interactiva para debugging
npm run test:ui

# Ejecutar un solo test
npm test -- -t "debe autenticar"

# Watch mode con coverage
npm run test:cov
```

---

## 📚 Recursos Adicionales

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)

---

## 🤝 Contribuir con Tests

Al agregar nuevas funcionalidades:

1. **Escribir tests primero** (TDD cuando sea posible)
2. **Cubrir casos felices y casos de error**
3. **Actualizar esta documentación** si agregas nuevos tipos de tests
4. **Verificar que CI pase** antes de mergear

---

**Última actualización**: Noviembre 2025
**Mantenido por**: Equipo de Desarrollo - Blatter y Asociados
