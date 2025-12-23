# ✅ Checklist de Deployment a Producción

**CRM Contable - Blatter y Asociados**
**Versión:** 2.3.0

---

## 📋 Pre-Deployment

### 1. Preparación del Servidor

- [ ] Servidor con Docker y Docker Compose instalados
- [ ] Puertos 80, 443, 3000 disponibles
- [ ] Al menos 4GB RAM y 20GB disco disponibles
- [ ] Sistema operativo actualizado (`apt update && apt upgrade`)
- [ ] Firewall configurado (UFW o similar)

### 2. Configuración de Seguridad

- [ ] Cambiar `DB_PASSWORD` en `.env` (mínimo 32 caracteres)
- [ ] Cambiar `DB_ROOT_PASSWORD` en `.env` (mínimo 32 caracteres)
- [ ] Generar `JWT_SECRET` con: `openssl rand -base64 64`
- [ ] Verificar que `NODE_ENV=production`
- [ ] Configurar permisos de `.env`: `chmod 600 .env`
- [ ] Verificar que `.env` está en `.gitignore`

### 3. Configuración de Dominio

- [ ] Dominio apuntando a la IP del servidor (registro A)
- [ ] Certificado SSL instalado (Let's Encrypt recomendado)
- [ ] Nginx configurado como reverse proxy (si aplica)
- [ ] URLs actualizadas en `.env`:
  - `BACKEND_URL=https://tu-dominio.com/api`
  - `FRONTEND_URL=https://tu-dominio.com`

---

## 🚀 Deployment

### 4. Primer Deployment

```bash
# Clonar repositorio
git clone <url-repo>
cd estudio

# Configurar .env
cp .env.production.example .env
nano .env  # Editar con valores reales

# Dar permisos de ejecución
chmod +x deploy.sh backup.sh

# Ejecutar deployment
./deploy.sh production
```

### 5. Verificación Post-Deployment

- [ ] Verificar que todos los contenedores están corriendo: `docker ps`
- [ ] Probar health checks:
  - [ ] Backend: `curl http://localhost:3000/api/health`
  - [ ] Frontend: `curl http://localhost/health`
- [ ] Acceder a Swagger docs: `http://localhost:3000/api/docs`
- [ ] Crear primer usuario desde Swagger o API
- [ ] Hacer login en la aplicación
- [ ] Crear un cliente de prueba
- [ ] Crear una operación de prueba

---

## 💾 Configurar Backups Automáticos

### 6. Backups (Linux/Mac)

```bash
# Editar crontab
crontab -e

# Agregar backup diario a las 2 AM
0 2 * * * cd /ruta/completa/al/proyecto && ./backup.sh >> /var/log/crm-backup.log 2>&1

# Agregar limpieza semanal de logs
0 3 * * 0 cd /ruta/completa/al/proyecto && docker system prune -f >> /var/log/docker-cleanup.log 2>&1
```

### 6. Backups (Windows)

```powershell
# Abrir Task Scheduler
# Crear nueva tarea:
# - Trigger: Daily at 2:00 AM
# - Action: Start a program
#   - Program: powershell.exe
#   - Arguments: -ExecutionPolicy Bypass -File "C:\ruta\completa\al\proyecto\backup.ps1"
# - Settings: Allow task to run on demand
```

### 7. Verificar Backups

- [ ] Ejecutar backup manual: `./backup.sh`
- [ ] Verificar que se creó en `backups/`
- [ ] Verificar que está comprimido (`.gz`)
- [ ] Probar restauración en ambiente de prueba

---

## 📊 Monitoreo

### 8. Configurar Monitoreo

- [ ] Configurar alertas de disco lleno (>80%)
- [ ] Configurar alertas de memoria (>80%)
- [ ] Configurar alertas de CPU (>90%)
- [ ] Configurar monitoreo de logs: `tail -f /var/log/crm-backup.log`
- [ ] Configurar uptime monitoring (UptimeRobot, Pingdom, etc.)

### 9. Logs

```bash
# Ver logs en tiempo real
docker-compose -f docker-compose.production.yml logs -f

# Logs específicos
docker logs crm-backend-prod -f --tail 100
docker logs crm-frontend-prod -f --tail 100
docker logs crm-mysql-prod -f --tail 100
```

---

## 🔒 Hardening de Seguridad

### 10. Seguridad Adicional

- [ ] Instalar y configurar Fail2Ban
- [ ] Configurar límites de rate limiting en Nginx
- [ ] Deshabilitar puerto 3306 (MySQL) en firewall externo
- [ ] Configurar HTTPS redirect (HTTP → HTTPS)
- [ ] Agregar headers de seguridad en Nginx:
  - [ ] HSTS
  - [ ] X-Frame-Options
  - [ ] X-Content-Type-Options
  - [ ] CSP (Content Security Policy)
- [ ] Configurar SSH con key-based auth (deshabilitar password)
- [ ] Cambiar puerto SSH por defecto (22 → otro)
- [ ] Actualizar sistema y paquetes regularmente

---

## 🔄 Mantenimiento Regular

### 11. Tareas Mensuales

- [ ] Revisar logs de error
- [ ] Verificar espacio en disco
- [ ] Revisar backups (verificar que funcionan)
- [ ] Actualizar dependencias de seguridad
- [ ] Revisar métricas de rendimiento

### 12. Tareas Trimestrales

- [ ] Rotar `JWT_SECRET` (requiere re-login de todos)
- [ ] Rotar passwords de base de datos
- [ ] Revisar usuarios y permisos
- [ ] Auditoría de seguridad
- [ ] Actualizar certificados SSL (si no es automático)

---

## 📞 Contactos de Emergencia

### 13. Información Importante

**Ubicación del proyecto:** `__________________________`

**IP del servidor:** `__________________________`

**Dominio:** `__________________________`

**Hosting/Cloud Provider:** `__________________________`

**Usuario del servidor:** `__________________________`

**Contacto técnico:** `__________________________`

**Backup remoto (si aplica):** `__________________________`

---

## 🆘 En Caso de Emergencia

### Servicio Caído

```bash
# 1. Ver qué contenedores están corriendo
docker ps -a

# 2. Ver logs del contenedor problemático
docker logs <container-name> --tail 100

# 3. Reiniciar servicio específico
docker-compose -f docker-compose.production.yml restart <service-name>

# 4. Si no funciona, reiniciar todo
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d
```

### Restaurar Backup

```bash
# 1. Listar backups disponibles
ls -lh backups/

# 2. Detener aplicación (opcional pero recomendado)
docker-compose -f docker-compose.production.yml down backend frontend

# 3. Restaurar backup
gunzip < backups/YYYYMMDD/backup_TIMESTAMP.sql.gz | \
  docker exec -i crm-mysql-prod mysql \
  -u root -p"${DB_ROOT_PASSWORD}" "${DB_DATABASE}"

# 4. Reiniciar aplicación
docker-compose -f docker-compose.production.yml up -d
```

### Rollback a Versión Anterior

Ver sección "Rollback" en [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## ✅ Checklist Final

Una vez completados todos los pasos anteriores:

- [ ] Sistema corriendo en producción
- [ ] SSL/HTTPS funcionando
- [ ] Backups automáticos configurados
- [ ] Monitoreo activo
- [ ] Documentación completa
- [ ] Equipo capacitado
- [ ] Plan de emergencia establecido
- [ ] Contactos de soporte documentados

---

**Fecha de deployment:** `__________________________`

**Responsable:** `__________________________`

**Versión deployada:** v2.3.0

**Firma:** `__________________________`

---

**Última actualización:** 23/12/2025
