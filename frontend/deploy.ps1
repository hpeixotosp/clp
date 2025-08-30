# Script de deploy do frontend para DigitalOcean (PowerShell)
# Este script faz o build do Next.js e envia os arquivos para o servidor

param(
    [string]$ServerIP = "143.110.196.243",
    [string]$ServerUser = "root",
    [string]$FrontendPath = "/var/www/frontend"
)

# Configurações
$ErrorActionPreference = "Stop"

Write-Host "🚀 Iniciando deploy do frontend..." -ForegroundColor Yellow

# Verificar se o SSH está disponível
if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
    Write-Host "❌ SSH não encontrado. Instale o OpenSSH ou use WSL." -ForegroundColor Red
    exit 1
}

# Verificar se o SCP está disponível
if (-not (Get-Command scp -ErrorAction SilentlyContinue)) {
    Write-Host "❌ SCP não encontrado. Instale o OpenSSH ou use WSL." -ForegroundColor Red
    exit 1
}

try {
    Write-Host "📦 Fazendo build do projeto..." -ForegroundColor Yellow
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        throw "Erro no build do projeto!"
    }
    
    Write-Host "✅ Build concluído com sucesso!" -ForegroundColor Green
    
    Write-Host "📁 Criando arquivo compactado..." -ForegroundColor Yellow
    
    # Criar arquivo zip com os arquivos necessários
    $zipFile = "frontend-build.zip"
    if (Test-Path $zipFile) {
        Remove-Item $zipFile -Force
    }
    
    # Usar 7-Zip se disponível, senão usar Compress-Archive
    if (Get-Command 7z -ErrorAction SilentlyContinue) {
        7z a $zipFile .next public package.json package-lock.json next.config.js -x!.next\cache -x!node_modules
    } else {
        # Criar lista de arquivos para compactar
        $filesToZip = @()
        if (Test-Path ".next") { $filesToZip += Get-ChildItem ".next" -Recurse | Where-Object { $_.FullName -notlike "*.next\cache*" } }
        if (Test-Path "public") { $filesToZip += Get-ChildItem "public" -Recurse }
        if (Test-Path "package.json") { $filesToZip += "package.json" }
        if (Test-Path "package-lock.json") { $filesToZip += "package-lock.json" }
        if (Test-Path "next.config.js") { $filesToZip += "next.config.js" }
        
        Compress-Archive -Path $filesToZip -DestinationPath $zipFile -Force
    }
    
    Write-Host "🚀 Enviando arquivos para o servidor..." -ForegroundColor Yellow
    scp $zipFile "${ServerUser}@${ServerIP}:/tmp/frontend-build.zip"
    
    if ($LASTEXITCODE -ne 0) {
        throw "Erro ao enviar arquivos para o servidor!"
    }
    
    Write-Host "📋 Executando comandos no servidor..." -ForegroundColor Yellow
    
    # Script para executar no servidor
    $serverScript = @'
set -e

echo "🔄 Parando serviços..."
systemctl stop frontend || true

echo "📁 Criando diretório do frontend..."
mkdir -p /var/www/frontend

echo "🗑️ Removendo arquivos antigos..."
rm -rf /var/www/frontend/*

echo "📦 Extraindo novos arquivos..."
cd /var/www/frontend
unzip -q /tmp/frontend-build.zip

echo "📦 Instalando dependências de produção..."
npm ci --only=production

echo "🔧 Configurando permissões..."
chown -R www-data:www-data /var/www/frontend
chmod -R 755 /var/www/frontend

echo "🔧 Configurando variáveis de ambiente..."
if [ ! -f /var/www/frontend/.env.production ]; then
    cat > /var/www/frontend/.env.production << 'EOF'
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_API_URL=http://143.110.196.243/api
NEXT_PUBLIC_BACKEND_URL=http://143.110.196.243/api
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_APP_URL=http://143.110.196.243
NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_API_TIMEOUT=30000
NEXT_PUBLIC_ITEMS_PER_PAGE=20
NEXT_PUBLIC_MAX_FILE_SIZE=10485760
NEXT_PUBLIC_ALLOWED_FILE_TYPES=pdf,doc,docx,xls,xlsx,jpg,jpeg,png
NEXT_PUBLIC_SESSION_TIMEOUT=3600000
EOF
    chown www-data:www-data /var/www/frontend/.env.production
    chmod 600 /var/www/frontend/.env.production
    echo "✅ Variáveis de ambiente configuradas"
else
    echo "✅ Variáveis de ambiente já existem"
fi

echo "📋 Copiando arquivo de serviço..."
cp /tmp/frontend.service /etc/systemd/system/
systemctl daemon-reload

echo "🚀 Iniciando serviço do frontend..."
systemctl start frontend
systemctl enable frontend

echo "🧹 Limpando arquivos temporários..."
rm -f /tmp/frontend-build.zip /tmp/frontend.service

echo "✅ Deploy concluído!"
'@
    
    # Enviar arquivo de serviço
    scp "frontend.service" "${ServerUser}@${ServerIP}:/tmp/"
    
    # Executar script no servidor
    $serverScript | ssh "${ServerUser}@${ServerIP}" 'bash -s'
    
    if ($LASTEXITCODE -ne 0) {
        throw "Erro ao executar comandos no servidor!"
    }
    
    Write-Host "🎉 Deploy do frontend concluído com sucesso!" -ForegroundColor Green
    Write-Host "🌐 Frontend disponível em: http://$ServerIP" -ForegroundColor Green
    Write-Host "🔗 Acesso direto Next.js: http://${ServerIP}:3000" -ForegroundColor Cyan
    Write-Host "📋 Para verificar logs: ssh ${ServerUser}@${ServerIP} 'sudo journalctl -u frontend -f'" -ForegroundColor Cyan
    Write-Host "📋 Para verificar logs Nginx: ssh ${ServerUser}@${ServerIP} 'sudo tail -f /var/log/nginx/clp-app.access.log'" -ForegroundColor Cyan
    
    # Limpar arquivo local
    Remove-Item $zipFile -Force
    
    # Verificar se o Nginx está configurado
    Write-Host "🔧 Verificando configuração do Nginx..." -ForegroundColor Yellow
    ssh "${ServerUser}@${ServerIP}" "sudo nginx -t" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Nginx configurado corretamente" -ForegroundColor Green
        
        # Recarregar configuração do Nginx
        ssh "${ServerUser}@${ServerIP}" "sudo nginx -s reload"
        Write-Host "✅ Configuração do Nginx recarregada" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Nginx não está configurado. Execute setup-nginx.sh no servidor." -ForegroundColor Yellow
    }

    # Testar se o frontend está acessível
    Write-Host "🧪 Testando acessibilidade do frontend..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    try {
        # Testar através do Nginx (porta 80)
        $response = Invoke-WebRequest -Uri "http://$ServerIP" -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Frontend está acessível através do Nginx em http://$ServerIP" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️ Testando acesso direto ao Next.js..." -ForegroundColor Yellow
        try {
            $response = Invoke-WebRequest -Uri "http://${ServerIP}:3000" -TimeoutSec 10 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ Frontend está acessível diretamente em http://${ServerIP}:3000" -ForegroundColor Green
                Write-Host "⚠️ Configure o Nginx para acesso através da porta 80" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "❌ Não foi possível acessar o frontend. Verifique se o serviço está rodando." -ForegroundColor Red
            Write-Host "Execute no servidor: sudo systemctl status frontend" -ForegroundColor Cyan
        }
    }
    
} catch {
    Write-Host "❌ Erro durante o deploy: $($_.Exception.Message)" -ForegroundColor Red
    
    # Limpar arquivo local em caso de erro
    if (Test-Path "frontend-build.zip") {
        Remove-Item "frontend-build.zip" -Force
    }
    
    exit 1
}

Write-Host "🏁 Deploy finalizado!" -ForegroundColor Green