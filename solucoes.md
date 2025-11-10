# Soluções de Problemas Comuns

Este arquivo serve como uma base de conhecimento para registrar problemas encontrados durante a implantação e desenvolvimento, e suas respectivas soluções.

---

## Título: Erro ao Acessar o Banco de Dados

### Sintoma

Ao iniciar a aplicação com `pm2`, o status do processo fica `errored` e o processo reinicia em um ciclo contínuo. Ao verificar os logs com `pm2 logs ivotec-backend`, a seguinte mensagem de erro crítica é exibida:

```
--- ERRO CRÍTICO: FALHA AO CONECTAR/INICIALIZAR O BANCO DE DADOS ---
Mensagem de Erro: getaddrinfo ENOTFOUND ...
```

Isso acontece mesmo após confirmar que as credenciais do banco de dados (usuário, senha, nome do banco) estão corretas e que a conexão manual via `psql` funciona.

### Causa Raiz

O problema não são as credenciais, mas sim a **incapacidade da aplicação de ler o arquivo `.env`** quando executada pelo PM2. A biblioteca `dotenv` procura pelo arquivo `.env` no "diretório de trabalho atual" do processo. Se o PM2 não for iniciado a partir do diretório raiz do projeto, a aplicação não consegue carregar as variáveis de ambiente, resultando na falha de conexão.

### Solução Definitiva

A solução mais robusta e profissional é utilizar um **arquivo de ecossistema do PM2** (`ecosystem.config.js`). Este arquivo centraliza a configuração da aplicação e instrui explicitamente o PM2 sobre como executá-la, resolvendo o problema do diretório de trabalho.

**Passos para Implementação:**

1.  **Criar o arquivo `ecosystem.config.js`** na raiz do projeto (`/var/www/ivotec`) com o seguinte conteúdo:
    ```javascript
    module.exports = {
      apps : [{
        name   : "ivotec-backend",
        script : "./dist/server/server.js",
        // Define o diretório de trabalho para a raiz do projeto,
        // garantindo que o arquivo .env seja encontrado.
        cwd    : "/var/www/ivotec",
      }]
    }
    ```

2.  **Parar e Deletar o Processo Antigo do PM2:** Para garantir que não haja nenhum estado em cache, o processo antigo deve ser removido.
    ```bash
    pm2 delete ivotec-backend
    ```

3.  **Iniciar a Aplicação Usando o Ecossistema:** Em vez de iniciar o script diretamente, iniciamos usando o novo arquivo de configuração.
    ```bash
    pm2 start ecosystem.config.js
    ```

4.  **Salvar a Configuração do PM2:** Para garantir que a aplicação reinicie automaticamente com as configurações corretas se o servidor for reiniciado.
    ```bash
    pm2 save
    ```

Esta abordagem garante que a aplicação sempre inicie no contexto correto, encontre o arquivo `.env` e se conecte com sucesso ao banco de dados.
