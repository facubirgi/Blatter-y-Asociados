# 🚀 Guía de Deployment - CRM Contable

**Sistema:** CRM Contable Blatter y Asociados
**Versión:** 2.3.0
**Última actualización:** Diciembre 2025

---

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Configuración Inicial](#configuración-inicial)
3. [Deployment en Producción](#deployment-en-producción)
4. [Configuración de Dominio y SSL](#configuración-de-dominio-y-ssl)
5. [Monitoreo y Mantenimiento](#monitoreo-y-mantenimiento)
6. [Backups](#backups)
7. [Rollback](#rollback)
8. [Troubleshooting](#troubleshooting)

---

## 🔧 Requisitos Previos

### Sistema Operativo
- **Linux:** Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- **Windows:** Windows Server 2019+ / Windows 10/11 Pro
- **macOS:** macOS 11+ (Big Sur o superior)

### Software Requerido
- **Docker:** 20.10+
- **Docker Compose:** 2.0+
- **Git:** 2.0+
- **Recursos mínimos:**
  - CPU: 2 cores
  - RAM: 4 GB
  - Disco: 20 GB libres

### Puertos Requeridos
- `80` - Frontend HTTP
- `443` - Frontend HTTPS (opcional)
- `3000` - Backend API
- `3306` - MySQL (solo si se expone externamente)

---

## ⚙️ Configuración Inicial

### 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd estudio
```

### 2. Configurar Variables de Entorno

```bash
# Copiar el archivo de ejemplo
cp .env.production.example .env

# Editar con tus valores
nano .env  # o vim, code, notepad, etc.
```

**Variables críticas a configurar:**

```env
# Base de Datos
DB_USERNAME=crm_user
DB_PASSWORD=TU_PASSWORD_SUPER_SEGURO_AQUI_32_CHARS_MIN
DB_DATABASE=crm_contable
DB_ROOT_PASSWORD=OTRO_PASSWORD_SUPER_SEGURO_DIFERENTE

# JWT
JWT_SECRET=SECRETO_ALEATORIO_DE_64_CARACTERES_GENERADO_CON_OPENSSL
JWT_EXPIRES_IN=7d

# URLs
BACKEND_URL=http://tu-dominio.com:3000
FRONTEND_URL=http://tu-dominio.com
```

**⚠️ IMPORTANTE:**
- NUNCA uses passwords simples en producción
- Genera el JWT_SECRET con: `openssl rand -base64 64`
- Usa passwords de al menos 32 caracteres aleatorios

### 3. Verificar Configuración de Docker

```bash
# Verificar que Docker está corriendo
docker --version
docker-compose --version

# Verificar permisos (Linux)
sudo usermod -aG docker $USER
newgrp docker
```

---

## 🚀 Deployment en Producción

### Opción 1: Script Automatizado (Recomendado)

#### Linux/Mac:
```bash
chmod +x deploy.sh
./deploy.sh production
```

#### Windows (PowerShell):
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\deploy.ps1 production
```

### Opción 2: Manual

```bash
# 1. Crear directorio de backups
mkdir -p backups

# 2. Construir imágenes
docker-compose -f docker-compose.production.yml build --no-cache

# 3. Levantar servicios
docker-compose -f docker-compose.production.yml up -d

# 4. Verificar estado
docker-compose -f docker-compose.production.yml ps

# 5. Ver logs
docker-compose -f docker-compose.production.yml logs -f
```

### Verificación Post-Deployment

```bash
# 1. Verificar que todos los contenedores están corriendo
docker ps

# 2. Verificar health checks
docker inspect crm-mysql-prod | grep Health
docker inspect crm-backend-prod | grep Health
docker inspect crm-frontend-prod | grep Health

# 3. Probar endpoints
curl http://localhost:3000/api/health
curl http://localhost/health

# 4. Acceder a la aplicación
# Frontend: http://localhost
# Backend API: http://localhost:3000
# Swagger Docs: http://localhost:3000/api/docs
```

---

## 🌐 Configuración de Dominio y SSL

### Configurar Nginx Reverse Proxy (Recomendado para Producción)

1. Instalar Nginx en el host:
```bash
sudo apt update
sudo apt install nginx
```

2. Crear configuración para tu dominio:
```bash
sudo nano /etc/nginx/sites-available/crm-contable
```

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name tu-dominio.com www.tu-dominio.com;

    # SSL Certificates (usar Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tu-dominio.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend
    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

3. Habilitar el sitio:
```bash
sudo ln -s /etc/nginx/sites-available/crm-contable /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Obtener Certificado SSL con Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Renovación automática (verificar)
sudo certbot renew --dry-run
```

---

## 📊 Monitoreo y Mantenimiento

### Ver Logs en Tiempo Real

```bash
# Todos los servicios
docker-compose -f docker-compose.production.yml logs -f

# Solo backend
docker-compose -f docker-compose.production.yml logs -f backend

# Solo frontend
docker-compose -f docker-compose.production.yml logs -f frontend

# Solo base de datos
docker-compose -f docker-compose.production.yml logs -f mysql
```

### Métricas de Contenedores

```bash
# Ver uso de recursos
docker stats

# Ver estado de contenedores
docker ps -a

# Inspeccionar un contenedor
docker inspect crm-backend-prod
```

### Limpieza de Recursos

```bash
# Eliminar imágenes no usadas
docker image prune -a

# Eliminar volúmenes no usados
docker volume prune

# Limpieza completa (¡CUIDADO!)
docker system prune -a --volumes
```

---

## 💾 Backups

### Backup Manual de Base de Datos

```bash
# Crear backup
docker exec crm-mysql-prod mysqldump \
  -u root \
  -p"${DB_ROOT_PASSWORD}" \
  "${DB_DATABASE}" > backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Verificar backup
ls -lh backups/
```

### Restaurar Backup

```bash
# Restaurar desde un archivo de backup
docker exec -i crm-mysql-prod mysql \
  -u root \
  -p"${DB_ROOT_PASSWORD}" \
  "${DB_DATABASE}" < backups/backup_20241211_120000.sql
```

### Configurar Backups Automáticos (Cron)

```bash
# Editar crontab
crontab -e

# Agregar backup diario a las 2 AM
0 2 * * * cd /ruta/al/proyecto && ./backup.sh >> /var/log/crm-backup.log 2>&1
```

Crear script `backup.sh`:

```bash
#!/bin/bash
# Ver sección de Scripts de Backup más abajo
```

---

## ⏮️ Rollback

### Rollback Rápido

```bash
# 1. Detener servicios actuales
docker-compose -f docker-compose.production.yml down

# 2. Restaurar backup de BD
docker-compose -f docker-compose.production.yml up -d mysql
sleep 10
docker exec -i crm-mysql-prod mysql \
  -u root -p"${DB_ROOT_PASSWORD}" \
  "${DB_DATABASE}" < backups/backup_ANTERIOR.sql

# 3. Checkout a versión anterior del código
git checkout <commit-hash-anterior>

# 4. Reconstruir y levantar
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d
```

---

## 🔧 Troubleshooting

### Contenedor No Inicia

```bash
# Ver logs detallados
docker logs crm-backend-prod --tail 100

# Ver eventos del contenedor
docker events --filter container=crm-backend-prod
```

### Error de Conexión a Base de Datos

```bash
# Verificar que MySQL está corriendo
docker exec crm-mysql-prod mysqladmin ping -h localhost -u root -p"${DB_ROOT_PASSWORD}"

# Conectarse a MySQL manualmente
docker exec -it crm-mysql-prod mysql -u root -p"${DB_ROOT_PASSWORD}"
```

### Frontend No Carga

```bash
# Verificar Nginx dentro del contenedor
docker exec crm-frontend-prod nginx -t

# Ver configuración de Nginx
docker exec crm-frontend-prod cat /etc/nginx/conf.d/default.conf
```

### Puerto Ya en Uso

```bash
# Linux: Ver qué está usando el puerto
sudo lsof -i :3000
sudo netstat -tulpn | grep 3000

# Windows: Ver qué está usando el puerto
netstat -ano | findstr :3000

# Matar proceso
kill -9 <PID>  # Linux
Stop-Process -Id <PID> -Force  # Windows
```

### Reiniciar un Servicio Específico

```bash
# Reiniciar solo el backend
docker-compose -f docker-compose.production.yml restart backend

# Reconstruir e reiniciar
docker-compose -f docker-compose.production.yml up -d --build backend
```

---

## 📞 Soporte

Para problemas o consultas:
- Revisar logs: `docker-compose logs -f`
- Revisar documentación: [ESTADO_PROYECTO.md](./ESTADO_PROYECTO.md)
- Contactar al equipo de desarrollo

---

## 🔒 Checklist de Seguridad Pre-Producción

- [ ] Cambiar todos los passwords por defecto
- [ ] Generar nuevo JWT_SECRET aleatorio
- [ ] Configurar firewall (permitir solo 80, 443)
- [ ] Configurar SSL/HTTPS con Let's Encrypt
- [ ] Deshabilitar puertos de base de datos externamente (3306)
- [ ] Configurar backups automáticos
- [ ] Actualizar sistema operativo (`apt update && apt upgrade`)
- [ ] Configurar monitoreo de logs
- [ ] Revisar permisos de archivos .env (chmod 600)
- [ ] Configurar fail2ban para protección contra ataques
- [ ] Verificar que NODE_ENV=production

---

**Última revisión:** 23/12/2025
**Versión del documento:** 1.0
