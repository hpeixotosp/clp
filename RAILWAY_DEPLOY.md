# 🚂 Deploy no Railway

Este projeto está configurado para funcionar perfeitamente no Railway, que suporta Python e Node.js nativamente.

## 📋 Pré-requisitos

1. **Conta no Railway**: [railway.app](https://railway.app)
2. **GitHub**: Projeto deve estar em um repositório público ou privado
3. **Chave da API Google AI**: Para funcionalidades de IA

## 🚀 Passos para Deploy

### 1. Conectar ao Railway

1. Acesse [railway.app](https://railway.app)
2. Faça login com sua conta GitHub
3. Clique em "New Project"
4. Selecione "Deploy from GitHub repo"
5. Escolha o repositório `trt21-clp-manager`

### 2. Configurar Variáveis de Ambiente

No Railway, vá em **Variables** e adicione:

```bash
GOOGLE_AI_API_KEY=sua_chave_aqui
NODE_ENV=production
```

### 3. Deploy Automático

O Railway detectará automaticamente:
- ✅ **Python 3.11** (via `runtime.txt`)
- ✅ **Node.js 20** (via `.nvmrc`)
- ✅ **Dependências Python** (via `requirements.txt`)
- ✅ **Dependências Node.js** (via `package.json`)
- ✅ **Configuração de build** (via `nixpacks.toml`)

### 4. Acessar a Aplicação

Após o deploy, o Railway fornecerá uma URL como:
```
https://seu-projeto.railway.app
```

## 🔧 Configuração Técnica

### Arquivos de Configuração

- **`railway.json`**: Configuração específica do Railway
- **`nixpacks.toml`**: Configuração de build com Nixpacks
- **`Procfile`**: Comando de inicialização
- **`runtime.txt`**: Versão do Python
- **`.nvmrc`**: Versão do Node.js

### Estrutura de Build

1. **Setup**: Instala Python 3.11 e Node.js 20
2. **Install**: Instala dependências Python e Node.js
3. **Build**: Executa `npm run build`
4. **Start**: Inicia com `npm start`

## 🐍 Scripts Python

O Railway suporta nativamente:
- ✅ **pdfplumber**: Processamento de PDFs
- ✅ **PyMuPDF**: Análise avançada de PDFs
- ✅ **tabula-py**: Extração de tabelas
- ✅ **google-generativeai**: IA para análise
- ✅ **pandas**: Manipulação de dados

## 📊 Monitoramento

No Railway você pode:
- Ver logs em tempo real
- Monitorar uso de recursos
- Configurar alertas
- Fazer rollback para versões anteriores

## 🔄 Deploy Contínuo

O Railway faz deploy automático sempre que você fizer push para:
- `main` branch
- `master` branch

## 💰 Custos

- **Plano Gratuito**: 500 horas/mês
- **Plano Pro**: $5/mês para uso ilimitado
- **Sem cobrança por build**

## 🆘 Suporte

Se encontrar problemas:
1. Verifique os logs no Railway
2. Confirme que as variáveis de ambiente estão corretas
3. Verifique se o repositório está sincronizado

## 🎯 Vantagens do Railway

- ✅ **Python nativo** (sem wrappers complexos)
- ✅ **Deploy automático** do GitHub
- ✅ **SSL gratuito** automático
- ✅ **CDN global** para performance
- ✅ **Logs detalhados** para debug
- ✅ **Rollback fácil** para versões anteriores
