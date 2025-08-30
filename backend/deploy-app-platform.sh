#!/bin/bash

# Script de deploy para DigitalOcean App Platform
# Este script prepara o ambiente para evitar erros de build

echo "🚀 Preparando deploy para DigitalOcean App Platform..."

# Backup do requirements.txt original
cp requirements.txt requirements-full.txt

# Usar requirements mínimos para evitar problemas de compilação
echo "📦 Usando dependências mínimas para deploy..."
cp requirements-minimal.txt requirements.txt

# Verificar se os arquivos de configuração existem
if [ ! -f "runtime.txt" ]; then
    echo "⚠️  Criando runtime.txt..."
    echo "python-3.11.10" > runtime.txt
fi

if [ ! -f ".python-version" ]; then
    echo "⚠️  Criando .python-version..."
    echo "3.11.10" > .python-version
fi

echo "✅ Preparação concluída!"
echo "📋 Próximos passos:"
echo "   1. Faça commit das alterações"
echo "   2. Faça push para o repositório"
echo "   3. Configure as variáveis de ambiente no DigitalOcean:"
echo "      - DATABASE_URL"
echo "      - MYSQL_HOST"
echo "      - MYSQL_USER"
echo "      - MYSQL_PASSWORD"
echo "      - MYSQL_DATABASE"
echo "      - GOOGLE_API_KEY"
echo "   4. Inicie o deploy no App Platform"

echo "🔄 Para restaurar dependências completas após deploy:"
echo "   cp requirements-full.txt requirements.txt"