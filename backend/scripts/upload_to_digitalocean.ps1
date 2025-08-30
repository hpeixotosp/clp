# Script PowerShell para fazer upload do backend para DigitalOcean
# Execute este script no PowerShell da sua máquina Windows

param(
    [Parameter(Mandatory=$true)]
    [string]$DropletIP,
    
    [Parameter(Mandatory=$false)]
    [string]$User = "root",
    
    [Parameter(Mandatory=$false)]
    [string]$AppDir = "/home/tic/app"
)

# Cores para output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Cyan"

function Write-Log {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $Message" -ForegroundColor $Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] WARNING: $Message" -ForegroundColor $Yellow
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ERROR: $Message" -ForegroundColor $Red
    exit 1
}

function Write-Info {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $Message" -ForegroundColor $Blue
}

Write-Log "🚀 Iniciando upload para DigitalOcean..."
Write-Info "IP do Droplet: $DropletIP"
Write-Info "Usuário: $User"
Write-Info "Diretório de destino: $AppDir"

# Verificar se estamos no diretório correto
if (!(Test-Path "main.py") -or !(Test-Path "requirements.txt")) {
    Write-Error-Custom "Execute este script no diretório backend-api (onde estão main.py e requirements.txt)"
}

# Verificar se o SSH está disponível
if (!(Get-Command ssh -ErrorAction SilentlyContinue)) {
    Write-Error-Custom "SSH não encontrado. Instale o OpenSSH ou use o WSL."
}

# Verificar se o SCP está disponível
if (!(Get-Command scp -ErrorAction SilentlyContinue)) {
    Write-Error-Custom "SCP não encontrado. Instale o OpenSSH ou use o WSL."
}

Write-Log "Testando conectividade..."
if (!(Test-Connection -ComputerName $DropletIP -Count 1 -Quiet)) {
    Write-Error-Custom "Não foi possível conectar ao IP $DropletIP"
}

# Testar conexão SSH
Write-Log "Testando conexão SSH..."
$sshTest = ssh -o ConnectTimeout=10 -o BatchMode=yes "$User@$DropletIP" "exit" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Não foi possível conectar via SSH. Verifique suas chaves SSH."
}

Write-Log "Criando diretório da aplicação no servidor..."
ssh "$User@$DropletIP" "sudo -u tic mkdir -p $AppDir"

Write-Log "Fazendo backup dos arquivos existentes (se houver)..."
$backupDate = Get-Date -Format "yyyyMMdd_HHmmss"
ssh "$User@$DropletIP" "sudo -u tic [ -d '$AppDir' ] && sudo -u tic cp -r $AppDir ${AppDir}_backup_$backupDate || true"

Write-Log "Criando lista de exclusões..."
$excludeList = @(
    "__pycache__",
    "*.pyc",
    "*.pyo",
    "*.pyd",
    ".Python",
    "env",
    "venv",
    ".venv",
    "pip-log.txt",
    "pip-delete-this-directory.txt",
    ".tox",
    ".coverage",
    ".coverage.*",
    ".cache",
    "nosetests.xml",
    "coverage.xml",
    "*.cover",
    "*.log",
    ".git",
    ".mypy_cache",
    ".pytest_cache",
    ".hypothesis",
    ".DS_Store",
    "Thumbs.db",
    "*.db",
    "*.sqlite",
    "*.sqlite3",
    "temp",
    "uploads",
    ".env"
)

Write-Log "Fazendo upload dos arquivos..."
# Criar arquivo temporário com lista de exclusões
$tempExcludeFile = [System.IO.Path]::GetTempFileName()
$excludeList | Out-File -FilePath $tempExcludeFile -Encoding ASCII

# Usar robocopy para copiar arquivos localmente primeiro, depois SCP
$tempDir = [System.IO.Path]::GetTempPath() + "tic_upload_" + (Get-Date -Format "yyyyMMdd_HHmmss")
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

Write-Info "Copiando arquivos para diretório temporário..."
robocopy . $tempDir /E /XD __pycache__ .git venv .venv env .tox .mypy_cache .pytest_cache .hypothesis temp uploads /XF *.pyc *.pyo *.pyd *.log *.db *.sqlite *.sqlite3 .env pip-log.txt pip-delete-this-directory.txt .DS_Store Thumbs.db /NFL /NDL /NJH /NJS

Write-Info "Fazendo upload via SCP..."
scp -r "$tempDir\*" "${User}@${DropletIP}:${AppDir}/"

Write-Log "Configurando permissões..."
ssh "$User@$DropletIP" "sudo chown -R tic:tic $AppDir"

Write-Log "Criando ambiente virtual..."
ssh "$User@$DropletIP" "sudo -u tic python3 -m venv $AppDir/venv"

Write-Log "Instalando dependências..."
ssh "$User@$DropletIP" "sudo -u tic $AppDir/venv/bin/pip install --upgrade pip"
ssh "$User@$DropletIP" "sudo -u tic $AppDir/venv/bin/pip install -r $AppDir/requirements.txt"

Write-Log "Configurando arquivo .env..."
ssh "$User@$DropletIP" "sudo -u tic cp $AppDir/.env.example $AppDir/.env" 2>$null

Write-Log "Atualizando configuração do Supervisor..."
ssh "$User@$DropletIP" "sudo supervisorctl reread"
ssh "$User@$DropletIP" "sudo supervisorctl update"

Write-Log "Reiniciando aplicação..."
$restartResult = ssh "$User@$DropletIP" "sudo supervisorctl restart tic-backend" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Warn "Falha ao reiniciar. Tentando iniciar..."
    ssh "$User@$DropletIP" "sudo supervisorctl start tic-backend"
}

Write-Log "Verificando status da aplicação..."
ssh "$User@$DropletIP" "sudo supervisorctl status tic-backend"

Write-Log "Testando API..."
Start-Sleep -Seconds 5  # Aguardar inicialização
$healthCheck = ssh "$User@$DropletIP" "curl -s http://localhost:8000/health"
if ($healthCheck -like "*healthy*") {
    Write-Log "✅ API está funcionando!"
} else {
    Write-Warn "⚠️ API pode não estar funcionando corretamente"
    Write-Info "Verificando logs..."
    ssh "$User@$DropletIP" "sudo tail -20 /var/log/tic-backend.log"
}

Write-Log "Limpando arquivos temporários..."
Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path $tempExcludeFile -Force -ErrorAction SilentlyContinue

Write-Log "🎉 Upload concluído com sucesso!"
Write-Host ""
Write-Info "📋 Informações importantes:"
Write-Host "🌍 API URL: http://$DropletIP" -ForegroundColor White
Write-Host "📚 Documentação: http://$DropletIP/docs" -ForegroundColor White
Write-Host "🔍 Health Check: http://$DropletIP/health" -ForegroundColor White
Write-Host ""
Write-Info "🔧 Comandos úteis no servidor:"
Write-Host "• Status: sudo supervisorctl status tic-backend" -ForegroundColor White
Write-Host "• Logs: sudo tail -f /var/log/tic-backend.log" -ForegroundColor White
Write-Host "• Reiniciar: sudo supervisorctl restart tic-backend" -ForegroundColor White
Write-Host "• Monitor: sudo -u tic /home/tic/monitor.sh" -ForegroundColor White
Write-Host ""
Write-Warn "⚠️ Não esqueça de:"
Write-Host "1. Configurar o arquivo .env com suas credenciais" -ForegroundColor White
Write-Host "2. Alterar a SECRET_KEY para produção" -ForegroundColor White
Write-Host "3. Configurar SSL se necessário" -ForegroundColor White
Write-Host "4. Atualizar FRONTEND_URL no .env" -ForegroundColor White
Write-Host ""
Write-Info "Para editar o .env: ssh $User@$DropletIP 'sudo -u tic nano $AppDir/.env'"

Write-Host ""
Write-Info "💡 Exemplo de uso:"
Write-Host "./upload_to_digitalocean.ps1 -DropletIP 192.168.1.100" -ForegroundColor White
Write-Host "./upload_to_digitalocean.ps1 -DropletIP 192.168.1.100 -User root" -ForegroundColor White