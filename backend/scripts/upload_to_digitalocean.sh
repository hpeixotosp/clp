#!/bin/bash

# Script para fazer upload do backend para DigitalOcean
# Execute este script na sua máquina local

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] $1${NC}"
}

# Verificar parâmetros
if [ $# -eq 0 ]; then
    echo "Uso: $0 <IP_DO_DROPLET> [USUARIO]"
    echo "Exemplo: $0 192.168.1.100"
    echo "Exemplo: $0 192.168.1.100 root"
    exit 1
fi

DROPLET_IP=$1
USER=${2:-root}
APP_DIR="/home/tic/app"

log "🚀 Iniciando upload para DigitalOcean..."
info "IP do Droplet: $DROPLET_IP"
info "Usuário: $USER"
info "Diretório de destino: $APP_DIR"

# Verificar se estamos no diretório correto
if [ ! -f "main.py" ] || [ ! -f "requirements.txt" ]; then
    error "Execute este script no diretório backend-api (onde estão main.py e requirements.txt)"
fi

# Verificar conectividade
log "Testando conectividade..."
if ! ping -c 1 $DROPLET_IP > /dev/null 2>&1; then
    error "Não foi possível conectar ao IP $DROPLET_IP"
fi

# Testar conexão SSH
log "Testando conexão SSH..."
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes $USER@$DROPLET_IP exit 2>/dev/null; then
    error "Não foi possível conectar via SSH. Verifique suas chaves SSH."
fi

log "Criando diretório da aplicação no servidor..."
ssh $USER@$DROPLET_IP "sudo -u tic mkdir -p $APP_DIR"

log "Fazendo backup dos arquivos existentes (se houver)..."
ssh $USER@$DROPLET_IP "sudo -u tic [ -d '$APP_DIR' ] && sudo -u tic cp -r $APP_DIR ${APP_DIR}_backup_$(date +%Y%m%d_%H%M%S) || true"

log "Criando arquivo de exclusões..."
cat > /tmp/rsync_exclude << 'EOF'
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
env/
venv/
.venv/
pip-log.txt
pip-delete-this-directory.txt
.tox/
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
*.log
.git/
.mypy_cache/
.pytest_cache/
.hypothesis/
.DS_Store
Thumbs.db
*.db
*.sqlite
*.sqlite3
temp/
uploads/
.env
EOF

log "Fazendo upload dos arquivos..."
rsync -avz --progress \
    --exclude-from=/tmp/rsync_exclude \
    --rsync-path="sudo -u tic rsync" \
    ./ $USER@$DROPLET_IP:$APP_DIR/

log "Configurando permissões..."
ssh $USER@$DROPLET_IP "sudo chown -R tic:tic $APP_DIR"

log "Criando ambiente virtual..."
ssh $USER@$DROPLET_IP "sudo -u tic python3 -m venv $APP_DIR/venv"

log "Instalando dependências..."
ssh $USER@$DROPLET_IP "sudo -u tic $APP_DIR/venv/bin/pip install --upgrade pip"
ssh $USER@$DROPLET_IP "sudo -u tic $APP_DIR/venv/bin/pip install -r $APP_DIR/requirements.txt"

log "Configurando arquivo .env..."
ssh $USER@$DROPLET_IP "sudo -u tic cp $APP_DIR/.env.template $APP_DIR/.env" || true

log "Atualizando configuração do Supervisor..."
ssh $USER@$DROPLET_IP "sudo supervisorctl reread"
ssh $USER@$DROPLET_IP "sudo supervisorctl update"

log "Reiniciando aplicação..."
ssh $USER@$DROPLET_IP "sudo supervisorctl restart tic-backend" || {
    warn "Falha ao reiniciar. Tentando iniciar..."
    ssh $USER@$DROPLET_IP "sudo supervisorctl start tic-backend"
}

log "Verificando status da aplicação..."
ssh $USER@$DROPLET_IP "sudo supervisorctl status tic-backend"

log "Testando API..."
sleep 5  # Aguardar inicialização
if ssh $USER@$DROPLET_IP "curl -s http://localhost:8000/health" | grep -q "healthy"; then
    log "✅ API está funcionando!"
else
    warn "⚠️ API pode não estar funcionando corretamente"
    info "Verificando logs..."
    ssh $USER@$DROPLET_IP "sudo tail -20 /var/log/tic-backend.log"
fi

log "Limpando arquivos temporários..."
rm -f /tmp/rsync_exclude

log "🎉 Upload concluído com sucesso!"
echo ""
info "📋 Informações importantes:"
echo "🌍 API URL: http://$DROPLET_IP"
echo "📚 Documentação: http://$DROPLET_IP/docs"
echo "🔍 Health Check: http://$DROPLET_IP/health"
echo ""
info "🔧 Comandos úteis no servidor:"
echo "• Status: sudo supervisorctl status tic-backend"
echo "• Logs: sudo tail -f /var/log/tic-backend.log"
echo "• Reiniciar: sudo supervisorctl restart tic-backend"
echo "• Monitor: sudo -u tic /home/tic/monitor.sh"
echo ""
warn "⚠️ Não esqueça de:"
echo "1. Configurar o arquivo .env com suas credenciais"
echo "2. Alterar a SECRET_KEY para produção"
echo "3. Configurar SSL se necessário"
echo "4. Atualizar FRONTEND_URL no .env"
echo ""
info "Para editar o .env: ssh $USER@$DROPLET_IP 'sudo -u tic nano $APP_DIR/.env'"