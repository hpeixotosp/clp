# TRT21 - CLP Manager

Este é um sistema de gestão para o TRT21 - CLP para o registro, acompanhamento e categorização de processos e demandas.

## Tecnologias

- **Front-end:** Next.js 14 (React)
- **UI:** shadcn/ui
- **Back-end:** Next.js API Routes
- **Banco de Dados:** SQLite

## Começando

Siga as instruções abaixo para configurar e executar o projeto em seu ambiente local.

### Pré-requisitos

- Node.js (versão 18 ou superior)
- npm

### Instalação

1.  Clone o repositório para a sua máquina local.
2.  Navegue até o diretório do projeto:
    ```bash
    cd trt21-clp-manager
    ```
3.  Instale as dependências do projeto:
    ```bash
    npm install
    ```

### Configuração do Banco de Dados

Antes de iniciar a aplicação, você precisa inicializar o banco de dados SQLite. Isso criará o arquivo `trt21-clp.db` na raiz do projeto com o esquema de tabelas necessário.

Execute o seguinte comando:

```bash
npm run db:init
```

### Executando o Servidor de Desenvolvimento

Após a instalação das dependências e a inicialização do banco de dados, você pode iniciar o servidor de desenvolvimento.

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver a aplicação em funcionamento.

## Estrutura do Projeto

-   `/src/app/api`: Contém as rotas de API do back-end.
-   `/src/app/(pages)`: Contém as páginas da aplicação.
-   `/src/components`: Contém os componentes React reutilizáveis.
-   `/src/lib`: Contém os utilitários, como a conexão com o banco de dados (`db.ts`) e dados estáticos (`data.ts`).
-   `/public`: Contém os arquivos estáticos, como os CSVs de dados.
-   `/trt21-clp.db`: O arquivo do banco de dados SQLite.
