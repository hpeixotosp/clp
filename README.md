# CLP Manager - Sistema de Gestão de Contracheques e Pontos Eletrônicos

## 🏗️ Arquitetura

Este projeto está organizado em duas partes principais:

### Frontend (Next.js)
- **Localização**: `/frontend/`
- **Deploy**: Vercel
- **URL**: [Frontend URL]

### Backend (Python/FastAPI)
- **Localização**: `/backend/`
- **Deploy**: DigitalOcean
- **URL**: http://143.110.196.243

## 🚀 Deploy

### Frontend (Vercel)
1. Conecte o repositório ao Vercel
2. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_API_URL`: http://143.110.196.243
   - `NEXT_PUBLIC_BACKEND_URL`: http://143.110.196.243
   - `NEXT_PUBLIC_ENVIRONMENT`: production

### Backend (DigitalOcean)
1. O backend já está configurado e rodando
2. Serviços ativos:
   - Nginx (porta 80)
   - FastAPI (porta 8000)
   - MySQL
   - Supervisor

## 📁 Estrutura do Projeto

```
clp/
├── frontend/          # Next.js App
│   ├── src/          # Código fonte
│   ├── package.json  # Dependências
│   └── vercel.json   # Config Vercel
├── backend/           # Python/FastAPI
│   ├── main.py       # Aplicação principal
│   ├── requirements.txt
│   └── database/     # Modelos e conexões
└── README.md         # Este arquivo
```

## 🔧 Desenvolvimento Local

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

## 📊 Status do Deploy

- ✅ **Backend**: Funcionando no DigitalOcean
- 🔄 **Frontend**: Pronto para deploy no Vercel
- ✅ **Banco de Dados**: MySQL configurado e funcionando
- ✅ **API**: Endpoints funcionando em http://143.110.196.243
