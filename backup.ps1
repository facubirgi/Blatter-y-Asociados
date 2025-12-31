# ====================================
# 💾 Script de Backup Automático
# CRM Contable - Blatter y Asociados
# ====================================
# Uso: .\backup.ps1
# Para automatizar con Task Scheduler

# Colores
function Write-Info { Write-Host "ℹ️  $args" -ForegroundColor Blue }
function Write-Success { Write-Host "✅ $args" -ForegroundColor Green }
function Write-Error-Custom { Write-Host "❌ $args" -ForegroundColor Red }

# Banner
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "💾 Backup de Base de Datos" -ForegroundColor Cyan
Write-Host "   CRM Contable" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

Write-Info "Iniciando backup..."

# Cargar variables de entorno
if (!(Test-Path .env)) {
    Write-Error-Custom "Archivo .env no encontrado"
    exit 1
}

Get-Content .env | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        Set-Variable -Name $matches[1] -Value $matches[2]
    }
}

# Configuración
$BACKUP_DIR = ".\backups"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$DATE_DIR = Get-Date -Format "yyyyMMdd"
$BACKUP_FOLDER = Join-Path $BACKUP_DIR $DATE_DIR
$BACKUP_FILE = Join-Path $BACKUP_FOLDER "backup_$TIMESTAMP.sql"
$RETENTION_DAYS = 30

# Crear directorios si no existen
if (!(Test-Path $BACKUP_FOLDER)) {
    New-Item -ItemType Directory -Path $BACKUP_FOLDER -Force | Out-Null
}

# Verificar que el contenedor de MySQL está corriendo
$container = docker ps --filter "name=crm-mysql" --format "{{.Names}}" | Select-Object -First 1
if (!$container) {
    Write-Error-Custom "El contenedor MySQL no está corriendo"
    exit 1
}

Write-Info "Usando contenedor: $container"

# Crear backup
Write-Info "Creando backup de la base de datos..."
docker exec $container mysqldump `
    --single-transaction `
    --routines `
    --triggers `
    --events `
    -u root `
    -p"$DB_ROOT_PASSWORD" `
    "$DB_DATABASE" | Out-File -FilePath $BACKUP_FILE -Encoding ASCII

# Verificar que el backup se creó correctamente
if (Test-Path $BACKUP_FILE) {
    $BACKUP_SIZE = (Get-Item $BACKUP_FILE).Length / 1MB
    $BACKUP_SIZE_STR = "{0:N2} MB" -f $BACKUP_SIZE
    Write-Success "Backup creado exitosamente: $BACKUP_FILE ($BACKUP_SIZE_STR)"

    # Comprimir backup (requiere .NET 4.5+)
    Write-Info "Comprimiendo backup..."
    $COMPRESSED_FILE = "$BACKUP_FILE.gz"

    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $sourceStream = [System.IO.File]::OpenRead($BACKUP_FILE)
    $targetStream = [System.IO.File]::Create($COMPRESSED_FILE)
    $gzipStream = New-Object System.IO.Compression.GZipStream($targetStream, [System.IO.Compression.CompressionMode]::Compress)

    try {
        $sourceStream.CopyTo($gzipStream)
        Write-Success "Backup comprimido: $COMPRESSED_FILE"
    } finally {
        $gzipStream.Close()
        $targetStream.Close()
        $sourceStream.Close()
    }

    # Eliminar archivo sin comprimir
    Remove-Item $BACKUP_FILE
} else {
    Write-Error-Custom "Error al crear el backup"
    exit 1
}

# Limpiar backups antiguos
Write-Info "Limpiando backups antiguos (> $RETENTION_DAYS días)..."
$cutoffDate = (Get-Date).AddDays(-$RETENTION_DAYS)
Get-ChildItem -Path $BACKUP_DIR -Filter "*.sql.gz" -Recurse | `
    Where-Object { $_.LastWriteTime -lt $cutoffDate } | `
    Remove-Item -Force

# Eliminar directorios vacíos
Get-ChildItem -Path $BACKUP_DIR -Directory | `
    Where-Object { (Get-ChildItem $_.FullName).Count -eq 0 } | `
    Remove-Item -Force

$REMAINING_BACKUPS = (Get-ChildItem -Path $BACKUP_DIR -Filter "*.sql.gz" -Recurse).Count
Write-Success "Backups restantes: $REMAINING_BACKUPS"

# Listar últimos 5 backups
Write-Host ""
Write-Info "Últimos 5 backups:"
Get-ChildItem -Path $BACKUP_DIR -Filter "*.sql.gz" -Recurse | `
    Sort-Object LastWriteTime -Descending | `
    Select-Object -First 5 | `
    ForEach-Object {
        $size = "{0:N2} MB" -f ($_.Length / 1MB)
        $date = $_.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss")
        Write-Host "  - $($_.Name) ($size) - $date"
    }

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Success "¡Backup completado!"
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Info "Archivo: $COMPRESSED_FILE"
Write-Host ""

# Opcional: Enviar notificación o subir a cloud storage
# aws s3 cp "$COMPRESSED_FILE" "s3://mi-bucket/backups/"
# Invoke-WebRequest -Uri "webhook-url" -Method Post -Body "Backup completado: $COMPRESSED_FILE"
