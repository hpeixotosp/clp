# Deploy do Frontend CLP - DigitalOcean

Este documento contém instruções completas para fazer o deploy do frontend Next.js no DigitalOcean.

## Pré-requisitos

### No servidor DigitalOcean:
- Ubuntu 20.04+ ou Debian 11+
- Node.js 18+ instalado
- Acesso SSH configurado
- Usuário com privilégios sudo

### Na máquina local:
- Git
- Node.js 18+
- SSH configurado para o servidor
- PowerShell (Windows) ou Bash (Linux/Mac)

## Estrutura dos Arquivos de Deploy

```
frontend/
├── deploy.sh              # Script de deploy para Linux/Mac
├── deploy.ps1             # Script de deploy para Windows
├── frontend.service       # Arquivo de serviço systemd
├── nginx-full.conf        # Configuração completa do Nginx
├── setup-nginx.sh         # Script de configuração do Nginx
└── DEPLOY.md             # Este arquivo
```

## Configuração Inicial do Servidor

### 1. Configurar Nginx

No servidor DigitalOcean, execute:

```bash
# Fazer upload dos arquivos de configuração
scp nginx-full.conf setup-nginx.sh root@143.110.196.243:/tmp/

# Conectar ao servidor
ssh root@143.110.196.243

# Executar configuração do Nginx
cd /tmp
chmod +x setup-nginx.sh
./setup-nginx.sh
```

### 2. Configurar Variáveis de Ambiente

Crie o arquivo `/var/www/frontend/.env.production`:

```bash
# No servidor
sudo nano /var/www/frontend/.env.production
```

Conteúdo do arquivo:
```env
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_API_URL=http://143.110.196.243/api
NEXT_PUBLIC_BACKEND_URL=http://143.110.196.243/api
NEXT_PUBLIC_ENVIRONMENT=production
```

## Deploy do Frontend

### Opção 1: Windows (PowerShell)

```powershell
# Navegar para o diretório do frontend
cd c:\ia\trae\clp\frontend

# Executar deploy
.\deploy.ps1
```

### Opção 2: Linux/Mac (Bash)

```bash
# Navegar para o diretório do frontend
cd /path/to/clp/frontend

# Dar permissão de execução
chmod +x deploy.sh

# Executar deploy
./deploy.sh
```

## Verificação do Deploy

### 1. Verificar Serviços

```bash
# No servidor
sudo systemctl status frontend
sudo systemctl status nginx
```

### 2. Verificar Logs

```bash
# Logs do frontend
sudo journalctl -u frontend -f

# Logs do Nginx
sudo tail -f /var/log/nginx/clp-app.access.log
sudo tail -f /var/log/nginx/clp-app.error.log
```

### 3. Testar Aplicação

- Frontend: http://143.110.196.243
- API: http://143.110.196.243/api/docs (se backend estiver rodando)

## Estrutura de URLs

| Rota | Destino | Descrição |
|------|---------|----------|
| `/` | Next.js (porta 3000) | Frontend da aplicação |
| `/api/*` | FastAPI (porta 8000) | API do backend |
| `/_next/static/*` | Arquivos estáticos | Assets do Next.js |
| `/public/*` | Arquivos públicos | Imagens, favicon, etc. |

## Comandos Úteis

### Gerenciamento do Frontend
```bash
# Parar serviço
sudo systemctl stop frontend

# Iniciar serviço
sudo systemctl start frontend

# Reiniciar serviço
sudo systemctl restart frontend

# Ver status
sudo systemctl status frontend

# Ver logs em tempo real
sudo journalctl -u frontend -f
```

### Gerenciamento do Nginx
```bash
# Testar configuração
sudo nginx -t

# Recarregar configuração
sudo nginx -s reload

# Reiniciar Nginx
sudo systemctl restart nginx

# Ver logs de acesso
sudo tail -f /var/log/nginx/clp-app.access.log

# Ver logs de erro
sudo tail -f /var/log/nginx/clp-app.error.log
```

## Troubleshooting

### Problema: Frontend não carrega

1. Verificar se o serviço está rodando:
   ```bash
   sudo systemctl status frontend
   ```

2. Verificar logs do frontend:
   ```bash
   sudo journalctl -u frontend -n 50
   ```

3. Verificar se a porta 3000 está em uso:
   ```bash
   sudo netstat -tlnp | grep :3000
   ```

### Problema: API não funciona

1. Verificar se o backend está rodando na porta 8000:
   ```bash
   sudo netstat -tlnp | grep :8000
   ```

2. Testar API diretamente:
   ```bash
   curl http://localhost:8000/docs
   ```

3. Verificar logs do Nginx:
   ```bash
   sudo tail -f /var/log/nginx/clp-app.error.log
   ```

### Problema: Nginx não inicia

1. Testar configuração:
   ```bash
   sudo nginx -t
   ```

2. Verificar se as portas estão disponíveis:
   ```bash
   sudo netstat -tlnp | grep :80
   ```

3. Verificar logs do sistema:
   ```bash
   sudo journalctl -u nginx -n 50
   ```

## Atualizações

Para atualizar a aplicação, simplesmente execute o script de deploy novamente:

```bash
# Windows
.\deploy.ps1

# Linux/Mac
./deploy.sh
```

O script irá:
1. Fazer build da nova versão
2. Parar o serviço atual
3. Substituir os arquivos
4. Reinstalar dependências
5. Reiniciar o serviço

## Configuração de SSL (Opcional)

Para configurar HTTPS:

1. Instalar Certbot:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

2. Obter certificado:
   ```bash
   sudo certbot --nginx -d 143.110.196.243
   ```

3. O Certbot irá modificar automaticamente a configuração do Nginx.

## Backup

Recomenda-se fazer backup regular dos seguintes itens:

- `/var/www/frontend/` - Aplicação
- `/etc/nginx/sites-available/clp-app` - Configuração do Nginx
- `/etc/systemd/system/frontend.service` - Serviço systemd
- `/var/www/frontend/.env.production` - Variáveis de ambiente

## Monitoramento

Para monitorar a aplicação em produção:

1. Configurar logrotate para os logs
2. Monitorar uso de CPU e memória
3. Configurar alertas para quando os serviços ficarem offline
4. Monitorar espaço em disco

---

**Nota**: Substitua `143.110.196.243` pelo IP real do seu servidor DigitalOcean em todos os comandos e arquivos de configuração.