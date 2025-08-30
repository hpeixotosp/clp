#!/bin/bash

# Script para configurar variáveis de ambiente no servidor DigitalOcean
# Execute este script no servidor para configurar o ambiente de produção

set -e  # Exit on any error

echo "=== Configurando Variáveis de Ambiente para Produção ==="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

log_input() {
    echo -e "${BLUE}[INPUT]${NC} $1"
}

# Verificar se está rodando como root ou com sudo
if [[ $EUID -eq 0 ]]; then
    APP_DIR="/var/www/frontend"
    SERVICE_USER="clpapp"
else
    log_error "Este script deve ser executado como root ou com sudo"
    exit 1
fi

# Criar diretório da aplicação se não existir
if [ ! -d "$APP_DIR" ]; then
    log_info "Criando diretório da aplicação: $APP_DIR"
    mkdir -p "$APP_DIR"
fi

# Função para obter IP do servidor
get_server_ip() {
    # Tentar obter IP público
    local ip=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || curl -s icanhazip.com 2>/dev/null)
    if [ -z "$ip" ]; then
        # Fallback para IP local
        ip=$(hostname -I | awk '{print $1}')
    fi
    echo "$ip"
}

# Obter IP do servidor
SERVER_IP=$(get_server_ip)
log_info "IP do servidor detectado: $SERVER_IP"

# Perguntar se o usuário quer usar o IP detectado ou inserir um customizado
echo ""
log_input "IP do servidor detectado: $SERVER_IP"
read -p "Deseja usar este IP? (y/n) [y]: " use_detected_ip
use_detected_ip=${use_detected_ip:-y}

if [[ $use_detected_ip != "y" && $use_detected_ip != "Y" ]]; then
    read -p "Digite o IP ou domínio do servidor: " custom_ip
    if [ ! -z "$custom_ip" ]; then
        SERVER_IP="$custom_ip"
    fi
fi

log_info "Usando IP/domínio: $SERVER_IP"

# Criar arquivo .env.production
ENV_FILE="$APP_DIR/.env.production"

log_info "Criando arquivo de ambiente: $ENV_FILE"

cat > "$ENV_FILE" << EOF
# Arquivo de variáveis de ambiente para produção
# Gerado automaticamente em $(date)

# Ambiente de execução
NODE_ENV=production

# Porta onde o Next.js irá rodar
PORT=3000

# URL base da API (através do Nginx)
NEXT_PUBLIC_API_URL=http://$SERVER_IP/api

# URL do backend (mesmo que API_URL para consistência)
NEXT_PUBLIC_BACKEND_URL=http://$SERVER_IP/api

# Ambiente público (usado para condicionais no frontend)
NEXT_PUBLIC_ENVIRONMENT=production

# URL base da aplicação (usado para SEO e meta tags)
NEXT_PUBLIC_APP_URL=http://$SERVER_IP

# Configurações de build do Next.js
NEXT_TELEMETRY_DISABLED=1

# Configurações específicas da aplicação CLP
# Timeout para requisições da API (em milissegundos)
NEXT_PUBLIC_API_TIMEOUT=30000

# Número máximo de itens por página
NEXT_PUBLIC_ITEMS_PER_PAGE=20

# Configurações de upload de arquivos
NEXT_PUBLIC_MAX_FILE_SIZE=10485760
NEXT_PUBLIC_ALLOWED_FILE_TYPES=pdf,doc,docx,xls,xlsx,jpg,jpeg,png

# Configurações de sessão
NEXT_PUBLIC_SESSION_TIMEOUT=3600000
EOF

# Configurar permissões
log_info "Configurando permissões do arquivo de ambiente..."
chown $SERVICE_USER:$SERVICE_USER "$ENV_FILE"
chmod 600 "$ENV_FILE"

# Verificar se o arquivo foi criado corretamente
if [ -f "$ENV_FILE" ]; then
    log_info "Arquivo de ambiente criado com sucesso!"
    echo ""
    echo "Conteúdo do arquivo:"
    echo "==================="
    cat "$ENV_FILE"
    echo "==================="
else
    log_error "Falha ao criar arquivo de ambiente"
    exit 1
fi

# Perguntar se o usuário quer configurar variáveis adicionais
echo ""
log_input "Deseja configurar variáveis adicionais? (y/n) [n]: "
read -p "" configure_additional
configure_additional=${configure_additional:-n}

if [[ $configure_additional == "y" || $configure_additional == "Y" ]]; then
    echo ""
    log_info "Configurações adicionais disponíveis:"
    echo "1. Sentry (monitoramento de erros)"
    echo "2. Google Analytics"
    echo "3. Configurações de autenticação"
    echo "4. Configurações de banco de dados"
    echo "5. Configurações de Redis"
    echo ""
    
    # Sentry
    read -p "Configurar Sentry? (y/n) [n]: " setup_sentry
    setup_sentry=${setup_sentry:-n}
    if [[ $setup_sentry == "y" || $setup_sentry == "Y" ]]; then
        read -p "Digite o DSN do Sentry: " sentry_dsn
        if [ ! -z "$sentry_dsn" ]; then
            echo "" >> "$ENV_FILE"
            echo "# Configurações do Sentry" >> "$ENV_FILE"
            echo "SENTRY_DSN=$sentry_dsn" >> "$ENV_FILE"
            echo "SENTRY_ENVIRONMENT=production" >> "$ENV_FILE"
            log_info "Configurações do Sentry adicionadas"
        fi
    fi
    
    # Google Analytics
    read -p "Configurar Google Analytics? (y/n) [n]: " setup_ga
    setup_ga=${setup_ga:-n}
    if [[ $setup_ga == "y" || $setup_ga == "Y" ]]; then
        read -p "Digite o ID do Google Analytics: " ga_id
        if [ ! -z "$ga_id" ]; then
            echo "" >> "$ENV_FILE"
            echo "# Configurações do Google Analytics" >> "$ENV_FILE"
            echo "NEXT_PUBLIC_GA_ID=$ga_id" >> "$ENV_FILE"
            log_info "Configurações do Google Analytics adicionadas"
        fi
    fi
    
    # NextAuth
    read -p "Configurar NextAuth? (y/n) [n]: " setup_auth
    setup_auth=${setup_auth:-n}
    if [[ $setup_auth == "y" || $setup_auth == "Y" ]]; then
        # Gerar secret aleatório
        auth_secret=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)
        echo "" >> "$ENV_FILE"
        echo "# Configurações de autenticação" >> "$ENV_FILE"
        echo "NEXTAUTH_SECRET=$auth_secret" >> "$ENV_FILE"
        echo "NEXTAUTH_URL=http://$SERVER_IP" >> "$ENV_FILE"
        log_info "Configurações de autenticação adicionadas"
    fi
fi

# Criar backup do arquivo de ambiente
log_info "Criando backup do arquivo de ambiente..."
cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"

# Verificar se o serviço frontend existe e reiniciá-lo
if systemctl list-unit-files | grep -q "frontend.service"; then
    log_info "Reiniciando serviço frontend para aplicar novas variáveis..."
    systemctl restart frontend
    
    # Verificar se o serviço está rodando
    if systemctl is-active --quiet frontend; then
        log_info "Serviço frontend reiniciado com sucesso"
    else
        log_warn "Serviço frontend pode não estar rodando corretamente"
        echo "Verifique com: systemctl status frontend"
    fi
else
    log_warn "Serviço frontend não encontrado. Execute o deploy primeiro."
fi

echo ""
log_info "=== Configuração de ambiente concluída! ==="
echo ""
echo "Arquivo criado: $ENV_FILE"
echo "Backup criado: $ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
echo ""
echo "Próximos passos:"
echo "1. Execute o deploy do frontend"
echo "2. Verifique se o backend está rodando na porta 8000"
echo "3. Teste a aplicação em http://$SERVER_IP"
echo ""
echo "Comandos úteis:"
echo "- Ver variáveis: cat $ENV_FILE"
echo "- Editar variáveis: nano $ENV_FILE"
echo "- Reiniciar frontend: systemctl restart frontend"
echo "- Ver logs: journalctl -u frontend -f"
echo ""
log_info "Configuração finalizada!"