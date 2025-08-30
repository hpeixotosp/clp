# Configuração do MySQL para TIC Backend API

## Pré-requisitos

### 1. Instalar MySQL Server

**Windows:**
- Baixe o MySQL Installer: https://dev.mysql.com/downloads/installer/
- Execute o instalador e escolha "Server only" ou "Developer Default"
- Configure a senha do usuário root durante a instalação

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

**macOS:**
```bash
brew install mysql
brew services start mysql
```

### 2. Configurar Banco de Dados

1. **Conectar ao MySQL:**
```bash
mysql -u root -p
```

2. **Criar banco de dados:**
```sql
CREATE DATABASE tic_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. **Criar usuário específico (recomendado):**
```sql
CREATE USER 'tic_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON tic_database.* TO 'tic_user'@'localhost';
FLUSH PRIVILEGES;
```

4. **Verificar criação:**
```sql
SHOW DATABASES;
SELECT User, Host FROM mysql.user WHERE User = 'tic_user';
```

## Configuração do Backend

### 1. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
# Database Configuration (MySQL)
DATABASE_URL=mysql://tic_user:your_secure_password@localhost:3306/tic_database

# Ou configure individualmente:
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=tic_user
MYSQL_PASSWORD=your_secure_password
MYSQL_DATABASE=tic_database
```

### 2. Instalar Dependências Python

```bash
pip install mysqlclient SQLAlchemy
```

### 3. Inicializar Banco de Dados

O backend criará automaticamente as tabelas na primeira execução:
```bash
python -m uvicorn main:app --reload
```

## Troubleshooting

### Erro de Conexão
- Verifique se o MySQL está rodando: `sudo systemctl status mysql`
- Teste a conexão: `mysql -u tic_user -p tic_database`
- Verifique as credenciais no arquivo `.env`

### Erro de Permissões
```sql
GRANT ALL PRIVILEGES ON tic_database.* TO 'tic_user'@'localhost';
FLUSH PRIVILEGES;
```

### Erro de Charset
```sql
ALTER DATABASE tic_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Migração do SQLite para MySQL

Se você já tem dados no SQLite e quer migrar:

1. **Backup dos dados SQLite:**
```bash
sqlite3 tic_database.db .dump > backup.sql
```

2. **Converter para MySQL:**
- Edite o arquivo `backup.sql` para remover comandos específicos do SQLite
- Importe no MySQL: `mysql -u tic_user -p tic_database < backup.sql`

## Configuração para Produção

### DigitalOcean Droplet

1. **Instalar MySQL no servidor:**
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

2. **Configurar firewall:**
```bash
sudo ufw allow 3306/tcp  # Apenas se necessário acesso externo
```

3. **Configurar variáveis de ambiente:**
```env
DATABASE_URL=mysql://tic_user:secure_password@localhost:3306/tic_production
ENVIRONMENT=production
```

## Monitoramento

### Verificar Status
```sql
SHOW PROCESSLIST;
SHOW STATUS LIKE 'Connections';
SHOW STATUS LIKE 'Uptime';
```

### Logs
```bash
sudo tail -f /var/log/mysql/error.log
```

### Performance
```sql
SHOW STATUS LIKE 'Slow_queries';
SHOW VARIABLES LIKE 'slow_query_log';
```