# Use a imagem oficial do Node.js 20
FROM node:20-alpine

# Instale Python, pip e outras dependências
RUN apk add --no-cache python3 py3-pip

# Crie o diretório de trabalho
WORKDIR /app

# Copie os arquivos de dependência
COPY package*.json ./
COPY requirements.txt ./

# Instale as dependências do Node.js
RUN npm install

# Instale as dependências do Python
RUN pip3 install --no-cache-dir -r requirements.txt

# Copie o restante do código da aplicação
COPY . .

# Build da aplicação Next.js
RUN npm run build

# Exponha a porta 3000
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["npm", "start"]
