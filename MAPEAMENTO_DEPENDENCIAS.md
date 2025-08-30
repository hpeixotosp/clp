# Mapeamento de Dependências - Refatoração para Arquitetura Desacoplada

## Estrutura Atual do Projeto

### Frontend (Next.js)
- **Framework**: Next.js 14 com React 18
- **UI**: Shadcn/ui components
- **Styling**: Tailwind CSS
- **Localização**: `src/app/` (App Router)

### Backend Integrado
- **APIs**: Route handlers em `src/app/api/`
- **Scripts Python**: Processamento de PDFs
- **Banco de Dados**: SQLite local

## Dependências Identificadas

### 1. APIs Next.js que Executam Scripts Python

#### `/api/process-pdfs` (Frequência)
- **Arquivo**: `src/app/api/process-pdfs/route.ts`
- **Script Python**: `backend_pdf_processor_wrapper.py`
- **Função**: Processa PDFs de ponto eletrônico
- **Entrada**: FormData com arquivos PDF
- **Saída**: CSV com dados de frequência
- **Dependências**:
  - `backend_pdf_processor.py`
  - `colaboradores_validos.txt`
  - Bibliotecas Python: pdfplumber, pandas, PyMuPDF

#### `/api/process-contracheques` (Contracheques)
- **Arquivo**: `src/app/api/process-contracheques/route.ts`
- **Script Python**: `processador_contracheque.py`
- **Função**: Processa contracheques com OCR
- **Entrada**: FormData com arquivos PDF
- **Saída**: JSON com dados validados
- **Dependências**:
  - `backend_pdf_processor.py`
  - Bibliotecas Python: pdfplumber, PyMuPDF

### 2. APIs CRUD com Banco SQLite

#### `/api/pontos-eletronicos`
- **Operações**: GET, POST, DELETE
- **Funções do Database**:
  - `salvarPontoEletronico()`
  - `buscarPontosEletronicos()`
  - `limparTodosPontos()`
  - `obterEstatisticas()`

#### `/api/colaboradores`
- **Operações**: GET, PUT, POST, DELETE
- **Funções do Database**:
  - `buscarColaboradores()`
  - `adicionarColaborador()`
  - `removerColaborador()`
  - `substituirTodosColaboradores()`

#### Outras APIs CRUD
- `/api/proads` - Gestão de PROADs
- `/api/demandas` - Gestão de demandas
- `/api/refis` - Gestão de refis
- `/api/siglas` - Gestão de siglas
- `/api/tr-analisar` - Análise de TRs
- `/api/analise-proposta` - Análise de propostas
- `/api/andamentos` - Gestão de andamentos

### 3. Componentes Frontend com Dependências de Backend

#### Página TIC (`src/app/tic/page.tsx`)
- **Funcionalidades**:
  - Upload e processamento de PDFs de frequência
  - Upload e processamento de contracheques
  - Gestão de colaboradores
- **APIs Consumidas**:
  - `/api/process-pdfs`
  - `/api/process-contracheques`
  - `/api/pontos-eletronicos`
  - `/api/colaboradores`

#### ColaboradoresManager (`src/components/ColaboradoresManager.tsx`)
- **Funcionalidades**:
  - CRUD de colaboradores
  - Validação de nomes
- **APIs Consumidas**:
  - `/api/colaboradores`

### 4. Banco de Dados SQLite

#### Estrutura (`src/lib/database.ts`)
- **Tabelas**:
  - `pontos_eletronicos`
  - `proads`
  - `proad_andamentos`
  - `refis`
  - `demandas`
  - `colaboradores_validos`

#### Funções Principais
- Conexão com SQLite
- Inicialização de tabelas
- Funções CRUD para cada entidade
- Detecção de ambiente (produção/desenvolvimento)

### 5. Scripts Python

#### `backend_pdf_processor.py`
- **Função**: Extração de dados de PDFs
- **Dependências**: pdfplumber, pandas
- **Usado por**: Ambos os processadores

#### `backend_pdf_processor_wrapper.py`
- **Função**: Wrapper para processamento de frequência
- **Saída**: CSV formatado

#### `processador_contracheque.py`
- **Função**: Processamento específico de contracheques
- **Recursos**: OCR, validação de assinatura

## Estratégia de Separação

### Backend Python Independente
1. **Criar API RESTful** com Flask/FastAPI
2. **Migrar scripts Python** para endpoints
3. **Implementar autenticação** e CORS
4. **Configurar MySQL** como banco principal

### Frontend Next.js Puro
1. **Remover route handlers** que executam Python
2. **Substituir por fetch()** para API externa
3. **Configurar variáveis de ambiente** para URL da API
4. **Manter apenas** lógica de UI e estado

### Pontos de Integração
- **Upload de arquivos**: Multipart/form-data
- **Autenticação**: JWT ou API Keys
- **CORS**: Configuração para domínio Vercel
- **Variáveis de ambiente**: `NEXT_PUBLIC_API_URL`

## Próximos Passos

1. ✅ **Análise concluída**
2. 🔄 **Mapeamento em andamento**
3. ⏳ **Criar estrutura da API Python**
4. ⏳ **Planejar migração MySQL**
5. ⏳ **Adaptar frontend**
6. ⏳ **Configurar variáveis de ambiente**
7. ⏳ **Documentar deployment**