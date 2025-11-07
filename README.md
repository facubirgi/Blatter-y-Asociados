# 📊 CRM Contable - Blatter y Asociados

Sistema de gestión contable completo con seguimiento de operaciones, clientes y pagos parciales.

[![Tests Backend](https://github.com/tu-usuario/estudio/workflows/Tests%20y%20Cobertura/badge.svg)](https://github.com/tu-usuario/estudio/actions)
[![Tests Frontend](https://github.com/tu-usuario/estudio/workflows/Tests%20y%20Cobertura/badge.svg)](https://github.com/tu-usuario/estudio/actions)

## 🚀 Características

- ✅ **Gestión de Operaciones**: CRUD completo con paginación optimizada
- ✅ **Sistema de Pagos Parciales**: Seguimiento automático de estados (Pendiente → En Proceso → Completado)
- ✅ **Gestión de Clientes**: CRUD, búsqueda avanzada, estadísticas
- ✅ **Reportes Avanzados**: Exportación CSV con filtros temporales (diario/semanal/mensual)
- ✅ **Autenticación JWT**: Login, registro, perfil con foto
- ✅ **Sistema de Testing**: 98 tests (63 backend + 35 frontend)
- ✅ **CI/CD**: GitHub Actions configurado
- ✅ **Performance Optimizada**: Lazy loading, memoización, paginación inteligente

## 🛠️ Stack Tecnológico

### Backend
- **NestJS 10.x** - Framework de Node.js
- **TypeORM 0.3.17** - ORM para PostgreSQL
- **PostgreSQL 15** - Base de datos
- **JWT** - Autenticación
- **Swagger** - Documentación de API
- **Jest** - Testing

### Frontend
- **React 19.1** - Librería UI
- **Vite 7.1** - Build tool
- **TypeScript 5.9** - Tipado estático
- **Tailwind CSS 3.4** - Estilos
- **React Router 7.9** - Navegación
- **Axios** - Cliente HTTP
- **React Hot Toast** - Notificaciones
- **Vitest** - Testing

## 📋 Requisitos Previos

- Node.js 20.x o superior
- Docker y Docker Compose
- Git

## 🔧 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/estudio.git
cd estudio
```

### 2. Configurar variables de entorno

**Backend** (`backend/.env`):
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=crm_db

# JWT
JWT_SECRET=tu_secreto_super_seguro_aqui
JWT_EXPIRES_IN=7d

# Server
PORT=3000
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:3000
```

### 3. Levantar la base de datos

```bash
docker-compose up -d
```

### 4. Instalar dependencias

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 5. Ejecutar migraciones (opcional)

```bash
cd backend
npm run migration:run
```

## 🚀 Ejecutar en Desarrollo

### Backend (Puerto 3000)
```bash
cd backend
npm run start:dev
```

### Frontend (Puerto 5173)
```bash
cd frontend
npm run dev
```

Acceder a:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api

## 🧪 Testing

### Ejecutar todos los tests

**Backend:**
```bash
cd backend
npm test                 # Tests unitarios
npm run test:cov         # Con cobertura
npm run test:watch       # Watch mode
```

**Frontend:**
```bash
cd frontend
npm test -- --run        # Tests unitarios
npm run test:cov         # Con cobertura
npm run test:ui          # UI interactiva
```

### Métricas de Cobertura

| Módulo | Tests | Cobertura |
|--------|-------|-----------|
| Backend Services | 63 tests | 87-100% |
| Frontend Services | 35 tests | 100% |
| **Total** | **98 tests** | **Excelente** |

Ver [TESTING.md](./TESTING.md) para documentación completa.

## 📦 Build de Producción

### Backend
```bash
cd backend
npm run build
npm run start:prod
```

### Frontend
```bash
cd frontend
npm run build
npm run preview
```

## 🐳 Docker

Para ejecutar todo el stack con Docker:

```bash
docker-compose up --build
```

## 📚 Documentación

- [TESTING.md](./TESTING.md) - Guía completa de testing
- [contexto.md](./contexto.md) - Historial de desarrollo y decisiones técnicas
- **Swagger API**: http://localhost:3000/api (en desarrollo)

## 🏗️ Estructura del Proyecto

```
estudio/
├── backend/                 # NestJS API
│   ├── src/
│   │   ├── auth/           # Autenticación
│   │   ├── clientes/       # Gestión de clientes
│   │   ├── operaciones/    # Gestión de operaciones
│   │   └── ...
│   └── test/               # Tests E2E
├── frontend/               # React App
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── pages/          # Páginas
│   │   ├── services/       # API clients
│   │   ├── contexts/       # React contexts
│   │   └── test/           # Tests
│   └── ...
├── .github/
│   └── workflows/          # CI/CD pipelines
├── docker-compose.yml      # Configuración de Docker
├── TESTING.md             # Documentación de testing
└── README.md              # Este archivo
```

## 🔑 Credenciales por Defecto

**Base de datos:**
- Usuario: `postgres`
- Contraseña: `postgres`
- Base de datos: `crm_db`

**Usuario de prueba** (crear con register):
- Email: tu_email@example.com
- Password: tu_contraseña

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

**Importante**: Asegúrate de que los tests pasen antes de crear el PR:
```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test -- --run
```

## 🐛 Reportar Bugs

Si encuentras un bug, por favor abre un [issue](https://github.com/tu-usuario/estudio/issues) con:
- Descripción del problema
- Pasos para reproducir
- Comportamiento esperado vs actual
- Screenshots (si aplica)

## 📝 Roadmap

### En Progreso
- [ ] Tests de Controllers (Backend)
- [ ] Tests de Componentes (Frontend)

### Futuro
- [ ] Tests E2E con Playwright
- [ ] Dashboard con gráficos (Chart.js)
- [ ] Exportación a PDF
- [ ] Notificaciones por email
- [ ] Modo offline (PWA)

## 📄 Licencia

Este proyecto es privado y de uso exclusivo de Blatter y Asociados.

## 👥 Autores

- **Desarrollador Principal** - Desarrollo fullstack y testing

## 🙏 Agradecimientos

- NestJS Team
- React Team
- Toda la comunidad open source

---

**Versión**: 2.1.0
**Última actualización**: Noviembre 2025
**Estado**: ✅ Producción
