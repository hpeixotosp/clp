# Configuração de Deploy Minimalista

## Visão Geral

Este documento descreve como configurar a aplicação para funcionar com dependências ultra-mínimas no DigitalOcean App Platform, removendo completamente pandas, pdfplumber e outras dependências problemáticas.

## Dependências Removidas

```txt
# Removidas do requirements-minimal.txt:
pandas==2.0.3
pdfplumber==0.10.3
pytesseract==0.3.10
openpyxl==3.1.2
tabula-py==2.8.2
google-generativeai==0.3.2
PyMuPDF==1.23.8
Pillow==10.1.0
pdf2image==1.16.3
pymysql==1.1.0
```

## Modificações Necessárias no Código

### 1. Desabilitar Imports Problemáticos

No arquivo `main.py`, adicione verificações condicionais:

```python
# Imports condicionais
try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False

try:
    import pdfplumber
    PDF_PROCESSING_AVAILABLE = True
except ImportError:
    PDF_PROCESSING_AVAILABLE = False
```

### 2. Endpoints com Verificação de Dependências

```python
@app.post("/process-pdf/")
async def process_pdf(file: UploadFile):
    if not PDF_PROCESSING_AVAILABLE:
        raise HTTPException(
            status_code=503, 
            detail="Processamento de PDF não disponível nesta versão"
        )
    # Código original aqui

@app.post("/analyze-data/")
async def analyze_data(data: dict):
    if not PANDAS_AVAILABLE:
        raise HTTPException(
            status_code=503, 
            detail="Análise de dados não disponível nesta versão"
        )
    # Código original aqui
```

### 3. Routers Condicionais

Nos arquivos de routers, adicione verificações:

```python
# routers/contracheques.py
from fastapi import HTTPException

try:
    import pandas as pd
    import pdfplumber
    FULL_FEATURES = True
except ImportError:
    FULL_FEATURES = False

@router.post("/upload-contracheque/")
async def upload_contracheque(file: UploadFile):
    if not FULL_FEATURES:
        return {
            "status": "error",
            "message": "Funcionalidade de processamento de PDF não disponível",
            "suggestion": "Use a versão completa da aplicação"
        }
    # Código original
```

## Variáveis de Ambiente

Adicione no `.env`:

```env
# Configuração de funcionalidades
ENABLE_PDF_PROCESSING=false
ENABLE_DATA_ANALYSIS=false
ENABLE_OCR=false
MINIMAL_MODE=true
```

## Endpoints Disponíveis na Versão Minimal

### ✅ Funcionais
- `GET /` - Health check
- `GET /colaboradores/` - Listar colaboradores
- `POST /colaboradores/` - Criar colaborador
- `PUT /colaboradores/{id}` - Atualizar colaborador
- `DELETE /colaboradores/{id}` - Deletar colaborador
- `POST /auth/login` - Autenticação
- `GET /health` - Status da aplicação

### ❌ Desabilitados
- `POST /contracheques/upload` - Upload de PDF
- `POST /pontos/process` - Processamento de ponto
- `POST /analyze/proposta` - Análise com IA
- `POST /ocr/process` - OCR de imagens
- `GET /reports/excel` - Relatórios em Excel

## Script de Ativação

Crie um script para alternar entre versões:

```bash
#!/bin/bash
# toggle-features.sh

if [ "$1" = "minimal" ]; then
    cp requirements-minimal.txt requirements.txt
    echo "MINIMAL_MODE=true" > .env.local
    echo "Modo minimal ativado"
elif [ "$1" = "full" ]; then
    cp requirements-full.txt requirements.txt
    echo "MINIMAL_MODE=false" > .env.local
    echo "Modo completo ativado"
else
    echo "Uso: $0 [minimal|full]"
fi
```

## Monitoramento

Adicione logs para identificar funcionalidades desabilitadas:

```python
import logging
from loguru import logger

@app.on_event("startup")
async def startup_event():
    if not PANDAS_AVAILABLE:
        logger.warning("🚨 Pandas não disponível - Análise de dados desabilitada")
    if not PDF_PROCESSING_AVAILABLE:
        logger.warning("🚨 PDFPlumber não disponível - Processamento de PDF desabilitado")
    
    logger.info(f"🚀 Aplicação iniciada em modo {'MINIMAL' if os.getenv('MINIMAL_MODE') else 'COMPLETO'}")
```

## Próximos Passos

1. **Deploy Inicial**: Use a versão minimal para fazer o deploy funcionar
2. **Teste Básico**: Verifique se os endpoints essenciais funcionam
3. **Upgrade Gradual**: Adicione dependências uma por vez
4. **Monitoramento**: Acompanhe logs de erro e performance

## Alternativas

Se mesmo a versão minimal falhar:

1. **DigitalOcean Droplet**: VM completa com controle total
2. **Docker**: Container customizado
3. **Railway**: Plataforma alternativa
4. **Heroku**: Com buildpack customizado