#!/bin/bash

# Script de deploy do frontend para DigitalOcean
# Este script faz o build do Next.js e envia os arquivos para o servidor

set -e  # Parar execução se houver erro

echo "🚀 Iniciando deploy do frontend..."

# Configurações do servidor
SERVER_IP="143.110.196.243"
SERVER_USER="root"
FRONTEND_PATH="/var/www/frontend"
BUILD_DIR=".next"
STATIC_DIR="public"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📦 Fazendo build do projeto...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro no build do projeto!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build concluído com sucesso!${NC}"

echo -e "${YELLOW}📁 Criando arquivo compactado...${NC}"
# Criar arquivo tar com os arquivos necessários
tar -czf frontend-build.tar.gz \
    .next \
    public \
    package.json \
    package-lock.json \
    next.config.js \
    --exclude='.next/cache' \
    --exclude='node_modules'

echo -e "${YELLOW}🚀 Enviando arquivos para o servidor...${NC}"
# Enviar arquivo para o servidor
scp frontend-build.tar.gz $SERVER_USER@$SERVER_IP:/tmp/

echo -e "${YELLOW}📋 Executando comandos no servidor...${NC}"
# Executar comandos no servidor
ssh $SERVER_USER@$SERVER_IP << 'EOF'
    set -e
    
    echo "🔄 Parando serviços..."
    systemctl stop frontend || true
    
    echo "📁 Criando diretório do frontend..."
    mkdir -p /var/www/frontend
    
    echo "🗑️ Removendo arquivos antigos..."
    rm -rf /var/www/frontend/*
    
    echo "📦 Extraindo novos arquivos..."
    cd /var/www/frontend
    tar -xzf /tmp/frontend-build.tar.gz
    
    echo "📦 Instalando dependências de produção..."
    npm ci --only=production
    
    echo "🔧 Configurando permissões..."
    chown -R www-data:www-data /var/www/frontend
    chmod -R 755 /var/www/frontend
    
    echo "🔧 Verificando variáveis de ambiente..."
    if [ ! -f /var/www/frontend/.env.production ]; then
        echo "Configurando variáveis de ambiente..."
        cat > /var/www/frontend/.env.production << 'ENVEOF'
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
ENVEOF
        chown www-data:www-data /var/www/frontend/.env.production
        chmod 600 /var/www/frontend/.env.production
        echo "✅ Variáveis de ambiente configuradas"
    else
        echo "✅ Variáveis de ambiente já existem"
    fi
    
    echo "🚀 Iniciando serviço do frontend..."
    systemctl start frontend
    systemctl enable frontend
    
    echo "🧹 Limpando arquivos temporários..."
    rm -f /tmp/frontend-build.tar.gz
    
    echo "✅ Deploy concluído!"
EOF

echo -e "${GREEN}🎉 Deploy do frontend concluído com sucesso!${NC}"

# Limpar arquivo local
rm -f frontend-build.tar.gz

# Verificar se o Nginx está configurado
echo -e "${YELLOW}🔧 Verificando configuração do Nginx...${NC}"
if ssh $SERVER_USER@$SERVER_IP "sudo nginx -t" 2>/dev/null; then
    echo -e "${GREEN}✅ Nginx configurado corretamente${NC}"
    
    # Recarregar configuração do Nginx
    ssh $SERVER_USER@$SERVER_IP "sudo nginx -s reload"
    echo -e "${GREEN}✅ Configuração do Nginx recarregada${NC}"
else
    echo -e "${YELLOW}⚠️ Nginx não está configurado. Execute setup-nginx.sh no servidor.${NC}"
fi

# Testar se o frontend está acessível
echo -e "${YELLOW}🧪 Testando acessibilidade do frontend...${NC}"
sleep 5

# Testar através do Nginx (porta 80)
if curl -f -s "http://$SERVER_IP" > /dev/null; then
    echo -e "${GREEN}✅ Frontend está acessível através do Nginx em http://$SERVER_IP${NC}"
elif curl -f -s "http://$SERVER_IP:3000" > /dev/null; then
    echo -e "${GREEN}✅ Frontend está acessível diretamente em http://$SERVER_IP:3000${NC}"
    echo -e "${YELLOW}⚠️ Configure o Nginx para acesso através da porta 80${NC}"
else
    echo -e "${RED}❌ Não foi possível acessar o frontend. Verifique se o serviço está rodando.${NC}"
    echo -e "${YELLOW}Execute no servidor: sudo systemctl status frontend${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Deploy concluído com sucesso!${NC}"
echo -e "${GREEN}🌐 Frontend disponível em: http://$SERVER_IP${NC}"
echo -e "${GREEN}🔗 Acesso direto Next.js: http://$SERVER_IP:3000${NC}"
echo -e "${YELLOW}📋 Para verificar logs: ssh $SERVER_USER@$SERVER_IP 'sudo journalctl -u frontend -f'${NC}"
echo -e "${YELLOW}📋 Para verificar logs Nginx: ssh $SERVER_USER@$SERVER_IP 'sudo tail -f /var/log/nginx/clp-app.access.log'${NC}"
echo ""