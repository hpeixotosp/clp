# Etapa 1: Mudar para uma base Debian (slim) que é mais robusta que Alpine
FROM node:20-slim

# Instalar Python, PIP, VENV e as ferramentas de build essenciais via apt-get
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Definir o diretório de trabalho
WORKDIR /app

# Criar e ativar o ambiente virtual Python
ENV VIRTUAL_ENV=/app/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Copiar arquivos de configuração de dependências
COPY package*.json ./
COPY requirements.txt ./

# Instalar dependências do Node.js
RUN npm install

# Instalar dependências do Python DENTRO do ambiente virtual
# Com a base Debian, o pip vai encontrar pacotes pré-compilados (wheels)
RUN pip3 install --no-cache-dir -r requirements.txt

# Copiar o restante do código-fonte da aplicação
COPY . .

# Executar o build do Next.js
RUN npm run build

# Expor a porta que a aplicação vai rodar
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["npm", "start"]
