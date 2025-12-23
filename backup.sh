#!/bin/bash

# ====================================
# 💾 Script de Backup Automático
# CRM Contable - Blatter y Asociados
# ====================================
# Uso: ./backup.sh
# Para automatizar con cron: 0 2 * * * /ruta/al/proyecto/backup.sh

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Cargar variables de entorno
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    log_error "Archivo .env no encontrado"
    exit 1
fi

# Configuración
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATE_DIR=$(date +"%Y%m%d")
BACKUP_FILE="${BACKUP_DIR}/${DATE_DIR}/backup_${TIMESTAMP}.sql"
RETENTION_DAYS=30

# Banner
echo "======================================"
echo "💾 Backup de Base de Datos"
echo "   CRM Contable"
echo "======================================"
echo ""

log_info "Iniciando backup..."

# Crear directorios si no existen
mkdir -p "${BACKUP_DIR}/${DATE_DIR}"

# Verificar que el contenedor de MySQL está corriendo
if ! docker ps | grep -q crm-mysql-prod; then
    log_error "El contenedor MySQL no está corriendo"
    exit 1
fi

# Crear backup
log_info "Creando backup de la base de datos..."
docker exec crm-mysql-prod mysqldump \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    -u root \
    -p"${DB_ROOT_PASSWORD}" \
    "${DB_DATABASE}" > "${BACKUP_FILE}"

# Verificar que el backup se creó correctamente
if [ -f "${BACKUP_FILE}" ] && [ -s "${BACKUP_FILE}" ]; then
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    log_success "Backup creado exitosamente: ${BACKUP_FILE} (${BACKUP_SIZE})"

    # Comprimir backup
    log_info "Comprimiendo backup..."
    gzip "${BACKUP_FILE}"
    COMPRESSED_FILE="${BACKUP_FILE}.gz"
    COMPRESSED_SIZE=$(du -h "${COMPRESSED_FILE}" | cut -f1)
    log_success "Backup comprimido: ${COMPRESSED_FILE} (${COMPRESSED_SIZE})"
else
    log_error "Error al crear el backup"
    exit 1
fi

# Limpiar backups antiguos
log_info "Limpiando backups antiguos (> ${RETENTION_DAYS} días)..."
find "${BACKUP_DIR}" -name "*.sql.gz" -mtime +${RETENTION_DAYS} -delete
find "${BACKUP_DIR}" -type d -empty -delete
REMAINING_BACKUPS=$(find "${BACKUP_DIR}" -name "*.sql.gz" | wc -l)
log_success "Backups restantes: ${REMAINING_BACKUPS}"

# Listar últimos 5 backups
echo ""
log_info "Últimos 5 backups:"
find "${BACKUP_DIR}" -name "*.sql.gz" -type f -printf '%T@ %p\n' | \
    sort -rn | \
    head -5 | \
    awk '{print $2}' | \
    while read file; do
        SIZE=$(du -h "$file" | cut -f1)
        DATE=$(stat -c %y "$file" | cut -d'.' -f1)
        echo "  - $(basename $file) (${SIZE}) - ${DATE}"
    done

echo ""
echo "======================================"
log_success "¡Backup completado!"
echo "======================================"
echo ""
log_info "Archivo: ${COMPRESSED_FILE}"
log_info "Tamaño: ${COMPRESSED_SIZE}"
echo ""

# Opcional: Enviar notificación o subir a cloud storage
# aws s3 cp "${COMPRESSED_FILE}" s3://mi-bucket/backups/
# curl -X POST "webhook-url" -d "Backup completado: ${COMPRESSED_FILE}"
