# 🚀 Guia Rápido de Deploy - DigitalOcean

Este guia mostra como fazer o deploy do backend TIC no DigitalOcean de forma rápida e automatizada.

## 📋 Pré-requisitos

### 1. Droplet DigitalOcean
- Ubuntu 20.04 ou 22.04 LTS
- Mínimo 1GB RAM (recomendado 2GB+)
- Acesso SSH configurado

### 2. Configuração SSH
```bash
# Gerar chave SSH (se não tiver)
ssh-keygen -t rsa -b 4096 -C "seu-email@exemplo.com"

# Copiar chave pública para o droplet
ssh-copy-id root@SEU_IP_DROPLET
```

### 3. Ferramentas Locais
**Windows:**
- PowerShell 5.0+
- OpenSSH Client (incluído no Windows 10+)

**Linux/Mac:**
- Bash
- SSH/SCP
- rsync

## 🛠️ Setup Inicial do Servidor

### Opção 1: Script Automatizado (Recomendado)
```bash
# Copiar script para o servidor
scp scripts/setup_digitalocean.sh root@SEU_IP:/tmp/

# Executar no servidor
ssh root@SEU_IP
chmod +x /tmp/setup_digitalocean.sh
/tmp/setup_digitalocean.sh
```

### Opção 2: Setup Manual
Siga o guia completo em `DIGITALOCEAN_DEPLOY.md`

## 📤 Upload da Aplicação

### Windows (PowerShell)
```powershell
# Navegar para o diretório backend-api
cd c:\ia\trae\clp\backend-api

# Executar script de upload
.\scripts\upload_to_digitalocean.ps1 -DropletIP SEU_IP_DROPLET

# Com usuário específico
.\scripts\upload_to_digitalocean.ps1 -DropletIP SEU_IP_DROPLET -User root
```

### Linux/Mac (Bash)
```bash
# Navegar para o diretório backend-api
cd /caminho/para/backend-api

# Tornar executável
chmod +x scripts/upload_to_digitalocean.sh

# Executar script de upload
./scripts/upload_to_digitalocean.sh SEU_IP_DROPLET

# Com usuário específico
./scripts/upload_to_digitalocean.sh SEU_IP_DROPLET root
```

## ⚙️ Configuração Pós-Deploy

### 1. Configurar Variáveis de Ambiente
```bash
# Conectar ao servidor
ssh root@SEU_IP_DROPLET

# Editar arquivo .env
sudo -u tic nano /home/tic/app/.env
```

### 2. Configurações Essenciais no .env
```env
# Banco de dados
DATABASE_URL=mysql://tic_user:SUA_SENHA@localhost:3306/tic_production
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=tic_user
MYSQL_PASSWORD=SUA_SENHA_SEGURA
MYSQL_DATABASE=tic_production

# Segurança
SECRET_KEY=sua_chave_secreta_muito_segura_aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# API
PORT=8000
ENVIRONMENT=production
FRONTEND_URL=https://seu-frontend.vercel.app
```

### 3. Reiniciar Aplicação
```bash
# Reiniciar serviço
sudo supervisorctl restart tic-backend

# Verificar status
sudo supervisorctl status tic-backend

# Ver logs
sudo tail -f /var/log/tic-backend.log
```

## 🔍 Verificação e Testes

### 1. Health Check
```bash
curl http://SEU_IP_DROPLET/health
```

### 2. Documentação da API
Acesse: `http://SEU_IP_DROPLET/docs`

### 3. Endpoints Principais
```bash
# Colaboradores
curl http://SEU_IP_DROPLET/api/colaboradores

# Pontos Eletrônicos
curl http://SEU_IP_DROPLET/api/pontos-eletronicos

# Contracheques
curl http://SEU_IP_DROPLET/api/contracheques
```

## 🔄 Atualizações Futuras

### Deploy Rápido
```bash
# Windows
.\scripts\upload_to_digitalocean.ps1 -DropletIP SEU_IP_DROPLET

# Linux/Mac
./scripts/upload_to_digitalocean.sh SEU_IP_DROPLET
```

### Deploy Manual
```bash
# No servidor
cd /home/tic/app
git pull origin main
sudo -u tic /home/tic/app/venv/bin/pip install -r requirements.txt
sudo supervisorctl restart tic-backend
```

## 🛡️ SSL/HTTPS (Opcional)

### Configurar Certbot
```bash
# Instalar certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d seu-dominio.com

# Renovação automática
sudo crontab -e
# Adicionar: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Monitoramento

### Comandos Úteis
```bash
# Status dos serviços
sudo supervisorctl status

# Logs da aplicação
sudo tail -f /var/log/tic-backend.log

# Logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Uso de recursos
sudo -u tic /home/tic/monitor.sh

# Backup do banco
sudo -u tic /home/tic/backup.sh
```

### Logs de Deploy
Os scripts salvam logs detalhados durante o processo de upload.

## 🆘 Troubleshooting

### Problemas Comuns

**1. Erro de conexão SSH**
```bash
# Verificar chaves SSH
ssh-add -l

# Testar conexão
ssh -v root@SEU_IP_DROPLET
```

**2. Aplicação não inicia**
```bash
# Verificar logs
sudo tail -50 /var/log/tic-backend.log

# Verificar configuração
sudo supervisorctl status tic-backend

# Reiniciar manualmente
sudo supervisorctl restart tic-backend
```

**3. Erro de banco de dados**
```bash
# Verificar MySQL
sudo systemctl status mysql

# Testar conexão
mysql -u tic_user -p tic_production

# Verificar .env
sudo -u tic cat /home/tic/app/.env
```

**4. Erro de permissões**
```bash
# Corrigir permissões
sudo chown -R tic:tic /home/tic/app
sudo chmod +x /home/tic/app/venv/bin/python
```

## 📞 Suporte

Para problemas específicos:
1. Verifique os logs: `/var/log/tic-backend.log`
2. Consulte a documentação completa: `DIGITALOCEAN_DEPLOY.md`
3. Verifique a configuração MySQL: `MYSQL_SETUP.md`

## 🎯 Próximos Passos

1. **Configurar domínio personalizado**
2. **Implementar SSL/HTTPS**
3. **Configurar backup automático**
4. **Monitoramento avançado**
5. **CI/CD com GitHub Actions**

---

**✅ Checklist de Deploy:**
- [ ] Droplet criado e configurado
- [ ] SSH configurado
- [ ] Script de setup executado
- [ ] Aplicação enviada
- [ ] .env configurado
- [ ] MySQL configurado
- [ ] API testada
- [ ] SSL configurado (opcional)
- [ ] Backup configurado
- [ ] Monitoramento ativo