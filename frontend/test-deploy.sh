#!/bin/bash

# Script para testar o deploy completo do frontend no DigitalOcean
# Execute este script após o deploy para validar se tudo está funcionando

set -e  # Exit on any error

echo "=== Testando Deploy Completo do Frontend ==="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
SERVER_IP="143.110.196.243"
SERVER_USER="root"
FRONTEND_PORT="3000"
BACKEND_PORT="8000"
NGINX_PORT="80"

# Contadores de testes
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Função para log
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

# Função para executar teste
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    log_test "$test_name"
    
    if eval "$test_command"; then
        echo -e "  ${GREEN}✅ PASSOU${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "  ${RED}❌ FALHOU${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Função para testar conectividade SSH
test_ssh_connection() {
    log_test "Testando conexão SSH com o servidor"
    if ssh -o ConnectTimeout=10 -o BatchMode=yes $SERVER_USER@$SERVER_IP "echo 'SSH OK'" >/dev/null 2>&1; then
        echo -e "  ${GREEN}✅ PASSOU - SSH conectado${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "  ${RED}❌ FALHOU - Não foi possível conectar via SSH${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

# Função para testar serviços no servidor
test_server_services() {
    log_info "Testando serviços no servidor..."
    
    # Teste 1: Nginx está rodando
    run_test "Nginx está ativo" \
        "ssh $SERVER_USER@$SERVER_IP 'systemctl is-active nginx' | grep -q 'active'" \
        "active"
    
    # Teste 2: Frontend service está rodando
    run_test "Serviço frontend está ativo" \
        "ssh $SERVER_USER@$SERVER_IP 'systemctl is-active frontend' | grep -q 'active'" \
        "active"
    
    # Teste 3: Porta 80 está aberta (Nginx)
    run_test "Porta 80 (Nginx) está aberta" \
        "ssh $SERVER_USER@$SERVER_IP 'netstat -tlnp | grep :80' | grep -q 'LISTEN'" \
        "LISTEN"
    
    # Teste 4: Porta 3000 está aberta (Next.js)
    run_test "Porta 3000 (Next.js) está aberta" \
        "ssh $SERVER_USER@$SERVER_IP 'netstat -tlnp | grep :3000' | grep -q 'LISTEN'" \
        "LISTEN"
    
    # Teste 5: Diretório da aplicação existe
    run_test "Diretório da aplicação existe" \
        "ssh $SERVER_USER@$SERVER_IP 'test -d /var/www/frontend'" \
        "true"
    
    # Teste 6: Arquivo .env.production existe
    run_test "Arquivo de ambiente existe" \
        "ssh $SERVER_USER@$SERVER_IP 'test -f /var/www/frontend/.env.production'" \
        "true"
    
    # Teste 7: Arquivos do Next.js existem
    run_test "Build do Next.js existe" \
        "ssh $SERVER_USER@$SERVER_IP 'test -d /var/www/frontend/.next'" \
        "true"
    
    # Teste 8: package.json existe
    run_test "package.json existe" \
        "ssh $SERVER_USER@$SERVER_IP 'test -f /var/www/frontend/package.json'" \
        "true"
}

# Função para testar conectividade HTTP
test_http_connectivity() {
    log_info "Testando conectividade HTTP..."
    
    # Teste 1: Nginx responde na porta 80
    run_test "Nginx responde na porta 80" \
        "curl -f -s -o /dev/null -w '%{http_code}' http://$SERVER_IP | grep -q '200'" \
        "200"
    
    # Teste 2: Next.js responde diretamente na porta 3000
    run_test "Next.js responde na porta 3000" \
        "curl -f -s -o /dev/null -w '%{http_code}' http://$SERVER_IP:3000 | grep -q '200'" \
        "200"
    
    # Teste 3: Rota da API através do Nginx
    run_test "Rota /api/ através do Nginx" \
        "curl -f -s -o /dev/null -w '%{http_code}' http://$SERVER_IP/api/ | grep -E '(200|404|405)'" \
        "200|404|405"
    
    # Teste 4: Arquivos estáticos do Next.js
    run_test "Arquivos estáticos acessíveis" \
        "curl -f -s -o /dev/null -w '%{http_code}' http://$SERVER_IP/_next/static/ | grep -E '(200|403|404)'" \
        "200|403|404"
    
    # Teste 5: Favicon acessível
    run_test "Favicon acessível" \
        "curl -f -s -o /dev/null -w '%{http_code}' http://$SERVER_IP/favicon.ico | grep -E '(200|404)'" \
        "200|404"
}

# Função para testar performance
test_performance() {
    log_info "Testando performance..."
    
    # Teste 1: Tempo de resposta do Nginx < 2 segundos
    local nginx_time=$(curl -o /dev/null -s -w '%{time_total}' http://$SERVER_IP)
    if (( $(echo "$nginx_time < 2.0" | bc -l) )); then
        echo -e "  ${GREEN}✅ PASSOU - Nginx responde em ${nginx_time}s${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "  ${RED}❌ FALHOU - Nginx muito lento: ${nginx_time}s${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # Teste 2: Tempo de resposta do Next.js < 3 segundos
    local nextjs_time=$(curl -o /dev/null -s -w '%{time_total}' http://$SERVER_IP:3000)
    if (( $(echo "$nextjs_time < 3.0" | bc -l) )); then
        echo -e "  ${GREEN}✅ PASSOU - Next.js responde em ${nextjs_time}s${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "  ${RED}❌ FALHOU - Next.js muito lento: ${nextjs_time}s${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

# Função para testar logs
test_logs() {
    log_info "Verificando logs..."
    
    # Teste 1: Logs do frontend não têm erros críticos
    local frontend_errors=$(ssh $SERVER_USER@$SERVER_IP "journalctl -u frontend --since='5 minutes ago' | grep -i 'error\|critical\|fatal' | wc -l")
    if [ "$frontend_errors" -eq 0 ]; then
        echo -e "  ${GREEN}✅ PASSOU - Sem erros críticos no frontend${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "  ${YELLOW}⚠️  AVISO - $frontend_errors erros encontrados no frontend${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # Teste 2: Logs do Nginx não têm erros críticos
    local nginx_errors=$(ssh $SERVER_USER@$SERVER_IP "tail -n 100 /var/log/nginx/clp-app.error.log 2>/dev/null | grep -i 'error\|critical\|fatal' | wc -l" || echo "0")
    if [ "$nginx_errors" -eq 0 ]; then
        echo -e "  ${GREEN}✅ PASSOU - Sem erros críticos no Nginx${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "  ${YELLOW}⚠️  AVISO - $nginx_errors erros encontrados no Nginx${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

# Função para mostrar informações do sistema
show_system_info() {
    log_info "Informações do sistema:"
    
    echo "Servidor: $SERVER_IP"
    echo "Usuário: $SERVER_USER"
    echo ""
    
    # Informações do servidor
    echo "=== Informações do Servidor ==="
    ssh $SERVER_USER@$SERVER_IP "uname -a"
    ssh $SERVER_USER@$SERVER_IP "df -h | grep -E '(Filesystem|/dev/)'"
    ssh $SERVER_USER@$SERVER_IP "free -h"
    ssh $SERVER_USER@$SERVER_IP "uptime"
    echo ""
    
    # Status dos serviços
    echo "=== Status dos Serviços ==="
    ssh $SERVER_USER@$SERVER_IP "systemctl status nginx --no-pager -l" || true
    echo ""
    ssh $SERVER_USER@$SERVER_IP "systemctl status frontend --no-pager -l" || true
    echo ""
    
    # Portas em uso
    echo "=== Portas em Uso ==="
    ssh $SERVER_USER@$SERVER_IP "netstat -tlnp | grep -E ':(80|3000|8000)'"
    echo ""
}

# Função principal
main() {
    echo "Iniciando testes de deploy em $(date)"
    echo "Servidor: $SERVER_IP"
    echo ""
    
    # Executar testes
    test_ssh_connection
    
    if [ $TESTS_FAILED -eq 0 ]; then
        test_server_services
        test_http_connectivity
        test_performance
        test_logs
    else
        log_error "Falha na conexão SSH. Abortando testes."
        exit 1
    fi
    
    # Mostrar resultados
    echo ""
    echo "=== RESULTADOS DOS TESTES ==="
    echo "Total de testes: $TOTAL_TESTS"
    echo -e "Testes passaram: ${GREEN}$TESTS_PASSED${NC}"
    echo -e "Testes falharam: ${RED}$TESTS_FAILED${NC}"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "\n${GREEN}🎉 TODOS OS TESTES PASSARAM!${NC}"
        echo -e "${GREEN}✅ Deploy do frontend está funcionando corretamente${NC}"
        echo ""
        echo "URLs disponíveis:"
        echo "- Frontend (Nginx): http://$SERVER_IP"
        echo "- Frontend (direto): http://$SERVER_IP:3000"
        echo "- API (se backend estiver rodando): http://$SERVER_IP/api"
    else
        echo -e "\n${RED}❌ ALGUNS TESTES FALHARAM${NC}"
        echo -e "${YELLOW}⚠️  Verifique os logs e configurações${NC}"
        
        echo ""
        echo "Comandos para diagnóstico:"
        echo "- Ver logs frontend: ssh $SERVER_USER@$SERVER_IP 'sudo journalctl -u frontend -f'"
        echo "- Ver logs Nginx: ssh $SERVER_USER@$SERVER_IP 'sudo tail -f /var/log/nginx/clp-app.error.log'"
        echo "- Verificar serviços: ssh $SERVER_USER@$SERVER_IP 'sudo systemctl status nginx frontend'"
        echo "- Testar conectividade: curl -v http://$SERVER_IP"
    fi
    
    # Mostrar informações do sistema se solicitado
    if [ "$1" = "--verbose" ] || [ "$1" = "-v" ]; then
        echo ""
        show_system_info
    fi
    
    echo ""
    log_info "Testes concluídos em $(date)"
    
    # Retornar código de saída apropriado
    if [ $TESTS_FAILED -eq 0 ]; then
        exit 0
    else
        exit 1
    fi
}

# Verificar dependências
if ! command -v curl &> /dev/null; then
    log_error "curl não está instalado. Instale com: sudo apt install curl"
    exit 1
fi

if ! command -v ssh &> /dev/null; then
    log_error "ssh não está instalado. Instale com: sudo apt install openssh-client"
    exit 1
fi

if ! command -v bc &> /dev/null; then
    log_warn "bc não está instalado. Testes de performance serão ignorados."
fi

# Executar função principal
main "$@"