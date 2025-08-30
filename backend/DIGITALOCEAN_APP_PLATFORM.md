# Deploy no DigitalOcean App Platform

## Problema Identificado

O erro de build que você está enfrentando é causado pela compilação do pandas 2.1.4, que requer dependências de sistema específicas (como Cython e ninja) que podem não estar disponíveis no ambiente de build do DigitalOcean App Platform.

```
ninja: build stopped: subcommand failed.
error: metadata-generation-failed
```

## Solução Implementada

### 1. Arquivos Criados

- **`runtime.txt`**: Especifica Python 3.11.10 (versão compatível)
- **`.python-version`**: Arquivo adicional para garantir a versão do Python
- **`requirements-minimal.txt`**: Dependências essenciais sem pandas
- **`.do/app.yaml`**: Configuração específica do App Platform
- **`deploy-app-platform.sh`**: Script de deploy para Linux/Mac
- **`deploy-app-platform.ps1`**: Script de deploy para Windows

### 2. Alterações Realizadas

- **Downgrade do pandas**: De 2.1.4 para 2.0.3 (versão mais estável)
- **Versão do Python**: Fixada em 3.11.10 (compatível com buildpack v4.289.5)
- **Dependências mínimas**: Criado arquivo com apenas dependências essenciais

## Como Usar

### Opção 1: Deploy com Dependências Mínimas (Recomendado)

1. **Execute o script de preparação:**
   ```bash
   # Linux/Mac
   chmod +x deploy-app-platform.sh
   ./deploy-app-platform.sh
   
   # Windows
   .\deploy-app-platform.ps1
   ```

2. **Faça commit e push:**
   ```bash
   git add .
   git commit -m "Configuração para DigitalOcean App Platform"
   git push
   ```

3. **Configure variáveis de ambiente no App Platform:**
   - `DATABASE_URL`
   - `MYSQL_HOST`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `MYSQL_DATABASE`
   - `GOOGLE_API_KEY`

### Opção 2: Deploy com Pandas Atualizado

1. **Use o requirements.txt atualizado** (pandas 2.0.3)
2. **Certifique-se de que os arquivos de configuração existem:**
   - `runtime.txt`
   - `.python-version`

## Configuração do App Platform

O arquivo `.do/app.yaml` está configurado com:

- **Runtime**: Python com buildpack automático
- **Comando de execução**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Porta**: 8080
- **Instância**: basic-xxs (mais econômica)
- **Variáveis de ambiente**: Configuradas como secrets

## Funcionalidades Afetadas

Com as **dependências mínimas**, as seguintes funcionalidades podem ser limitadas:

- ❌ Processamento avançado de planilhas (pandas)
- ❌ OCR de imagens (pytesseract)
- ❌ Conversão de PDF para imagem (pdf2image)
- ❌ Análise com Google Generative AI
- ✅ API básica (FastAPI)
- ✅ Banco de dados MySQL
- ✅ Processamento básico de PDF (pdfplumber)
- ✅ Autenticação e segurança

## Restaurar Funcionalidades Completas

Após o deploy bem-sucedido, você pode tentar restaurar as dependências completas:

```bash
# Restaurar requirements completo
cp requirements-full.txt requirements.txt
git add requirements.txt
git commit -m "Restaurar dependências completas"
git push
```

## Alternativas

### 1. Usar Droplet ao invés de App Platform

Se você precisar de todas as funcionalidades, considere usar um Droplet do DigitalOcean onde você tem controle total sobre o ambiente.

### 2. Containerização com Docker

Crie um Dockerfile personalizado com todas as dependências de sistema necessárias.

### 3. Dividir em Microserviços

Separe as funcionalidades que requerem pandas/OCR em um serviço separado.

## Monitoramento

Após o deploy, monitore os logs do App Platform para identificar possíveis problemas:

```bash
# Via CLI do DigitalOcean
doctl apps logs <app-id>
```

## Suporte

Se o problema persistir, verifique:

1. **Logs de build** no painel do App Platform
2. **Versão do buildpack** (atualmente v4.289.5)
3. **Compatibilidade das dependências** com Python 3.11.10
4. **Variáveis de ambiente** configuradas corretamente