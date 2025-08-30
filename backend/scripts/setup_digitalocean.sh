#!/bin/bash

# Script de Setup Automatizado para DigitalOcean
# Execute este script no seu droplet Ubuntu 22.04

set -e  # Parar em caso de erro

echo "🚀 Iniciando setup do TIC Backend no DigitalOcean..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Verificar se é root
if [ "$EUID" -ne 0 ]; then
    error "Execute este script como root: sudo bash setup_digitalocean.sh"
fi

log "Atualizando sistema..."
apt update && apt upgrade -y

log "Instalando dependências básicas..."
apt install -y \
    python3 \
    python3-pip \
    python3-venv \
    mysql-server \
    nginx \
    supervisor \
    git \
    pkg-config \
    libmysqlclient-dev \
    curl \
    htop \
    ufw \
    certbot \
    python3-certbot-nginx

log "Configurando MySQL..."
# Configuração automática do MySQL
mysql -e "CREATE DATABASE IF NOT EXISTS tic_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS 'tic_user'@'localhost' IDENTIFIED BY 'TIC_secure_2024!';"
mysql -e "GRANT ALL PRIVILEGES ON tic_production.* TO 'tic_user'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

log "Criando usuário tic..."
if ! id "tic" &>/dev/null; then
    adduser --disabled-password --gecos "" tic
    usermod -aG sudo tic
fi

log "Configurando diretórios..."
sudo -u tic mkdir -p /home/tic/uploads
sudo -u tic mkdir -p /home/tic/temp
sudo -u tic mkdir -p /home/tic/scripts
sudo -u tic mkdir -p /home/tic/backups
sudo -u tic mkdir -p /home/tic/app

log "Configurando Nginx..."
cat > /etc/nginx/sites-available/tic-backend << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization";
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Content-Type, Authorization";
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
    }

    # Upload de arquivos
    client_max_body_size 10M;
}
EOF

# Ativar site
ln -sf /etc/nginx/sites-available/tic-backend /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Testar e reiniciar Nginx
nginx -t && systemctl restart nginx
systemctl enable nginx

log "Configurando Supervisor..."
cat > /etc/supervisor/conf.d/tic-backend.conf << 'EOF'
[program:tic-backend]
command=/home/tic/app/venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000
directory=/home/tic/app
user=tic
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/tic-backend.log
stdout_logfile_maxbytes=50MB
stdout_logfile_backups=10
environment=PATH="/home/tic/app/venv/bin"
EOF

log "Configurando Firewall..."
ufw --force enable
ufw allow OpenSSH
ufw allow 'Nginx Full'

log "Criando script de backup..."
cat > /home/tic/backup_db.sh << 'EOF'
#!/bin/bash
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/home/tic/backups"
mkdir -p $BACKUP_DIR

mysqldump -u tic_user -p'TIC_secure_2024!' tic_production > $BACKUP_DIR/tic_backup_$DATE.sql

# Manter apenas últimos 7 backups
find $BACKUP_DIR -name "tic_backup_*.sql" -mtime +7 -delete

echo "Backup criado: tic_backup_$DATE.sql"
EOF

chmod +x /home/tic/backup_db.sh
chown tic:tic /home/tic/backup_db.sh

log "Criando script de deploy..."
cat > /home/tic/deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Iniciando deploy..."

# Backup antes da atualização
/home/tic/backup_db.sh

cd /home/tic/app

# Atualizar código (se usando git)
if [ -d ".git" ]; then
    git pull origin main
fi

# Ativar ambiente virtual
source venv/bin/activate

# Instalar/atualizar dependências
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
fi

# Reiniciar aplicação
sudo supervisorctl restart tic-backend

# Verificar status
sudo supervisorctl status tic-backend

echo "✅ Deploy concluído!"
EOF

chmod +x /home/tic/deploy.sh
chown tic:tic /home/tic/deploy.sh

log "Criando arquivo .env template..."
cat > /home/tic/app/.env.template << 'EOF'
# Database Configuration (MySQL)
DATABASE_URL=mysql://tic_user:TIC_secure_2024!@localhost:3306/tic_production

# API Configuration
PORT=8000
ENVIRONMENT=production
FRONTEND_URL=https://seu-frontend.vercel.app

# Security
SECRET_KEY=sua-chave-secreta-super-segura-aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# File Upload
UPLOAD_DIR=/home/tic/uploads
MAX_FILE_SIZE=10485760
ALLOWED_EXTENSIONS=pdf,jpg,jpeg,png

# Python Scripts
SCRIPTS_DIR=/home/tic/scripts
TEMP_DIR=/home/tic/temp
EOF

chown tic:tic /home/tic/app/.env.template

log "Configurando cron jobs..."
# Backup diário às 2h
(crontab -u tic -l 2>/dev/null; echo "0 2 * * * /home/tic/backup_db.sh") | crontab -u tic -

log "Criando script de monitoramento..."
cat > /home/tic/monitor.sh << 'EOF'
#!/bin/bash

echo "=== Status do Sistema TIC ==="
echo "Data: $(date)"
echo ""

echo "🔧 Supervisor Status:"
sudo supervisorctl status tic-backend
echo ""

echo "🌐 Nginx Status:"
sudo systemctl status nginx --no-pager -l
echo ""

echo "🗄️ MySQL Status:"
sudo systemctl status mysql --no-pager -l
echo ""

echo "💾 Uso de Disco:"
df -h
echo ""

echo "🧠 Uso de Memória:"
free -h
echo ""

echo "📊 Últimas 10 linhas do log da aplicação:"
sudo tail -10 /var/log/tic-backend.log
echo ""

echo "🌍 Teste da API:"
curl -s http://localhost:8000/health || echo "❌ API não está respondendo"
EOF

chmod +x /home/tic/monitor.sh
chown tic:tic /home/tic/monitor.sh

log "Setup básico concluído! 🎉"
echo ""
echo "📋 Próximos passos:"
echo "1. Faça upload dos arquivos da aplicação para /home/tic/app/"
echo "2. Configure o arquivo .env baseado no template em /home/tic/app/.env.template"
echo "3. Crie o ambiente virtual: sudo -u tic python3 -m venv /home/tic/app/venv"
echo "4. Instale as dependências: sudo -u tic /home/tic/app/venv/bin/pip install -r /home/tic/app/requirements.txt"
echo "5. Inicie a aplicação: sudo supervisorctl start tic-backend"
echo ""
echo "🔧 Scripts úteis criados:"
echo "- /home/tic/deploy.sh - Deploy de atualizações"
echo "- /home/tic/backup_db.sh - Backup do banco de dados"
echo "- /home/tic/monitor.sh - Monitoramento do sistema"
echo ""
echo "📊 Para monitorar: sudo -u tic /home/tic/monitor.sh"
echo "🔄 Para fazer deploy: sudo -u tic /home/tic/deploy.sh"
echo ""
echo "🌍 Sua API estará disponível em: http://$(curl -s ifconfig.me)/"
echo "📚 Documentação: http://$(curl -s ifconfig.me)/docs"
echo ""
warn "IMPORTANTE: Altere a senha do MySQL e a SECRET_KEY antes de usar em produção!"