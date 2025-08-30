# Backend API - Sistema TRT21 CLP

API RESTful independente em Python/FastAPI para o sistema de gestão do TRT21 CLP.

## 🚀 Tecnologias

- **FastAPI** - Framework web moderno e rápido
- **SQLAlchemy** - ORM para Python
- **MySQL** - Banco de dados principal
- **Pydantic** - Validação de dados
- **Uvicorn** - Servidor ASGI
- **Alembic** - Migrações de banco de dados

## 📋 Funcionalidades

### Módulos Principais

- **Pontos Eletrônicos** - Processamento de PDFs de frequência
- **Colaboradores** - Gestão de colaboradores
- **Contracheques** - Processamento de PDFs de contracheques
- **PROADs** - Gestão de processos administrativos
- **Demandas** - Sistema de demandas internas
- **Refis** - Controle de refis de purificadores
- **Siglas** - Dicionário de siglas
- **TR** - Análise de Termos de Referência
- **Análise de Propostas** - Avaliação de propostas

## 🛠️ Instalação

### Pré-requisitos

- Python 3.8+
- MySQL 8.0+
- pip

### Configuração do Ambiente

1. **Clone o repositório e navegue para o diretório da API:**
   ```bash
   cd backend-api
   ```

2. **Crie um ambiente virtual:**
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

3. **Instale as dependências:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure as variáveis de ambiente:**
   ```bash
   cp .env.example .env
   ```
   
   Edite o arquivo `.env` com suas configurações:
   ```env
   # Banco de dados
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=trt21_clp
   DB_USER=seu_usuario
   DB_PASSWORD=sua_senha
   
   # API
   API_PORT=8000
   API_HOST=0.0.0.0
   ENVIRONMENT=development
   FRONTEND_URL=http://localhost:3000
   
   # Segurança
   SECRET_KEY=sua_chave_secreta_muito_segura
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   
   # Upload
   MAX_FILE_SIZE=10485760
   ALLOWED_EXTENSIONS=pdf
   
   # Scripts Python
   PYTHON_SCRIPTS_DIR=../scripts
   TEMP_FILES_DIR=./temp
   ```

5. **Configure o banco de dados MySQL:**
   ```sql
   CREATE DATABASE trt21_clp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'seu_usuario'@'localhost' IDENTIFIED BY 'sua_senha';
   GRANT ALL PRIVILEGES ON trt21_clp.* TO 'seu_usuario'@'localhost';
   FLUSH PRIVILEGES;
   ```

6. **Execute as migrações:**
   ```bash
   # Inicializar Alembic (apenas na primeira vez)
   alembic init alembic
   
   # Gerar migração inicial
   alembic revision --autogenerate -m "Initial migration"
   
   # Aplicar migrações
   alembic upgrade head
   ```

## 🚀 Execução

### Desenvolvimento

```bash
# Executar servidor de desenvolvimento
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Produção

```bash
# Executar servidor de produção
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## 📚 Documentação da API

Após iniciar o servidor, acesse:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## 🔗 Endpoints Principais

### Saúde da API
- `GET /` - Status da API
- `GET /health` - Verificação de saúde

### Pontos Eletrônicos
- `GET /api/pontos-eletronicos` - Listar pontos eletrônicos
- `POST /api/pontos-eletronicos/process-pdfs` - Processar PDFs de frequência
- `GET /api/pontos-eletronicos/stats` - Estatísticas
- `DELETE /api/pontos-eletronicos/clear-all` - Limpar todos os registros

### Colaboradores
- `GET /api/colaboradores` - Listar colaboradores
- `PUT /api/colaboradores` - Adicionar colaborador
- `DELETE /api/colaboradores` - Remover colaborador
- `POST /api/colaboradores/bulk` - Substituir todos os colaboradores

### Contracheques
- `GET /api/contracheques` - Listar contracheques
- `POST /api/contracheques/process-pdfs` - Processar PDFs de contracheques
- `GET /api/contracheques/stats/summary` - Estatísticas

## 🔧 Estrutura do Projeto

```
backend-api/
├── database/
│   ├── __init__.py
│   ├── connection.py      # Configuração do banco
│   └── models.py          # Modelos SQLAlchemy
├── routers/
│   ├── __init__.py
│   ├── pontos_eletronicos.py
│   ├── colaboradores.py
│   └── contracheques.py
├── schemas/
│   ├── __init__.py
│   ├── common.py          # Schemas comuns
│   ├── pontos_eletronicos.py
│   ├── colaboradores.py
│   └── contracheques.py
├── services/
│   ├── __init__.py
│   └── pdf_processor.py   # Processamento de PDFs
├── main.py                # Aplicação principal
├── requirements.txt       # Dependências
├── .env.example          # Exemplo de configuração
└── README.md             # Este arquivo
```

## 🧪 Testes

```bash
# Executar testes
pytest

# Executar com cobertura
pytest --cov=.

# Executar testes específicos
pytest tests/test_pontos_eletronicos.py
```

## 🔒 Segurança

- Autenticação via Bearer Token
- Validação de entrada com Pydantic
- Sanitização de uploads de arquivos
- Rate limiting (configurável)
- CORS configurado para frontend específico

## 📦 Deploy

### DigitalOcean App Platform

1. **Configure as variáveis de ambiente no painel da DigitalOcean**
2. **Configure o banco de dados gerenciado**
3. **Deploy automático via Git**

### Docker

```bash
# Build da imagem
docker build -t trt21-clp-api .

# Executar container
docker run -p 8000:8000 --env-file .env trt21-clp-api
```

## 🤝 Integração com Frontend

O frontend Next.js deve ser configurado para usar esta API:

```typescript
// Configuração da API no frontend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Exemplo de chamada
const response = await fetch(`${API_BASE_URL}/api/pontos-eletronicos`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## 📝 Logs

Logs são configurados automaticamente:
- **Desenvolvimento**: Console com nível DEBUG
- **Produção**: Arquivo com nível INFO

## 🐛 Troubleshooting

### Problemas Comuns

1. **Erro de conexão com MySQL**
   - Verifique se o MySQL está rodando
   - Confirme as credenciais no `.env`
   - Teste a conexão: `mysql -u usuario -p -h localhost`

2. **Erro ao processar PDFs**
   - Verifique se os scripts Python estão no diretório correto
   - Confirme as permissões de execução
   - Verifique o diretório temporário

3. **Erro de CORS**
   - Confirme a URL do frontend no `.env`
   - Verifique a configuração de CORS no `main.py`

## 📄 Licença

Este projeto é de uso interno do TRT21.

## 👥 Contribuição

Para contribuir:
1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📞 Suporte

Para suporte técnico, entre em contato com a equipe de TI do TRT21.