# Migração para Arquitetura Distribuída - CLP Manager

## Visão Geral

Este documento descreve a migração do sistema CLP Manager de uma arquitetura monolítica para uma arquitetura distribuída com:

- **Frontend**: Next.js hospedado na Vercel (apenas interface e experiência do usuário)
- **Backend**: API Python independente hospedada na DigitalOcean (lógica de negócios)
- **Banco de Dados**: MySQL na DigitalOcean (substituindo SQLite)

## Arquitetura Atual vs. Nova Arquitetura

### Arquitetura Atual (Monolítica)
```
┌─────────────────────────────────────────────────────────┐
│                    Vercel (Frontend + Backend)         │
│  ┌─────────────────┐  ┌─────────────────┐             │
│  │   Next.js App  │  │  Python Scripts │             │
│  │   (Interface)  │  │  (Processamento)│             │
│  └─────────────────┘  └─────────────────┘             │
│  ┌─────────────────┐  ┌─────────────────┐             │
│  │   API Routes   │  │   SQLite DB     │             │
│  │   (Next.js)    │  │   (Local)       │             │
│  └─────────────────┘  └─────────────────┘             │
└─────────────────────────────────────────────────────────┘
```

### Nova Arquitetura (Distribuída)
```
┌─────────────────────────────────────────────────────────┐
│                    Vercel (Frontend)                   │
│  ┌─────────────────┐  ┌─────────────────┐             │
│  │   Next.js App  │  │   API Routes    │             │
│  │   (Interface)  │  │   (Proxy)       │             │
│  └─────────────────┘  └─────────────────┘             │
└─────────────────────────────────────────────────────────┘
                              │
                              │ HTTP Requests
                              ▼
┌─────────────────────────────────────────────────────────┐
│                DigitalOcean (Backend)                  │
│  ┌─────────────────┐  ┌─────────────────┐             │
│  │   FastAPI      │  │   MySQL         │             │
│  │   (Python)     │  │   Database      │             │
│  └─────────────────┘  └─────────────────┘             │
│  ┌─────────────────┐  ┌─────────────────┐             │
│  │   Nginx        │  │   Systemd       │             │
│  │   (Proxy)      │  │   (Service)     │             │
│  └─────────────────┘  └─────────────────┘             │
└─────────────────────────────────────────────────────────┘
```

## Estrutura de Arquivos

### Backend Python (DigitalOcean)
```
backend-api/
├── main.py                    # API principal FastAPI
├── database.py               # Gerenciador de banco MySQL
├── requirements.txt          # Dependências Python
├── env.example              # Variáveis de ambiente
├── nginx.conf               # Configuração Nginx
├── clp-api.service          # Serviço systemd
├── deploy_digitalocean.sh   # Script de deploy
└── migrate_sqlite_to_mysql.py # Script de migração
```

### Frontend Next.js (Vercel)
```
src/
├── lib/
│   └── api-client.ts        # Cliente para consumir backend
├── app/
│   └── api/                 # Rotas de API (agora como proxy)
└── env.local.example        # Variáveis de ambiente
```

## Passos de Implementação

### 1. Configuração do Backend na DigitalOcean

#### 1.1 Preparar o Droplet
```bash
# Conectar ao Droplet
ssh root@143.110.196.243

# Criar usuário não-root
adduser clp_user
usermod -aG sudo clp_user

# Mudar para o usuário
su - clp_user
```

#### 1.2 Executar Script de Deploy
```bash
# Fazer upload dos arquivos do backend
scp -r backend-api/* clp_user@143.110.196.243:/tmp/

# No Droplet, executar o deploy
cd /tmp
chmod +x deploy_digitalocean.sh
./deploy_digitalocean.sh
```

#### 1.3 Configurar Variáveis de Ambiente
```bash
# Editar arquivo .env
nano /opt/clp-manager/backend-api/.env

# Ajustar senhas e configurações
DB_PASSWORD=sua_senha_muito_segura
SECRET_KEY=sua_chave_secreta
```

#### 1.4 Iniciar Serviços
```bash
# Verificar status
sudo systemctl status clp-api
sudo systemctl status nginx

# Reiniciar se necessário
sudo systemctl restart clp-api
sudo systemctl restart nginx
```

### 2. Migração do Banco de Dados

#### 2.1 Executar Script de Migração
```bash
# No Droplet, executar migração
cd /opt/clp-manager/backend-api
python3 migrate_sqlite_to_mysql.py
```

#### 2.2 Verificar Migração
```bash
# Conectar ao MySQL
mysql -u clp_user -p clp_manager

# Verificar tabelas
SHOW TABLES;
SELECT COUNT(*) FROM contracheques;
SELECT COUNT(*) FROM pontos_eletronicos;
```

### 3. Configuração do Frontend

#### 3.1 Configurar Variáveis de Ambiente
```bash
# Copiar arquivo de exemplo
cp env.local.example .env.local

# Editar variáveis
nano .env.local

# Configurar URL do backend
NEXT_PUBLIC_API_URL=http://143.110.196.243:8000
```

#### 3.2 Testar Conexão com Backend
```bash
# Verificar se a API está respondendo
curl http://143.110.196.243:8000/health
curl http://143.110.196.243:8000/
```

### 4. Deploy do Frontend na Vercel

#### 4.1 Configurar Variáveis de Ambiente na Vercel
```bash
# No dashboard da Vercel, adicionar:
NEXT_PUBLIC_API_URL=https://143.110.196.243
NEXT_PUBLIC_API_BASE_URL=https://143.110.196.243
```

#### 4.2 Fazer Deploy
```bash
# Commit e push das mudanças
git add .
git commit -m "Migração para arquitetura distribuída"
git push origin main

# A Vercel fará deploy automático
```

## Configurações de Segurança

### Firewall (DigitalOcean)
```bash
# Portas abertas
22   - SSH
80   - HTTP
443  - HTTPS
8000 - API Python (interno, não exposto)
```

### SSL/TLS
```bash
# Certificados auto-assinados para desenvolvimento
# Para produção, usar Let's Encrypt ou certificados comerciais
sudo certbot --nginx -d seu-dominio.com
```

### Banco de Dados
```bash
# Usuário com privilégios limitados
# Senha forte
# Acesso apenas local
# Backup automático diário
```

## Monitoramento e Manutenção

### Logs
```bash
# Logs da API
tail -f /opt/clp-manager/logs/api.log

# Logs do Nginx
sudo tail -f /var/log/nginx/clp_api_access.log
sudo tail -f /var/log/nginx/clp_api_error.log

# Logs do sistema
sudo journalctl -u clp-api -f
```

### Backup
```bash
# Backup automático diário às 2h da manhã
# Script: /opt/clp-manager/backup_db.sh
# Retenção: 7 dias
```

### Monitoramento
```bash
# Script de monitoramento
/opt/clp-manager/monitor.sh

# Verificar recursos
htop
df -h
free -h
```

## Testes e Validação

### 1. Teste de Conectividade
```bash
# Frontend → Backend
curl -X POST http://143.110.196.243:8000/api/process-contracheques \
  -F "files=@teste.pdf"
```

### 2. Teste de Performance
```bash
# Teste de carga básico
ab -n 100 -c 10 http://143.110.196.243:8000/health
```

### 3. Teste de Funcionalidade
- Upload de contracheques
- Processamento de documentos
- Análise de propostas
- Análise de TRs

## Troubleshooting

### Problemas Comuns

#### 1. API não responde
```bash
# Verificar status do serviço
sudo systemctl status clp-api

# Verificar logs
sudo journalctl -u clp-api -n 50

# Verificar porta
sudo netstat -tlnp | grep 8000
```

#### 2. Erro de CORS
```bash
# Verificar configuração CORS no backend
# Verificar origem das requisições
# Verificar configuração do Nginx
```

#### 3. Erro de Banco de Dados
```bash
# Verificar conexão MySQL
mysql -u clp_user -p -h localhost

# Verificar variáveis de ambiente
cat /opt/clp-manager/backend-api/.env
```

#### 4. Erro de Upload
```bash
# Verificar permissões de diretório
ls -la /opt/clp-manager/uploads/

# Verificar limite de tamanho no Nginx
# Verificar limite no Python
```

## Rollback

### Se necessário reverter a migração

#### 1. Parar Serviços
```bash
sudo systemctl stop clp-api
sudo systemctl stop nginx
```

#### 2. Restaurar Configuração Anterior
```bash
# Restaurar arquivos do frontend
git checkout HEAD~1

# Restaurar configuração do banco (se necessário)
```

#### 3. Reiniciar Serviços Antigos
```bash
# Reiniciar aplicação Next.js
npm run dev
```

## Próximos Passos

### Melhorias Futuras

1. **Domínio Personalizado**
   - Configurar DNS para apontar para DigitalOcean
   - Certificados SSL reais

2. **Load Balancer**
   - Múltiplos Droplets para alta disponibilidade
   - Load balancer da DigitalOcean

3. **Monitoramento Avançado**
   - Prometheus + Grafana
   - Alertas automáticos

4. **CI/CD**
   - GitHub Actions para deploy automático
   - Testes automatizados

5. **Cache**
   - Redis para cache de dados
   - CDN para arquivos estáticos

## Suporte e Contato

Para dúvidas ou problemas durante a migração:

1. Verificar logs detalhados
2. Consultar documentação da FastAPI
3. Verificar status dos serviços
4. Revisar configurações de rede

## Conclusão

Esta migração transforma o sistema de uma arquitetura monolítica para uma arquitetura distribuída robusta, separando responsabilidades e melhorando a escalabilidade. O frontend fica focado na experiência do usuário, enquanto o backend gerencia toda a lógica de negócios e persistência de dados.

A nova arquitetura oferece:
- ✅ Melhor separação de responsabilidades
- ✅ Escalabilidade horizontal
- ✅ Manutenibilidade aprimorada
- ✅ Segurança reforçada
- ✅ Monitoramento e backup automáticos
- ✅ Deploy independente de cada componente
