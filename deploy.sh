#!/bin/bash

# ====================================
# 🚀 Script de Deployment - CRM Contable
# ====================================
# Para sistemas Linux/Mac
# Uso: ./deploy.sh [production|staging|development]

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Banner
echo "======================================"
echo "🚀 CRM Contable - Deployment"
echo "   Blatter y Asociados"
echo "======================================"
echo ""

# Verificar argumento
ENVIRONMENT=${1:-production}
log_info "Ambiente: $ENVIRONMENT"

# Verificar que existe el archivo .env
if [ ! -f .env ]; then
    log_error "Archivo .env no encontrado!"
    log_info "Copia .env.production.example a .env y configura las variables"
    exit 1
fi

# Verificar Docker
if ! command -v docker &> /dev/null; then
    log_error "Docker no está instalado"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose no está instalado"
    exit 1
fi

log_success "Docker y Docker Compose están instalados"

# Crear directorio de backups si no existe
mkdir -p backups
log_success "Directorio de backups creado/verificado"

# Crear backup de la base de datos si existe
if [ "$(docker ps -q -f name=crm-mysql-prod)" ]; then
    log_info "Creando backup de la base de datos..."
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FILE="backups/backup_pre_deploy_${TIMESTAMP}.sql"

    docker exec crm-mysql-prod mysqldump \
        -u root \
        -p"${DB_ROOT_PASSWORD}" \
        "${DB_DATABASE}" > "${BACKUP_FILE}" 2>/dev/null || true

    if [ -f "${BACKUP_FILE}" ]; then
        log_success "Backup creado: ${BACKUP_FILE}"
    else
        log_warning "No se pudo crear el backup (la BD puede no existir aún)"
    fi
fi

# Detener contenedores existentes
log_info "Deteniendo contenedores existentes..."
docker-compose -f docker-compose.production.yml down || true

# Construir imágenes
log_info "Construyendo imágenes Docker..."
docker-compose -f docker-compose.production.yml build --no-cache

# Levantar servicios
log_info "Levantando servicios..."
docker-compose -f docker-compose.production.yml up -d

# Esperar a que los servicios estén saludables
log_info "Esperando a que los servicios estén listos..."
sleep 10

# Verificar salud de los servicios
log_info "Verificando estado de los servicios..."
docker-compose -f docker-compose.production.yml ps

# Verificar logs
log_info "Últimas líneas de los logs:"
echo ""
docker-compose -f docker-compose.production.yml logs --tail=20

echo ""
echo "======================================"
log_success "¡Deployment completado!"
echo "======================================"
echo ""
log_info "URLs:"
echo "  - Frontend: http://localhost"
echo "  - Backend API: http://localhost:3000"
echo "  - API Docs: http://localhost:3000/api/docs"
echo "  - Health Check: http://localhost:3000/api/health"
echo ""
log_info "Comandos útiles:"
echo "  - Ver logs:        docker-compose -f docker-compose.production.yml logs -f"
echo "  - Detener:         docker-compose -f docker-compose.production.yml down"
echo "  - Reiniciar:       docker-compose -f docker-compose.production.yml restart"
echo "  - Ver estado:      docker-compose -f docker-compose.production.yml ps"
echo ""
