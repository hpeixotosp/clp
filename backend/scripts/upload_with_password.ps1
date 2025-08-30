# Script PowerShell para upload com senha (primeira configuração)
# Execute este script quando ainda não tiver chaves SSH configuradas

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

Write-Log "🚀 Iniciando upload para DigitalOcean (com senha)..."
Write-Info "IP do Droplet: $DropletIP"
Write-Info "Usuário: $User"
Write-Info "Diretório de destino: $AppDir"
Write-Host ""
Write-Warn "⚠️ Este script requer que você digite a senha várias vezes."
Write-Info "💡 Para evitar isso, configure chaves SSH seguindo o guia SSH_SETUP.md"
Write-Host ""

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

Write-Log "Criando arquivo ZIP com os arquivos da aplicação..."
$zipPath = "$env:TEMP\tic-backend-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip"

# Lista de arquivos/pastas para incluir
$includeItems = @(
    "main.py",
    "requirements.txt",
    ".env.example",
    "routers",
    "schemas",
    "services",
    "database",
    "alembic.ini",
    "alembic"
)

# Criar ZIP apenas com arquivos necessários
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::Open($zipPath, 'Create')

foreach ($item in $includeItems) {
    if (Test-Path $item) {
        if (Test-Path $item -PathType Container) {
            # É um diretório
            $files = Get-ChildItem -Path $item -Recurse -File
            foreach ($file in $files) {
                $relativePath = $file.FullName.Substring((Get-Location).Path.Length + 1)
                $relativePath = $relativePath.Replace('\\', '/')
                [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file.FullName, $relativePath) | Out-Null
            }
        } else {
            # É um arquivo
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, (Get-Item $item).FullName, $item) | Out-Null
        }
    }
}
$zip.Dispose()

Write-Info "Arquivo ZIP criado: $zipPath"
Write-Info "Tamanho: $([math]::Round((Get-Item $zipPath).Length / 1MB, 2)) MB"

Write-Log "Enviando arquivo ZIP para o servidor..."
Write-Info "Digite a senha quando solicitado:"
scp $zipPath "${User}@${DropletIP}:/tmp/tic-backend.zip"

if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Falha ao enviar arquivo. Verifique a senha e conexão."
}

Write-Log "Executando setup no servidor..."
Write-Info "Digite a senha quando solicitado:"

$setupCommands = @"
# Instalar dependências básicas
sudo apt update
sudo apt install -y python3 python3-pip python3-venv unzip git nginx supervisor mysql-server curl

# Criar usuário tic se não existir
if ! id tic &>/dev/null; then
    sudo useradd -m -s /bin/bash tic
fi

# Criar diretório da aplicação
sudo -u tic mkdir -p $AppDir

# Extrair arquivos
cd /tmp
sudo unzip -o tic-backend.zip -d $AppDir/
sudo chown -R tic:tic $AppDir

# Criar ambiente virtual
sudo -u tic python3 -m venv $AppDir/venv

# Instalar dependências Python
sudo -u tic $AppDir/venv/bin/pip install --upgrade pip
sudo -u tic $AppDir/venv/bin/pip install -r $AppDir/requirements.txt

# Configurar arquivo .env
sudo -u tic cp $AppDir/.env.example $AppDir/.env 2>/dev/null || echo "Arquivo .env.example não encontrado"

# Configurar MySQL
sudo mysql -e "CREATE DATABASE IF NOT EXISTS tic_production;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'tic_user'@'localhost' IDENTIFIED BY 'tic_password_123';"
sudo mysql -e "GRANT ALL PRIVILEGES ON tic_production.* TO 'tic_user'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

# Configurar Supervisor
sudo tee /etc/supervisor/conf.d/tic-backend.conf > /dev/null << 'EOF'
[program:tic-backend]
command=$AppDir/venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000
directory=$AppDir
user=tic
autostart=true
autorestart=true
stderr_logfile=/var/log/tic-backend.log
stdout_logfile=/var/log/tic-backend.log
EOF

# Configurar Nginx
sudo tee /etc/nginx/sites-available/tic-backend > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Ativar site Nginx
sudo ln -sf /etc/nginx/sites-available/tic-backend /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Configurar firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# Reiniciar serviços
sudo systemctl reload nginx
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start tic-backend

echo "Setup concluído!"
echo "Status da aplicação:"
sudo supervisorctl status tic-backend
"@

ssh "${User}@${DropletIP}" $setupCommands

if ($LASTEXITCODE -ne 0) {
    Write-Warn "Alguns comandos podem ter falhado. Verificando status..."
}

Write-Log "Verificando status da aplicação..."
ssh "${User}@${DropletIP}" "sudo supervisorctl status tic-backend"

Write-Log "Testando API..."
Start-Sleep -Seconds 5
$healthCheck = ssh "${User}@${DropletIP}" "curl -s http://localhost:8000/health 2>/dev/null || echo 'API não respondeu'"
Write-Info "Resposta da API: $healthCheck"

Write-Log "Limpando arquivos temporários..."
Remove-Item -Path $zipPath -Force -ErrorAction SilentlyContinue
ssh "${User}@${DropletIP}" "rm -f /tmp/tic-backend.zip" 2>$null

Write-Log "🎉 Deploy concluído!"
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
Write-Host ""
Write-Warn "⚠️ Configurações importantes:"
Write-Host "1. Editar .env: ssh $User@$DropletIP 'sudo -u tic nano $AppDir/.env'" -ForegroundColor White
Write-Host "2. Alterar SECRET_KEY para produção" -ForegroundColor White
Write-Host "3. Configurar FRONTEND_URL no .env" -ForegroundColor White
Write-Host "4. Alterar senha do MySQL (padrão: tic_password_123)" -ForegroundColor White
Write-Host ""
Write-Info "Para configurar chaves SSH (recomendado):"
Write-Host "Consulte o arquivo SSH_SETUP.md" -ForegroundColor White