# 🚀 Instruções de Deploy - CLP Manager

## 📋 Pré-requisitos

- ✅ Conta no GitHub
- ✅ Conta no Vercel
- ✅ Servidor DigitalOcean configurado (já feito!)
- ✅ Backend funcionando (já funcionando!)

## 🔄 Passo 1: Push para GitHub

### 1.1 Adicionar arquivos organizados
```bash
git add .
git commit -m "Organize project structure for deployment"
git push origin master
```

### 1.2 Verificar estrutura no GitHub
A estrutura deve estar assim:
```
clp/
├── frontend/          # Next.js App
│   ├── src/          # Código fonte
│   ├── package.json  # Dependências
│   ├── vercel.json   # Config Vercel
│   └── env.local.example
├── backend/           # Python/FastAPI
│   ├── main.py       # Aplicação principal
│   ├── requirements.txt
│   └── database/     # Modelos e conexões
├── README.md         # Documentação
└── .gitignore        # Arquivos ignorados
```

## 🌐 Passo 2: Deploy no Vercel

### 2.1 Conectar repositório
1. Acesse [vercel.com](https://vercel.com)
2. Clique em "New Project"
3. Importe o repositório do GitHub
4. Selecione a pasta `frontend` como root directory

### 2.2 Configurar variáveis de ambiente
No Vercel, configure estas variáveis:
```
NEXT_PUBLIC_API_URL=http://143.110.196.243
NEXT_PUBLIC_BACKEND_URL=http://143.110.196.243
NEXT_PUBLIC_ENVIRONMENT=production
```

### 2.3 Deploy
1. Clique em "Deploy"
2. Aguarde o build completar
3. Anote a URL gerada (ex: `https://seu-projeto.vercel.app`)

## 🐳 Passo 3: Verificar Backend (DigitalOcean)

### 3.1 Status dos serviços
```bash
# Verificar se tudo está rodando
systemctl status nginx
systemctl status mysql
supervisorctl status tic-backend

# Verificar portas
netstat -tulpn | grep LISTEN
```

### 3.2 Testar API
```bash
# Testar health check
curl http://143.110.196.243/health

# Testar endpoint raiz
curl http://143.110.196.243/
```

## 🔗 Passo 4: Configurar CORS (se necessário)

Se houver problemas de CORS, edite o arquivo `backend/main.py`:

```python
origins = [
    "http://localhost:3000",
    "https://*.vercel.app",   # Vercel
    "https://seu-projeto.vercel.app",  # Sua URL específica
    os.getenv("FRONTEND_URL", "http://localhost:3000")
]
```

## ✅ Passo 5: Teste Final

### 5.1 Frontend
- Acesse a URL do Vercel
- Verifique se a aplicação carrega
- Teste as funcionalidades principais

### 5.2 Backend
- Teste a API: `http://143.110.196.243/docs`
- Verifique logs: `supervisorctl tail tic-backend`

## 🆘 Troubleshooting

### Problema: CORS Error
```bash
# Reiniciar backend
supervisorctl restart tic-backend
```

### Problema: API não responde
```bash
# Verificar logs
tail -f /var/log/supervisor/tic-backend.log
```

### Problema: Frontend não conecta
- Verificar variáveis de ambiente no Vercel
- Verificar se a URL do backend está correta

## 📊 Status Final

- ✅ **Backend**: DigitalOcean (143.110.196.243)
- ✅ **Frontend**: Vercel (sua-url.vercel.app)
- ✅ **Banco**: MySQL funcionando
- ✅ **API**: FastAPI rodando
- ✅ **Proxy**: Nginx configurado

## 🎯 Próximos Passos

1. Fazer push para GitHub
2. Conectar ao Vercel
3. Configurar variáveis de ambiente
4. Deploy automático
5. Testar integração

**🎉 Seu sistema estará 100% funcionando em produção!**
