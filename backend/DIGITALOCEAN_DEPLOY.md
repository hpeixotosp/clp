# Deploy do Backend TIC para DigitalOcean

## 📋 Pré-requisitos

- Conta no DigitalOcean
- Chave SSH configurada
- Domínio (opcional, mas recomendado)
- Backend funcionando localmente

## 🚀 Passo 1: Criar Droplet

### 1.1 Configuração do Droplet

1. **Acesse o DigitalOcean Dashboard**
2. **Clique em "Create" > "Droplets"**
3. **Configurações recomendadas:**
   - **Imagem:** Ubuntu 22.04 LTS
   - **Plano:** Basic ($6/mês - 1GB RAM, 1 vCPU, 25GB SSD)
   - **Região:** Escolha mais próxima (ex: São Paulo)
   - **Autenticação:** SSH Key (recomendado)
   - **Hostname:** `tic-backend-api`

### 1.2 Conectar ao Droplet

```bash
ssh root@your-droplet-ip
```

## 🔧 Passo 2: Configurar Servidor

### 2.1 Atualizar Sistema

```bash
apt update && apt upgrade -y
```

### 2.2 Instalar Dependências

```bash
# Python e pip
apt install python3 python3-pip python3-venv -y

# MySQL Server
apt install mysql-server -y

# Nginx (proxy reverso)
apt install nginx -y

# Supervisor (gerenciar processos)
apt install supervisor -y

# Git
apt install git -y

# Dependências para mysqlclient
apt install pkg-config libmysqlclient-dev -y
```

### 2.3 Configurar MySQL

```bash
# Configurar MySQL
mysql_secure_installation

# Conectar ao MySQL
mysql -u root -p
```

**No MySQL:**
```sql
-- Criar banco de dados
CREATE DATABASE tic_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Criar usuário
CREATE USER 'tic_user'@'localhost' IDENTIFIED BY 'sua_senha_segura_aqui';

-- Dar permissões
GRANT ALL PRIVILEGES ON tic_production.* TO 'tic_user'@'localhost';
FLUSH PRIVILEGES;

-- Verificar
SHOW DATABASES;
SELECT User, Host FROM mysql.user WHERE User = 'tic_user';

EXIT;
```

## 📁 Passo 3: Deploy da Aplicação

### 3.1 Criar Usuário para Aplicação

```bash
# Criar usuário
adduser tic
usermod -aG sudo tic

# Trocar para o usuário
su - tic
```

### 3.2 Clonar Repositório

```bash
# Clonar seu repositório
git clone https://github.com/seu-usuario/seu-repositorio.git
cd seu-repositorio/backend-api

# Ou fazer upload manual dos arquivos
# scp -r ./backend-api tic@your-droplet-ip:/home/tic/
```

### 3.3 Configurar Ambiente Python

```bash
# Criar ambiente virtual
python3 -m venv venv
source venv/bin/activate

# Instalar dependências
pip install --upgrade pip
pip install -r requirements.txt
```

### 3.4 Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar configurações
nano .env
```

**Configuração do `.env` para produção:**
```env
# Database Configuration (MySQL)
DATABASE_URL=mysql://tic_user:sua_senha_segura_aqui@localhost:3306/tic_production

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
```

### 3.5 Criar Diretórios Necessários

```bash
mkdir -p /home/tic/uploads
mkdir -p /home/tic/temp
mkdir -p /home/tic/scripts
```

### 3.6 Testar Aplicação

```bash
# Ativar ambiente virtual
source venv/bin/activate

# Testar aplicação
python -m uvicorn main:app --host 0.0.0.0 --port 8000

# Testar em outro terminal
curl http://localhost:8000/health
```

## 🔄 Passo 4: Configurar Supervisor

### 4.1 Criar Arquivo de Configuração

```bash
sudo nano /etc/supervisor/conf.d/tic-backend.conf
```

**Conteúdo do arquivo:**
```ini
[program:tic-backend]
command=/home/tic/seu-repositorio/backend-api/venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000
directory=/home/tic/seu-repositorio/backend-api
user=tic
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/tic-backend.log
stdout_logfile_maxbytes=50MB
stdout_logfile_backups=10
environment=PATH="/home/tic/seu-repositorio/backend-api/venv/bin"
```

### 4.2 Ativar Supervisor

```bash
# Recarregar configuração
sudo supervisorctl reread
sudo supervisorctl update

# Iniciar aplicação
sudo supervisorctl start tic-backend

# Verificar status
sudo supervisorctl status

# Ver logs
sudo tail -f /var/log/tic-backend.log
```

## 🌐 Passo 5: Configurar Nginx

### 5.1 Criar Configuração do Site

```bash
sudo nano /etc/nginx/sites-available/tic-backend
```

**Conteúdo do arquivo:**
```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;
    # Para IP: server_name your-droplet-ip;

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
```

### 5.2 Ativar Site

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/tic-backend /etc/nginx/sites-enabled/

# Remover site padrão
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## 🔒 Passo 6: Configurar SSL (Opcional)

### 6.1 Instalar Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 6.2 Obter Certificado SSL

```bash
# Para domínio
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Renovação automática
sudo crontab -e
# Adicionar linha:
0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔥 Passo 7: Configurar Firewall

```bash
# Configurar UFW
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Verificar status
sudo ufw status
```

## 📊 Passo 8: Monitoramento

### 8.1 Comandos Úteis

```bash
# Status da aplicação
sudo supervisorctl status tic-backend

# Logs da aplicação
sudo tail -f /var/log/tic-backend.log

# Logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Status do MySQL
sudo systemctl status mysql

# Uso de recursos
htop
df -h
free -h
```

### 8.2 Backup do Banco de Dados

```bash
# Criar script de backup
nano /home/tic/backup_db.sh
```

**Conteúdo do script:**
```bash
#!/bin/bash
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/home/tic/backups"
mkdir -p $BACKUP_DIR

mysqldump -u tic_user -p'sua_senha' tic_production > $BACKUP_DIR/tic_backup_$DATE.sql

# Manter apenas últimos 7 backups
find $BACKUP_DIR -name "tic_backup_*.sql" -mtime +7 -delete
```

```bash
# Tornar executável
chmod +x /home/tic/backup_db.sh

# Agendar backup diário
crontab -e
# Adicionar linha:
0 2 * * * /home/tic/backup_db.sh
```

## 🔄 Passo 9: Deploy de Atualizações

### 9.1 Script de Deploy

```bash
nano /home/tic/deploy.sh
```

**Conteúdo do script:**
```bash
#!/bin/bash
cd /home/tic/seu-repositorio

# Backup do banco antes da atualização
/home/tic/backup_db.sh

# Atualizar código
git pull origin main

# Ativar ambiente virtual
source backend-api/venv/bin/activate

# Instalar/atualizar dependências
cd backend-api
pip install -r requirements.txt

# Reiniciar aplicação
sudo supervisorctl restart tic-backend

# Verificar status
sudo supervisorctl status tic-backend

echo "Deploy concluído!"
```

```bash
# Tornar executável
chmod +x /home/tic/deploy.sh
```

## 🌍 Passo 10: Testar API

```bash
# Testar health check
curl http://seu-dominio.com/health
# ou
curl http://your-droplet-ip/health

# Testar endpoint
curl http://seu-dominio.com/api/colaboradores
```

## 📝 URLs Finais

- **API Base:** `http://seu-dominio.com` ou `http://your-droplet-ip`
- **Health Check:** `http://seu-dominio.com/health`
- **Documentação:** `http://seu-dominio.com/docs`
- **Colaboradores:** `http://seu-dominio.com/api/colaboradores`

## 🚨 Troubleshooting

### Problemas Comuns

1. **Aplicação não inicia:**
   ```bash
   sudo supervisorctl tail tic-backend
   ```

2. **Erro de conexão MySQL:**
   ```bash
   mysql -u tic_user -p tic_production
   ```

3. **Nginx não funciona:**
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   ```

4. **Permissões de arquivo:**
   ```bash
   sudo chown -R tic:tic /home/tic/
   ```

### Logs Importantes

- Aplicação: `/var/log/tic-backend.log`
- Nginx: `/var/log/nginx/error.log`
- MySQL: `/var/log/mysql/error.log`
- Supervisor: `/var/log/supervisor/supervisord.log`

## 🎯 Próximos Passos

1. **Configurar monitoramento** (ex: Uptime Robot)
2. **Implementar CI/CD** com GitHub Actions
3. **Configurar backup automático** para DigitalOcean Spaces
4. **Otimizar performance** do MySQL
5. **Implementar rate limiting** no Nginx

Seu backend estará rodando em produção no DigitalOcean! 🚀