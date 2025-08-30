#!/bin/bash

# Script de Deploy para DigitalOcean
# Execute este script no seu Droplet da DigitalOcean

set -e  # Parar em caso de erro

echo "🚀 Iniciando deploy do CLP Manager Backend na DigitalOcean..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log colorido
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
if [[ $EUID -eq 0 ]]; then
   log_error "Este script não deve ser executado como root"
   exit 1
fi

# Atualizar sistema
log_info "Atualizando sistema..."
sudo apt update && sudo apt upgrade -y

# Instalar dependências do sistema
log_info "Instalando dependências do sistema..."
sudo apt install -y python3 python3-pip python3-venv nginx mysql-server mysql-client

# Instalar dependências Python adicionais
log_info "Instalando dependências Python..."
sudo apt install -y python3-dev default-libmysqlclient-dev build-essential pkg-config

# Instalar Tesseract para OCR
log_info "Instalando Tesseract OCR..."
sudo apt install -y tesseract-ocr tesseract-ocr-por

# Instalar Poppler para processamento de PDFs
log_info "Instalando Poppler..."
sudo apt install -y poppler-utils

# Configurar MySQL
log_info "Configurando MySQL..."
sudo mysql_secure_installation

# Criar usuário e banco para a aplicação
log_info "Criando usuário e banco MySQL..."
sudo mysql -e "
CREATE DATABASE IF NOT EXISTS clp_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'clp_user'@'localhost' IDENTIFIED BY 'sua_senha_segura_aqui';
GRANT ALL PRIVILEGES ON clp_manager.* TO 'clp_user'@'localhost';
CREATE USER IF NOT EXISTS 'clp_user'@'%' IDENTIFIED BY 'sua_senha_segura_aqui';
GRANT ALL PRIVILEGES ON clp_manager.* TO 'clp_user'@'%';
FLUSH PRIVILEGES;
"

# Criar usuário do sistema para a aplicação
log_info "Criando usuário do sistema..."
sudo useradd -m -s /bin/bash clp_user || log_warn "Usuário clp_user já existe"
sudo usermod -aG sudo clp_user

# Criar diretórios da aplicação
log_info "Criando diretórios da aplicação..."
sudo mkdir -p /opt/clp-manager
sudo mkdir -p /opt/clp-manager/backend-api
sudo mkdir -p /opt/clp-manager/logs
sudo mkdir -p /opt/clp-manager/uploads
sudo mkdir -p /opt/clp-manager/temp

# Definir permissões
sudo chown -R clp_user:clp_user /opt/clp-manager
sudo chmod -R 755 /opt/clp-manager

# Criar ambiente virtual Python
log_info "Criando ambiente virtual Python..."
cd /opt/clp-manager
python3 -m venv venv
source venv/bin/activate

# Instalar dependências Python
log_info "Instalando dependências Python..."
pip install --upgrade pip
pip install -r backend-api/requirements.txt

# Configurar Nginx
log_info "Configurando Nginx..."
sudo cp backend-api/nginx.conf /etc/nginx/sites-available/clp-manager
sudo ln -sf /etc/nginx/sites-available/clp-manager /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Testar configuração do Nginx
sudo nginx -t

# Configurar serviço systemd
log_info "Configurando serviço systemd..."
sudo cp backend-api/clp-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable clp-api

# Configurar firewall
log_info "Configurando firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Criar certificados SSL auto-assinados (para desenvolvimento)
log_info "Criando certificados SSL..."
sudo mkdir -p /etc/ssl/private /etc/ssl/certs
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/clp_manager.key \
    -out /etc/ssl/certs/clp_manager.crt \
    -subj "/C=BR/ST=State/L=City/O=Organization/CN=143.110.196.243"

# Definir permissões dos certificados
sudo chmod 600 /etc/ssl/private/clp_manager.key
sudo chmod 644 /etc/ssl/certs/clp_manager.crt

# Criar arquivo de configuração de ambiente
log_info "Criando arquivo de configuração..."
sudo -u clp_user tee /opt/clp-manager/backend-api/.env > /dev/null <<EOF
# Configurações do Banco de Dados MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=clp_manager
DB_USER=clp_user
DB_PASSWORD=sua_senha_segura_aqui

# Configurações da API
API_HOST=0.0.0.0
API_PORT=8000
API_DEBUG=false

# Configurações de Segurança
SECRET_KEY=$(openssl rand -hex 32)
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Configurações de CORS
ALLOWED_ORIGINS=https://trt21-clp-manager.vercel.app,http://localhost:3000

# Configurações de Log
LOG_LEVEL=INFO
LOG_FILE=/opt/clp-manager/logs/api.log

# Configurações de Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/opt/clp-manager/uploads
TEMP_DIR=/opt/clp-manager/temp
EOF

# Iniciar serviços
log_info "Iniciando serviços..."
sudo systemctl start clp-api
sudo systemctl restart nginx

# Verificar status dos serviços
log_info "Verificando status dos serviços..."
sudo systemctl status clp-api --no-pager
sudo systemctl status nginx --no-pager

# Configurar logrotate
log_info "Configurando logrotate..."
sudo tee /etc/logrotate.d/clp-manager > /dev/null <<EOF
/opt/clp-manager/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 clp_user clp_user
    postrotate
        systemctl reload clp-api
    endscript
}
EOF

# Configurar backup automático do banco
log_info "Configurando backup automático..."
sudo mkdir -p /opt/clp-manager/backups
sudo tee /opt/clp-manager/backup_db.sh > /dev/null <<'EOF'
#!/bin/bash
BACKUP_DIR="/opt/clp-manager/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/clp_manager_$DATE.sql"

mysqldump -u clp_user -p'sua_senha_segura_aqui' clp_manager > "$BACKUP_FILE"
gzip "$BACKUP_FILE"

# Manter apenas os últimos 7 backups
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete
EOF

sudo chmod +x /opt/clp-manager/backup_db.sh
sudo chown clp_user:clp_user /opt/clp-manager/backup_db.sh

# Adicionar ao crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/clp-manager/backup_db.sh") | crontab -

# Configurar monitoramento básico
log_info "Configurando monitoramento..."
sudo apt install -y htop iotop

# Criar script de monitoramento
sudo tee /opt/clp-manager/monitor.sh > /dev/null <<'EOF'
#!/bin/bash
echo "=== Status dos Serviços ==="
systemctl status clp-api --no-pager
echo ""
echo "=== Uso de Disco ==="
df -h
echo ""
echo "=== Uso de Memória ==="
free -h
echo ""
echo "=== Processos Python ==="
ps aux | grep python
EOF

sudo chmod +x /opt/clp-manager/monitor.sh

log_info "✅ Deploy concluído com sucesso!"
log_info "📋 Próximos passos:"
log_info "1. Ajuste as senhas nos arquivos de configuração"
log_info "2. Execute a migração do SQLite para MySQL"
log_info "3. Teste a API em: http://143.110.196.243:8000"
log_info "4. Configure o domínio e certificados SSL reais"
log_info "5. Ajuste as configurações de CORS no frontend"

echo ""
log_info "🔗 URLs importantes:"
echo "  - API: http://143.110.196.243:8000"
echo "  - Docs: http://143.110.196.243:8000/docs"
echo "  - Health: http://143.110.196.243:8000/health"
echo "  - Nginx: http://143.110.196.243"
echo ""
log_info "📁 Diretórios criados:"
echo "  - Aplicação: /opt/clp-manager/backend-api"
echo "  - Logs: /opt/clp-manager/logs"
echo "  - Uploads: /opt/clp-manager/uploads"
echo "  - Backups: /opt/clp-manager/backups"
