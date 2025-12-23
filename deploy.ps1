# ====================================
# 🚀 Script de Deployment - CRM Contable
# ====================================
# Para sistemas Windows (PowerShell)
# Uso: .\deploy.ps1 [production|staging|development]

param(
    [string]$Environment = "production"
)

# Colores
function Write-Info { Write-Host "ℹ️  $args" -ForegroundColor Blue }
function Write-Success { Write-Host "✅ $args" -ForegroundColor Green }
function Write-Warning { Write-Host "⚠️  $args" -ForegroundColor Yellow }
function Write-Error-Custom { Write-Host "❌ $args" -ForegroundColor Red }

# Banner
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "🚀 CRM Contable - Deployment" -ForegroundColor Cyan
Write-Host "   Blatter y Asociados" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

Write-Info "Ambiente: $Environment"

# Verificar que existe el archivo .env
if (!(Test-Path .env)) {
    Write-Error-Custom "Archivo .env no encontrado!"
    Write-Info "Copia .env.production.example a .env y configura las variables"
    exit 1
}

# Verificar Docker
try {
    docker --version | Out-Null
    docker-compose --version | Out-Null
    Write-Success "Docker y Docker Compose están instalados"
} catch {
    Write-Error-Custom "Docker o Docker Compose no están instalados"
    exit 1
}

# Crear directorio de backups si no existe
if (!(Test-Path backups)) {
    New-Item -ItemType Directory -Path backups | Out-Null
}
Write-Success "Directorio de backups creado/verificado"

# Crear backup de la base de datos si existe
$container = docker ps -q -f name=crm-mysql-prod
if ($container) {
    Write-Info "Creando backup de la base de datos..."
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = "backups/backup_pre_deploy_$timestamp.sql"

    # Leer variables de entorno
    Get-Content .env | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            Set-Variable -Name $matches[1] -Value $matches[2]
        }
    }

    docker exec crm-mysql-prod mysqldump `
        -u root `
        -p"$DB_ROOT_PASSWORD" `
        "$DB_DATABASE" | Out-File -FilePath $backupFile -Encoding ASCII

    if (Test-Path $backupFile) {
        Write-Success "Backup creado: $backupFile"
    } else {
        Write-Warning "No se pudo crear el backup (la BD puede no existir aún)"
    }
}

# Detener contenedores existentes
Write-Info "Deteniendo contenedores existentes..."
docker-compose -f docker-compose.production.yml down 2>$null

# Construir imágenes
Write-Info "Construyendo imágenes Docker..."
docker-compose -f docker-compose.production.yml build --no-cache

# Levantar servicios
Write-Info "Levantando servicios..."
docker-compose -f docker-compose.production.yml up -d

# Esperar a que los servicios estén listos
Write-Info "Esperando a que los servicios estén listos..."
Start-Sleep -Seconds 10

# Verificar estado de los servicios
Write-Info "Verificando estado de los servicios..."
docker-compose -f docker-compose.production.yml ps

# Verificar logs
Write-Info "Últimas líneas de los logs:"
Write-Host ""
docker-compose -f docker-compose.production.yml logs --tail=20

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Success "¡Deployment completado!"
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Info "URLs:"
Write-Host "  - Frontend: http://localhost"
Write-Host "  - Backend API: http://localhost:3000"
Write-Host "  - API Docs: http://localhost:3000/api/docs"
Write-Host "  - Health Check: http://localhost:3000/api/health"
Write-Host ""
Write-Info "Comandos útiles:"
Write-Host "  - Ver logs:        docker-compose -f docker-compose.production.yml logs -f"
Write-Host "  - Detener:         docker-compose -f docker-compose.production.yml down"
Write-Host "  - Reiniciar:       docker-compose -f docker-compose.production.yml restart"
Write-Host "  - Ver estado:      docker-compose -f docker-compose.production.yml ps"
Write-Host ""
