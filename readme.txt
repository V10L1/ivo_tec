# Painel de Administração Modular Full-Stack

Este documento é o guia completo para configuração, desenvolvimento e implantação da aplicação.

## Visão Geral da Arquitetura

Esta é uma aplicação full-stack com uma arquitetura moderna e desacoplada:

1.  **Frontend:** Uma "Single Page Application" (SPA) construída com **React**. Utiliza uma abordagem "build-less" com **Import Maps** para carregar dependências diretamente no navegador, simplificando o desenvolvimento.
2.  **Backend:** Um servidor API construído com **Node.js, Express e TypeScript**, responsável pela lógica de negócios, autenticação, comunicação com o banco de dados e por servir os arquivos do frontend no ambiente de desenvolvimento.
3.  **Banco de Dados:** **PostgreSQL**, um sistema de banco de dados relacional robusto para garantir a persistência e a integridade dos dados.

---

## 1. Configuração para Desenvolvimento Local

Siga estes passos para configurar um ambiente de desenvolvimento na sua máquina.

### a. Pré-requisitos
- **Node.js:** Instale a versão LTS. Recomenda-se usar o `nvm` (Node Version Manager).
- **Git:** Para clonar o repositório.
- **Docker e Docker Compose:** (Recomendado) A maneira mais fácil de executar um banco de dados PostgreSQL localmente.

### b. Passo a Passo

**1. Clone o repositório:**
```bash
git clone <URL_DO_SEU_REPOSITORIO> meu-app
cd meu-app
```

**2. Configure e inicie o Banco de Dados com Docker:**
Crie um arquivo `docker-compose.yml` na raiz do projeto com o conteúdo abaixo e execute `docker-compose up -d`.
```yaml
version: '3.8'
services:
  db:
    image: postgres:15
    restart: always
    environment:
      POSTGRES_USER: meu_app_user
      POSTGRES_PASSWORD: sua_senha_segura
      POSTGRES_DB: meu_app_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
volumes:
  postgres_data:
```

**3. Configure as Variáveis de Ambiente:**
Crie um arquivo `.env` a partir do `.env.example` e preencha-o:
```env
DATABASE_URL="postgresql://meu_app_user:sua_senha_segura@localhost:5432/meu_app_db"
PORT=8069
JWT_SECRET="segredo-de-desenvolvimento-pode-ser-simples"
```

**4. Instale Dependências e Rode a Aplicação:**
Abra um terminal, instale as dependências e inicie o servidor unificado.
```bash
# Instalar dependências
npm install

# Iniciar o servidor de desenvolvimento (backend + frontend)
# Este comando irá primeiro compilar os arquivos do frontend e depois iniciar o servidor.
npm run dev:server
```
O servidor irá compilar os arquivos e então iniciar. Você pode acessar a aplicação completa no endereço que aparecerá no seu terminal, geralmente `http://localhost:8069`.

---

## 2. Guia de Implantação em Produção (Ubuntu Server 22.04)

Este é o guia final e corrigido para implantar a aplicação do zero em um servidor de produção.

### a. Preparação do Servidor

**1. Atualize o Sistema:**
```bash
sudo apt update && sudo apt upgrade -y
```

**2. Instale Programas Essenciais:**
```bash
sudo apt install git curl nginx postgresql postgresql-contrib -y
```

**3. Instale o Node.js (via NVM):**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
# Feche e reabra seu terminal para ativar o nvm
nvm install --lts
```

### b. Configuração do Banco de Dados (PostgreSQL)

**1. Acesse o PostgreSQL:**
```bash
sudo -u postgres psql
```

**2. Crie o Banco de Dados e o Usuário:** (Substitua a senha)
```sql
CREATE DATABASE meu_app_db;
CREATE USER meu_app_user WITH PASSWORD 'sua_senha_segura_de_producao';
GRANT ALL PRIVILEGES ON DATABASE meu_app_db TO meu_app_user;
\q
```

**3. Criação de Tabelas e Dados Iniciais (Automático!):**
**Não é mais necessário executar comandos SQL manualmente!** A aplicação foi atualizada para criar automaticamente o esquema do banco de dados e inserir os dados iniciais na primeira vez que o servidor é iniciado. Este passo agora é totalmente automatizado para simplificar a implantação e evitar erros.

**Nota Importante:** O primeiro usuário administrador **também não é mais criado manualmente**. Continue com os passos de implantação. Ao acessar a aplicação pela primeira vez no navegador (no endereço `http://<IP_DO_SEU_SERVIDOR>/#/administrator`), você será redirecionado para uma tela de "Configuração Inicial" onde deverá criar o primeiro usuário com a função de Desenvolvedor.

### c. Implantação do Código

**1. Clone o Repositório:**
```bash
sudo mkdir -p /var/www/meu-app && sudo chown -R $USER:$USER /var/www/meu-app
cd /var/www/meu-app
git clone <URL_DO_SEU_REPOSITORIO> .
```

**2. Configure as Variáveis de Ambiente:**
Crie um arquivo `.env` com suas informações de produção:
```bash
nano .env
```
Conteúdo do `.env`:
```env
DATABASE_URL="postgresql://meu_app_user:sua_senha_segura_de_producao@localhost:5432/meu_app_db"
PORT=8069
JWT_SECRET="gere-um-segredo-muito-longo-e-aleatorio-para-producao"
```

**3. Instale as Dependências:**
```bash
npm install
```

### d. Compilando e Executando a Aplicação com PM2

**1. Compile o Frontend e o Backend:**
```bash
npm run build
```

**2. Instale o PM2 e Inicie o Servidor:**
```bash
sudo npm install pm2 -g
cd /var/www/meu-app
pm2 start dist/server/server.js --name "meu-app-backend"
pm2 startup
# Copie e execute o comando gerado pelo `pm2 startup`
pm2 save
```

### e. Configuração Final do Nginx

**1. Crie um arquivo de configuração para o site:**
```bash
sudo nano /etc/nginx/sites-available/meu-app
```
Cole a seguinte configuração (substitua `SEU_IP_OU_DOMINIO`):
```nginx
server {
    listen 80;
    listen [::]:80;

    server_name SEU_IP_OU_DOMINIO;

    root /var/www/meu-app;
    index index.html;

    # Regra para a API (redireciona para o Node.js)
    location /api/ {
        proxy_pass http://localhost:8069;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Regra principal para todas as outras rotas (carrega a SPA)
    # O Nginx servirá os arquivos estáticos (como /dist/client/index.js)
    # a partir do diretório 'root' antes de recorrer a esta regra.
    location / {
        try_files $uri /index.html;
    }
}
```

**2. Ative o site e reinicie o Nginx:**
```bash
sudo ln -s /etc/nginx/sites-available/meu-app /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### f. Permissões de Arquivo e Firewall

**1. Dê ao Nginx Permissão para Ler os Arquivos:** (Passo CRUCIAL)
```bash
sudo chown -R www-data:www-data /var/www/meu-app
sudo chmod -R 755 /var/www/meu-app
```

**2. Libere as Portas no Firewall:**
```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow 'OpenSSH'  # Essencial para não perder o acesso SSH
sudo ufw enable
```

**3. Acesse sua aplicação:**
Encontre o IP do seu servidor com `hostname -I`. Em qualquer dispositivo, abra o navegador e acesse: `http://<IP_DO_SEU_SERVIDOR>`

---

## 3. Solução de Problemas (Troubleshooting)

### Erro 502 Bad Gateway ou Aplicação Offline

Um erro 502 significa que o Nginx (servidor web) não conseguiu se comunicar com a sua aplicação backend (Node.js/PM2). Isso geralmente acontece porque a aplicação backend travou na inicialização.

**1. Verifique os Logs do PM2:**
Este é o primeiro e mais importante passo. Os logs mostrarão o erro exato que fez sua aplicação parar.
```bash
pm2 logs meu-app-backend
```
Procure por mensagens de erro em vermelho. A aplicação agora fornece logs detalhados para problemas de conexão com o banco de dados.

**2. Use o Endpoint de Verificação de Saúde:**
A aplicação agora tem um endpoint para verificar seu status. Acesse o seguinte URL no seu navegador:
`http://SEU_IP_OU_DOMINIO/api/health`

- **Resposta de Sucesso:** `{"status":"ok","message":"Backend está rodando e conectado ao banco de dados."}`
  - Se você receber isso, a aplicação e o banco de dados estão funcionando. O problema pode estar na configuração do Nginx.

- **Resposta de Erro ou Sem Resposta:**
  - Se a página não carregar ou mostrar um erro 502, confirma que o processo do PM2 não está respondendo. Verifique os logs do PM2 para encontrar a causa.
  - A causa mais comum é um erro no arquivo `.env` (senha do banco de dados incorreta, etc.).