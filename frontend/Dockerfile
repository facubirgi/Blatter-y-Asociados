# ====================================
# 🐳 Dockerfile - Frontend (React + Vite)
# ====================================

# Etapa 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci && \
    npm cache clean --force

# Copiar código fuente
COPY . .

# Build de producción
RUN npm run build

# ====================================
# Etapa 2: Production con Nginx
FROM nginx:1.25-alpine AS production

# Copiar archivos built desde builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Nginx se ejecuta automáticamente
CMD ["nginx", "-g", "daemon off;"]
