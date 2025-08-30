# 🔑 Configuração SSH para DigitalOcean

Antes de fazer o deploy, você precisa configurar o acesso SSH ao seu droplet.

## 📋 Pré-requisitos

1. **Droplet DigitalOcean criado** com Ubuntu 20.04/22.04
2. **IP do droplet**: `143.110.196.243`
3. **OpenSSH Client** instalado no Windows

## 🔧 Configuração SSH

### Opção 1: Usar Chaves SSH (Recomendado)

#### 1. Gerar Chave SSH (se não tiver)
```powershell
# Abrir PowerShell como Administrador
ssh-keygen -t rsa -b 4096 -C "seu-email@exemplo.com"

# Pressionar Enter para aceitar o local padrão
# Definir uma senha (opcional, mas recomendado)
```

#### 2. Copiar Chave Pública para o Droplet
```powershell
# Método 1: Usando ssh-copy-id (se disponível)
ssh-copy-id root@143.110.196.243

# Método 2: Copiar manualmente
type $env:USERPROFILE\.ssh\id_rsa.pub | ssh root@143.110.196.243 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

#### 3. Testar Conexão
```powershell
ssh root@143.110.196.243
```

### Opção 2: Configurar via Console DigitalOcean

1. **Acesse o Console** do droplet no painel DigitalOcean
2. **Faça login** como root
3. **Execute os comandos** de configuração:

```bash
# Criar diretório SSH
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Criar arquivo authorized_keys
touch ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Editar arquivo para adicionar sua chave pública
nano ~/.ssh/authorized_keys
```

4. **Cole sua chave pública** (conteúdo do arquivo `id_rsa.pub`)
5. **Salve e saia** (Ctrl+X, Y, Enter)

### Opção 3: Usar Senha (Temporário)

Se você configurou uma senha para o usuário root:

```powershell
# Conectar com senha
ssh root@143.110.196.243
# Digite a senha quando solicitado
```

## 🛠️ Setup Inicial do Servidor

Após conseguir conectar via SSH, execute o setup:

```bash
# Baixar script de setup
wget https://raw.githubusercontent.com/seu-repo/setup_digitalocean.sh -O /tmp/setup.sh

# OU copiar manualmente o conteúdo do arquivo setup_digitalocean.sh
nano /tmp/setup.sh
# Cole o conteúdo do script

# Tornar executável e executar
chmod +x /tmp/setup.sh
/tmp/setup.sh
```

## 📤 Upload Manual (Alternativa)

Se o script automatizado não funcionar, você pode fazer upload manual:

### 1. Conectar ao Servidor
```powershell
ssh root@143.110.196.243
```

### 2. Preparar Ambiente
```bash
# Criar usuário tic
useradd -m -s /bin/bash tic

# Criar diretório da aplicação
sudo -u tic mkdir -p /home/tic/app

# Instalar dependências básicas
apt update
apt install -y python3 python3-pip python3-venv git nginx supervisor mysql-server
```

### 3. Upload dos Arquivos
```powershell
# No seu computador local (PowerShell)
cd c:\ia\trae\clp\backend-api

# Criar arquivo ZIP
Compress-Archive -Path .\* -DestinationPath backend.zip -Force

# Enviar arquivo
scp backend.zip root@143.110.196.243:/tmp/
```

### 4. Extrair no Servidor
```bash
# No servidor
cd /tmp
unzip backend.zip -d /home/tic/app/
chown -R tic:tic /home/tic/app
```

## 🔍 Verificação

### Testar Conexão SSH
```powershell
# Deve conectar sem pedir senha
ssh root@143.110.196.243 "echo 'SSH funcionando!'"
```

### Verificar Chaves
```powershell
# Listar chaves SSH
ssh-add -l

# Ver chave pública
type $env:USERPROFILE\.ssh\id_rsa.pub
```

## 🆘 Troubleshooting

### Erro: "Permission denied (publickey)"
```bash
# No servidor, verificar configuração SSH
sudo nano /etc/ssh/sshd_config

# Garantir que estas linhas estejam presentes:
PubkeyAuthentication yes
PasswordAuthentication yes  # temporário
PermitRootLogin yes

# Reiniciar SSH
sudo systemctl restart ssh
```

### Erro: "Connection refused"
```bash
# Verificar se SSH está rodando
sudo systemctl status ssh
sudo systemctl start ssh
```

### Erro: "Host key verification failed"
```powershell
# Remover host conhecido
ssh-keygen -R 143.110.196.243

# Conectar novamente
ssh root@143.110.196.243
```

## 📞 Próximos Passos

1. **Configure SSH** usando uma das opções acima
2. **Teste a conexão**: `ssh root@143.110.196.243`
3. **Execute o setup** do servidor
4. **Rode o script de upload** novamente

```powershell
# Após configurar SSH
.\scripts\upload_to_digitalocean.ps1 -DropletIP 143.110.196.243
```

## 🔐 Segurança

**Após o deploy:**
1. Desabilite login por senha
2. Configure firewall
3. Use usuário não-root
4. Configure fail2ban

```bash
# Desabilitar senha após configurar chaves
sudo nano /etc/ssh/sshd_config
# PasswordAuthentication no
sudo systemctl restart ssh
```