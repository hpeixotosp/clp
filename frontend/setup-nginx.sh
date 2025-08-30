#!/bin/bash

# Script para configurar Nginx para servir frontend Next.js e backend FastAPI
# Execute este script no servidor DigitalOcean como root ou com sudo

set -e  # Exit on any error

echo "=== Configurando Nginx para CLP App ==="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Verificar se está rodando como root
if [[ $EUID -ne 0 ]]; then
   log_error "Este script deve ser executado como root ou com sudo"
   exit 1
fi

# Atualizar sistema
log_info "Atualizando sistema..."
apt update

# Instalar Nginx se não estiver instalado
if ! command -v nginx &> /dev/null; then
    log_info "Instalando Nginx..."
    apt install -y nginx
else
    log_info "Nginx já está instalado"
fi

# Criar diretório para a aplicação
log_info "Criando diretórios da aplicação..."
mkdir -p /var/www/frontend
mkdir -p /var/log/nginx

# Backup da configuração padrão do Nginx
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    log_info "Fazendo backup da configuração padrão..."
    mv /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.backup
fi

# Copiar configuração do Nginx
log_info "Copiando configuração do Nginx..."
cp nginx-full.conf /etc/nginx/sites-available/clp-app

# Criar link simbólico para habilitar o site
log_info "Habilitando site..."
ln -sf /etc/nginx/sites-available/clp-app /etc/nginx/sites-enabled/clp-app

# Testar configuração do Nginx
log_info "Testando configuração do Nginx..."
if nginx -t; then
    log_info "Configuração do Nginx está válida"
else
    log_error "Erro na configuração do Nginx"
    exit 1
fi

# Configurar firewall (UFW)
log_info "Configurando firewall..."
if command -v ufw &> /dev/null; then
    ufw allow 'Nginx Full'
    ufw allow ssh
    ufw --force enable
    log_info "Firewall configurado"
else
    log_warn "UFW não encontrado, configure o firewall manualmente"
fi

# Configurar usuário para a aplicação
log_info "Configurando usuário da aplicação..."
if ! id "clpapp" &>/dev/null; then
    useradd -r -s /bin/false clpapp
    log_info "Usuário clpapp criado"
else
    log_info "Usuário clpapp já existe"
fi

# Configurar permissões
log_info "Configurando permissões..."
chown -R clpapp:clpapp /var/www/frontend
chmod -R 755 /var/www/frontend

# Reiniciar e habilitar Nginx
log_info "Reiniciando Nginx..."
systemctl restart nginx
systemctl enable nginx

# Verificar status do Nginx
if systemctl is-active --quiet nginx; then
    log_info "Nginx está rodando corretamente"
else
    log_error "Nginx não está rodando"
    systemctl status nginx
    exit 1
fi

# Mostrar informações finais
echo ""
log_info "=== Configuração concluída com sucesso! ==="
echo ""
echo "Próximos passos:"
echo "1. Execute o deploy do frontend usando deploy.sh ou deploy.ps1"
echo "2. Certifique-se de que o backend FastAPI está rodando na porta 8000"
echo "3. Acesse http://143.110.196.243 para testar"
echo ""
echo "Comandos úteis:"
echo "- Verificar status: systemctl status nginx"
echo "- Recarregar config: nginx -s reload"
echo "- Ver logs: tail -f /var/log/nginx/clp-app.access.log"
echo "- Ver logs de erro: tail -f /var/log/nginx/clp-app.error.log"
echo ""
log_info "Configuração do Nginx finalizada!"