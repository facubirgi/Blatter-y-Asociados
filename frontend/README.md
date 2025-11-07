# Frontend - Sistema de Autenticación

Frontend desarrollado con React, TypeScript, Vite y TailwindCSS para el sistema de autenticación de Blatter y Asociados.

## Tecnologías

- **React 19** con TypeScript
- **Vite** - Build tool
- **TailwindCSS** - Estilos
- **React Router DOM** - Enrutamiento
- **Axios** - Peticiones HTTP
- **Context API** - Gestión de estado

## Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   └── ProtectedRoute.tsx
├── contexts/           # Contextos de React
│   └── AuthContext.tsx
├── pages/              # Páginas de la aplicación
│   ├── Login.tsx
│   ├── Register.tsx
│   └── Dashboard.tsx
├── services/           # Servicios y configuración de API
│   ├── api.ts
│   └── authService.ts
├── App.tsx            # Componente principal con rutas
└── main.tsx          # Punto de entrada
```

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
```

3. Editar el archivo `.env` con la URL del backend:
```env
VITE_API_URL=http://localhost:3000
```

## Ejecutar en Desarrollo

```bash
npm run dev
```

El frontend estará disponible en: `http://localhost:5173`

## Scripts Disponibles

- `npm run dev` - Ejecuta el servidor de desarrollo
- `npm run build` - Compila para producción
- `npm run preview` - Previsualiza el build de producción
- `npm run lint` - Ejecuta el linter

## Características Implementadas

### Autenticación

- ✅ Registro de usuarios
- ✅ Inicio de sesión
- ✅ Cierre de sesión
- ✅ Protección de rutas privadas
- ✅ Persistencia de sesión con localStorage
- ✅ Interceptor de token JWT
- ✅ Manejo de tokens expirados

### Páginas

1. **Login** (`/login`)
   - Formulario de inicio de sesión
   - Validación de credenciales
   - Manejo de errores
   - Link a registro

2. **Register** (`/register`)
   - Formulario de registro con validación
   - Confirmación de contraseña
   - Validación de email y contraseñas
   - Link a login

3. **Dashboard** (`/dashboard`)
   - Página protegida
   - Información del usuario
   - Botón de cierre de sesión
   - Placeholder para funcionalidades futuras

### Diseño

- Interfaz responsive basada en las imágenes proporcionadas
- Estilo minimalista y profesional
- Iconos SVG integrados
- Paleta de colores gris para mantener profesionalismo
- Estados de loading y error

## API Endpoints Utilizados

El frontend consume los siguientes endpoints del backend:

- `POST /auth/register` - Registro de usuario
- `POST /auth/login` - Inicio de sesión
- `GET /auth/profile` - Obtener perfil del usuario autenticado

## Variables de Entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| VITE_API_URL | URL del backend API | http://localhost:3000 |

## Notas Importantes

1. El backend debe estar ejecutándose en el puerto 3000 (o actualizar la variable VITE_API_URL)
2. Los tokens JWT se almacenan en localStorage
3. El interceptor de Axios agrega automáticamente el token a las peticiones
4. Las rutas protegidas redirigen al login si no hay autenticación

## Próximos Pasos

- Implementar módulo de clientes
- Implementar módulo de operaciones
- Agregar validación de roles
- Implementar recuperación de contraseña
- Agregar tests unitarios y de integración

## Desarrollado por

Facundo Birgi
