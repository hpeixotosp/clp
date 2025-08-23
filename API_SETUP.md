# Configuração da API do Google AI

## Problema
A aplicação está apresentando o erro: "Erro na análise: Chave da API do Google AI não configurada"

## Solução

### 1. Obter Chave da API
1. Acesse [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Copie a chave gerada

### 2. Configurar Variável de Ambiente

#### Opção A: Arquivo .env.local (Recomendado para desenvolvimento)
1. Na raiz do projeto `trt21-clp-manager/`, crie um arquivo chamado `.env.local`
2. Adicione o seguinte conteúdo:
```bash
GOOGLE_AI_API_KEY=sua_chave_api_aqui
```

#### Opção B: Variável de Sistema (Windows)
1. Abra o PowerShell como administrador
2. Execute:
```powershell
[Environment]::SetEnvironmentVariable("GOOGLE_AI_API_KEY", "sua_chave_api_aqui", "User")
```

#### Opção C: Variável de Sistema (Linux/Mac)
```bash
export GOOGLE_AI_API_KEY="sua_chave_api_aqui"
```

### 3. Reiniciar a Aplicação
Após configurar a variável de ambiente, reinicie o servidor Next.js:
```bash
npm run dev
```

### 4. Verificar Configuração
A aplicação deve funcionar normalmente sem o erro de API key.

## Estrutura do Projeto
- `src/app/api/tr-analisar/analyze/route.ts` - API endpoint que verifica a chave
- `analisador_tr_etp.py` - Script Python que usa a chave para análise com Google AI
- `src/app/tr-analisar/page.tsx` - Interface do usuário

## Notas Importantes
- Nunca commite a chave da API no repositório
- O arquivo `.env.local` está no `.gitignore` por segurança
- Para produção, configure as variáveis de ambiente no servidor de hospedagem
