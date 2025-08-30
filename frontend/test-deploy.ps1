# Script para testar o deploy completo do frontend no DigitalOcean
# Execute este script após o deploy para validar se tudo está funcionando

param(
    [string]$ServerIP = "143.110.196.243",
    [string]$ServerUser = "root",
    [switch]$Verbose
)

# Configurações
$FrontendPort = "3000"
$BackendPort = "8000"
$NginxPort = "80"

# Contadores de testes
$TestsPassed = 0
$TestsFailed = 0
$TotalTests = 0

# Função para log
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Test {
    param([string]$Message)
    Write-Host "[TEST] $Message" -ForegroundColor Blue
}

# Função para executar teste
function Invoke-Test {
    param(
        [string]$TestName,
        [scriptblock]$TestCommand
    )
    
    $script:TotalTests++
    Write-Test $TestName
    
    try {
        $result = & $TestCommand
        if ($result) {
            Write-Host "  ✅ PASSOU" -ForegroundColor Green
            $script:TestsPassed++
            return $true
        } else {
            Write-Host "  ❌ FALHOU" -ForegroundColor Red
            $script:TestsFailed++
            return $false
        }
    } catch {
        Write-Host "  ❌ FALHOU - $($_.Exception.Message)" -ForegroundColor Red
        $script:TestsFailed++
        return $false
    }
}

# Função para testar conectividade SSH
function Test-SSHConnection {
    Write-Test "Testando conexão SSH com o servidor"
    try {
        $result = ssh -o ConnectTimeout=10 -o BatchMode=yes "$ServerUser@$ServerIP" "echo 'SSH OK'" 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ PASSOU - SSH conectado" -ForegroundColor Green
            $script:TestsPassed++
        } else {
            Write-Host "  ❌ FALHOU - Não foi possível conectar via SSH" -ForegroundColor Red
            $script:TestsFailed++
            return $false
        }
    } catch {
        Write-Host "  ❌ FALHOU - Erro na conexão SSH: $($_.Exception.Message)" -ForegroundColor Red
        $script:TestsFailed++
        return $false
    }
    $script:TotalTests++
    return $true
}

# Função para testar serviços no servidor
function Test-ServerServices {
    Write-Info "Testando serviços no servidor..."
    
    # Teste 1: Nginx está rodando
    Invoke-Test "Nginx está ativo" {
        $result = ssh "$ServerUser@$ServerIP" "systemctl is-active nginx" 2>$null
        return $result -eq "active"
    }
    
    # Teste 2: Frontend service está rodando
    Invoke-Test "Serviço frontend está ativo" {
        $result = ssh "$ServerUser@$ServerIP" "systemctl is-active frontend" 2>$null
        return $result -eq "active"
    }
    
    # Teste 3: Porta 80 está aberta (Nginx)
    Invoke-Test "Porta 80 (Nginx) está aberta" {
        $result = ssh "$ServerUser@$ServerIP" "netstat -tlnp | grep :80" 2>$null
        return $result -match "LISTEN"
    }
    
    # Teste 4: Porta 3000 está aberta (Next.js)
    Invoke-Test "Porta 3000 (Next.js) está aberta" {
        $result = ssh "$ServerUser@$ServerIP" "netstat -tlnp | grep :3000" 2>$null
        return $result -match "LISTEN"
    }
    
    # Teste 5: Diretório da aplicação existe
    Invoke-Test "Diretório da aplicação existe" {
        ssh "$ServerUser@$ServerIP" "test -d /var/www/frontend" 2>$null
        return $LASTEXITCODE -eq 0
    }
    
    # Teste 6: Arquivo .env.production existe
    Invoke-Test "Arquivo de ambiente existe" {
        ssh "$ServerUser@$ServerIP" "test -f /var/www/frontend/.env.production" 2>$null
        return $LASTEXITCODE -eq 0
    }
    
    # Teste 7: Arquivos do Next.js existem
    Invoke-Test "Build do Next.js existe" {
        ssh "$ServerUser@$ServerIP" "test -d /var/www/frontend/.next" 2>$null
        return $LASTEXITCODE -eq 0
    }
    
    # Teste 8: package.json existe
    Invoke-Test "package.json existe" {
        ssh "$ServerUser@$ServerIP" "test -f /var/www/frontend/package.json" 2>$null
        return $LASTEXITCODE -eq 0
    }
}

# Função para testar conectividade HTTP
function Test-HTTPConnectivity {
    Write-Info "Testando conectividade HTTP..."
    
    # Teste 1: Nginx responde na porta 80
    Invoke-Test "Nginx responde na porta 80" {
        try {
            $response = Invoke-WebRequest -Uri "http://$ServerIP" -TimeoutSec 10 -UseBasicParsing
            return $response.StatusCode -eq 200
        } catch {
            return $false
        }
    }
    
    # Teste 2: Next.js responde diretamente na porta 3000
    Invoke-Test "Next.js responde na porta 3000" {
        try {
            $response = Invoke-WebRequest -Uri "http://${ServerIP}:3000" -TimeoutSec 10 -UseBasicParsing
            return $response.StatusCode -eq 200
        } catch {
            return $false
        }
    }
    
    # Teste 3: Rota da API através do Nginx
    Invoke-Test "Rota /api/ através do Nginx" {
        try {
            $response = Invoke-WebRequest -Uri "http://$ServerIP/api/" -TimeoutSec 10 -UseBasicParsing
            return $response.StatusCode -in @(200, 404, 405)
        } catch {
            # Se der erro 404 ou 405, ainda é um resultado válido (significa que o Nginx está roteando)
            return $_.Exception.Response.StatusCode -in @(404, 405)
        }
    }
    
    # Teste 4: Favicon acessível
    Invoke-Test "Favicon acessível" {
        try {
            $response = Invoke-WebRequest -Uri "http://$ServerIP/favicon.ico" -TimeoutSec 10 -UseBasicParsing
            return $response.StatusCode -in @(200, 404)
        } catch {
            return $_.Exception.Response.StatusCode -eq 404
        }
    }
}

# Função para testar performance
function Test-Performance {
    Write-Info "Testando performance..."
    
    # Teste 1: Tempo de resposta do Nginx < 2 segundos
    $script:TotalTests++
    Write-Test "Tempo de resposta do Nginx < 2 segundos"
    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-WebRequest -Uri "http://$ServerIP" -TimeoutSec 10 -UseBasicParsing
        $stopwatch.Stop()
        $responseTime = $stopwatch.Elapsed.TotalSeconds
        
        if ($responseTime -lt 2.0) {
            Write-Host "  ✅ PASSOU - Nginx responde em $([math]::Round($responseTime, 2))s" -ForegroundColor Green
            $script:TestsPassed++
        } else {
            Write-Host "  ❌ FALHOU - Nginx muito lento: $([math]::Round($responseTime, 2))s" -ForegroundColor Red
            $script:TestsFailed++
        }
    } catch {
        Write-Host "  ❌ FALHOU - Erro ao testar Nginx: $($_.Exception.Message)" -ForegroundColor Red
        $script:TestsFailed++
    }
    
    # Teste 2: Tempo de resposta do Next.js < 3 segundos
    $script:TotalTests++
    Write-Test "Tempo de resposta do Next.js < 3 segundos"
    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-WebRequest -Uri "http://${ServerIP}:3000" -TimeoutSec 10 -UseBasicParsing
        $stopwatch.Stop()
        $responseTime = $stopwatch.Elapsed.TotalSeconds
        
        if ($responseTime -lt 3.0) {
            Write-Host "  ✅ PASSOU - Next.js responde em $([math]::Round($responseTime, 2))s" -ForegroundColor Green
            $script:TestsPassed++
        } else {
            Write-Host "  ❌ FALHOU - Next.js muito lento: $([math]::Round($responseTime, 2))s" -ForegroundColor Red
            $script:TestsFailed++
        }
    } catch {
        Write-Host "  ❌ FALHOU - Erro ao testar Next.js: $($_.Exception.Message)" -ForegroundColor Red
        $script:TestsFailed++
    }
}

# Função para testar logs
function Test-Logs {
    Write-Info "Verificando logs..."
    
    # Teste 1: Logs do frontend não têm erros críticos
    Invoke-Test "Sem erros críticos no frontend" {
        $errors = ssh "$ServerUser@$ServerIP" "journalctl -u frontend --since='5 minutes ago' | grep -i 'error\|critical\|fatal' | wc -l" 2>$null
        if ($errors -eq "0") {
            return $true
        } else {
            Write-Host "    ⚠️ $errors erros encontrados" -ForegroundColor Yellow
            return $false
        }
    }
    
    # Teste 2: Logs do Nginx não têm erros críticos
    Invoke-Test "Sem erros críticos no Nginx" {
        $errors = ssh "$ServerUser@$ServerIP" "tail -n 100 /var/log/nginx/clp-app.error.log 2>/dev/null | grep -i 'error\|critical\|fatal' | wc -l || echo '0'" 2>$null
        if ($errors -eq "0") {
            return $true
        } else {
            Write-Host "    ⚠️ $errors erros encontrados" -ForegroundColor Yellow
            return $false
        }
    }
}

# Função para mostrar informações do sistema
function Show-SystemInfo {
    Write-Info "Informações do sistema:"
    
    Write-Host "Servidor: $ServerIP"
    Write-Host "Usuário: $ServerUser"
    Write-Host ""
    
    # Informações do servidor
    Write-Host "=== Informações do Servidor ===" -ForegroundColor Cyan
    ssh "$ServerUser@$ServerIP" "uname -a"
    ssh "$ServerUser@$ServerIP" "df -h | grep -E '(Filesystem|/dev/)'"
    ssh "$ServerUser@$ServerIP" "free -h"
    ssh "$ServerUser@$ServerIP" "uptime"
    Write-Host ""
    
    # Status dos serviços
    Write-Host "=== Status dos Serviços ===" -ForegroundColor Cyan
    ssh "$ServerUser@$ServerIP" "systemctl status nginx --no-pager -l" 2>$null
    Write-Host ""
    ssh "$ServerUser@$ServerIP" "systemctl status frontend --no-pager -l" 2>$null
    Write-Host ""
    
    # Portas em uso
    Write-Host "=== Portas em Uso ===" -ForegroundColor Cyan
    ssh "$ServerUser@$ServerIP" "netstat -tlnp | grep -E ':(80|3000|8000)'"
    Write-Host ""
}

# Função principal
function Main {
    Write-Host "=== Testando Deploy Completo do Frontend ===" -ForegroundColor Magenta
    Write-Host "Iniciando testes em $(Get-Date)"
    Write-Host "Servidor: $ServerIP"
    Write-Host ""
    
    # Executar testes
    $sshOk = Test-SSHConnection
    
    if ($sshOk) {
        Test-ServerServices
        Test-HTTPConnectivity
        Test-Performance
        Test-Logs
    } else {
        Write-Error "Falha na conexão SSH. Abortando testes."
        exit 1
    }
    
    # Mostrar resultados
    Write-Host ""
    Write-Host "=== RESULTADOS DOS TESTES ===" -ForegroundColor Magenta
    Write-Host "Total de testes: $TotalTests"
    Write-Host "Testes passaram: " -NoNewline
    Write-Host $TestsPassed -ForegroundColor Green
    Write-Host "Testes falharam: " -NoNewline
    Write-Host $TestsFailed -ForegroundColor Red
    
    if ($TestsFailed -eq 0) {
        Write-Host ""
        Write-Host "🎉 TODOS OS TESTES PASSARAM!" -ForegroundColor Green
        Write-Host "✅ Deploy do frontend está funcionando corretamente" -ForegroundColor Green
        Write-Host ""
        Write-Host "URLs disponíveis:"
        Write-Host "- Frontend (Nginx): http://$ServerIP" -ForegroundColor Cyan
        Write-Host "- Frontend (direto): http://${ServerIP}:3000" -ForegroundColor Cyan
        Write-Host "- API (se backend estiver rodando): http://$ServerIP/api" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "❌ ALGUNS TESTES FALHARAM" -ForegroundColor Red
        Write-Host "⚠️ Verifique os logs e configurações" -ForegroundColor Yellow
        
        Write-Host ""
        Write-Host "Comandos para diagnóstico:"
        Write-Host "- Ver logs frontend: ssh $ServerUser@$ServerIP 'sudo journalctl -u frontend -f'" -ForegroundColor Cyan
        Write-Host "- Ver logs Nginx: ssh $ServerUser@$ServerIP 'sudo tail -f /var/log/nginx/clp-app.error.log'" -ForegroundColor Cyan
        Write-Host "- Verificar serviços: ssh $ServerUser@$ServerIP 'sudo systemctl status nginx frontend'" -ForegroundColor Cyan
        Write-Host "- Testar conectividade: curl -v http://$ServerIP" -ForegroundColor Cyan
    }
    
    # Mostrar informações do sistema se solicitado
    if ($Verbose) {
        Write-Host ""
        Show-SystemInfo
    }
    
    Write-Host ""
    Write-Info "Testes concluídos em $(Get-Date)"
    
    # Retornar código de saída apropriado
    if ($TestsFailed -eq 0) {
        exit 0
    } else {
        exit 1
    }
}

# Verificar dependências
if (!(Get-Command ssh -ErrorAction SilentlyContinue)) {
    Write-Error "SSH não está disponível. Instale o OpenSSH Client."
    exit 1
}

# Executar função principal
Main