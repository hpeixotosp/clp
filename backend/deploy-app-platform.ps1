# Script de deploy para DigitalOcean App Platform (Windows)
# Este script prepara o ambiente para evitar erros de build

Write-Host "🚀 Preparando deploy para DigitalOcean App Platform..." -ForegroundColor Green
Write-Host "⚠️  ATENÇÃO: Esta versão ultra-minimalista remove pandas e pdfplumber" -ForegroundColor Yellow
Write-Host "📄 Funcionalidades de processamento de PDF estarão temporariamente desabilitadas" -ForegroundColor Yellow

# Backup do requirements.txt original
Copy-Item "requirements.txt" "requirements-full.txt" -Force

# Usar requirements ultra-mínimos para evitar erro de build
Write-Host "📦 Usando dependências ultra-mínimas para deploy..." -ForegroundColor Yellow
Copy-Item "requirements-minimal.txt" "requirements.txt" -Force

# Verificar se os arquivos de configuração existem
if (-not (Test-Path "runtime.txt")) {
    Write-Host "⚠️  Criando runtime.txt..." -ForegroundColor Yellow
    "python-3.11.10" | Out-File -FilePath "runtime.txt" -Encoding UTF8
}

if (-not (Test-Path ".python-version")) {
    Write-Host "⚠️  Criando .python-version..." -ForegroundColor Yellow
    "3.11.10" | Out-File -FilePath ".python-version" -Encoding UTF8
}

Write-Host "✅ Preparação concluída!" -ForegroundColor Green
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Faça commit das alterações" -ForegroundColor White
Write-Host "   2. Faça push para o repositório" -ForegroundColor White
Write-Host "   3. Configure as variáveis de ambiente no DigitalOcean:" -ForegroundColor White
Write-Host "      - DATABASE_URL" -ForegroundColor Gray
Write-Host "      - MYSQL_HOST" -ForegroundColor Gray
Write-Host "      - MYSQL_USER" -ForegroundColor Gray
Write-Host "      - MYSQL_PASSWORD" -ForegroundColor Gray
Write-Host "      - MYSQL_DATABASE" -ForegroundColor Gray
Write-Host "      - GOOGLE_API_KEY" -ForegroundColor Gray
Write-Host "   4. Inicie o deploy no App Platform" -ForegroundColor White

Write-Host "🔄 Para restaurar dependências completas após deploy:" -ForegroundColor Magenta
Write-Host "   Copy-Item 'requirements-full.txt' 'requirements.txt' -Force" -ForegroundColor Gray