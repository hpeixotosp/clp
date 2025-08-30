# Script para corrigir problemas do deploy
param(
    [Parameter(Mandatory=$true)]
    [string]$DropletIP,
    
    [Parameter(Mandatory=$false)]
    [string]$User = "root"
)

Write-Host "Corrigindo problemas do deploy..." -ForegroundColor Green

# Comandos para corrigir os problemas
$fixCommands = @"
# Corrigir configuração do MySQL
sudo mysql -e "CREATE DATABASE IF NOT EXISTS tic_production;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'tic_user'@'localhost' IDENTIFIED BY 'tic_password_123';"
sudo mysql -e "GRANT ALL PRIVILEGES ON tic_production.* TO 'tic_user'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

# Verificar e corrigir arquivo .env
cd /home/tic/app
sudo -u tic cp .env.example .env 2>/dev/null || true

# Configurar variáveis de ambiente essenciais
sudo -u tic tee .env > /dev/null << 'EOF'
DATABASE_URL=mysql://tic_user:tic_password_123@localhost/tic_production
SECRET_KEY=your-secret-key-change-in-production
FRONTEND_URL=http://localhost:3000
ENVIRONMENT=production
DEBUG=False
EOF

# Testar conexão com banco
sudo -u tic /home/tic/app/venv/bin/python -c "from database.connection import get_db; print('Conexão com banco OK')" 2>/dev/null || echo "Erro na conexão com banco"

# Corrigir configuração do Nginx
sudo systemctl stop nginx
sudo nginx -t
sudo systemctl start nginx
sudo systemctl enable nginx

# Reiniciar aplicação
sudo supervisorctl stop tic-backend
sudo supervisorctl start tic-backend

# Verificar status
echo "=== STATUS DA APLICAÇÃO ==="
sudo supervisorctl status tic-backend

echo "=== LOGS DA APLICAÇÃO (últimas 10 linhas) ==="
sudo tail -10 /var/log/tic-backend.log

echo "=== TESTE DA API ==="
curl -s http://localhost:8000/health || echo "API não respondeu"

echo "=== PORTAS EM USO ==="
sudo netstat -tlnp | grep :8000
sudo netstat -tlnp | grep :80
"@

Write-Host "Executando correções no servidor..." -ForegroundColor Yellow
ssh "${User}@${DropletIP}" $fixCommands

Write-Host "Testando API externamente..." -ForegroundColor Blue
Start-Sleep -Seconds 3

try {
    $response = Invoke-WebRequest -Uri "http://$DropletIP/health" -TimeoutSec 10 -ErrorAction Stop
    Write-Host "✅ API respondeu: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Resposta: $($response.Content)" -ForegroundColor White
} catch {
    Write-Host "❌ API não respondeu: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "URLs para testar:" -ForegroundColor Cyan
Write-Host "- Health Check: http://$DropletIP/health" -ForegroundColor White
Write-Host "- Documentacao: http://$DropletIP/docs" -ForegroundColor White
Write-Host "- API Base: http://$DropletIP" -ForegroundColor White