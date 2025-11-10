# Painel de Administração Modular Full-Stack

Este documento é o guia completo para configuração, desenvolvimento e implantação da aplicação.

## Visão Geral da Arquitetura

Esta é uma aplicação full-stack com uma arquitetura moderna e desacoplada:

1.  **Frontend:** Uma "Single Page Application" (SPA) construída com **React** e empacotada com **esbuild**.
2.  **Backend:** Um servidor API construído com **Node.js, Express e TypeScript**, responsável pela lógica de negócios, autenticação, comunicação com o banco de dados e por servir os arquivos do frontend.
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
git clone <URL_DO_SEU_REPOSITORIO> ivotec
cd ivotec
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
      POSTGRES_USER: ivotec
      POSTGRES_PASSWORD: ivo526526
      POSTGRES_DB: ivotec_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
volumes:
  postgres_data:
```

**3. Configure as Variáveis de Ambiente:**
Crie um arquivo `.env` e preencha-o:
```bash
nano .env
```
Conteúdo do `.env`:
```env
DATABASE_URL="postgresql://ivotec:ivo526526@localhost:5432/ivotec_db"
PORT=8069
JWT_SECRET="segredo-de-desenvolvimento-pode-ser-simples"
```

**4. Instale Dependências e Rode a Aplicação:**
Abra um terminal, instale as dependências e inicie o servidor unificado.
```bash
# Instalar dependências
npm install

# Iniciar o servidor de desenvolvimento (backend + frontend)
npm run dev:server
```
A aplicação completa estará acessível em `http://localhost:8069`.

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

**2. Crie o Banco de Dados e o Usuário:**
```sql
CREATE DATABASE ivotec_db;
CREATE USER ivotec WITH PASSWORD 'ivo526526';
GRANT ALL PRIVILEGES ON DATABASE ivotec_db TO ivotec;
\q
```

**3. Criação de Tabelas (Automático!):**
**Não é necessário executar comandos SQL manualmente!** A aplicação agora cria automaticamente o esquema do banco de dados na primeira vez que o servidor é iniciado.

### c. Implantação do Código

**1. Clone o Repositório:**
```bash
sudo mkdir -p /var/www/ivotec && sudo chown -R $USER:$USER /var/www/ivotec
cd /var/www/ivotec
git clone <URL_DO_SEU_REPOSITORIO> .
```

**2. Configure as Variáveis de Ambiente:**
Crie um arquivo `.env` com suas informações de produção:
```bash
nano .env
```
Conteúdo do `.env`:
```env
DATABASE_URL="postgresql://ivotec:ivo526526@localhost:5432/ivotec_db"
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

**2. Instale o PM2 e Inicie o Servidor com o Ecossistema:**
O `ecosystem.config.js` garante que o PM2 inicie a aplicação com as configurações corretas, resolvendo problemas de diretório de trabalho.
```bash
sudo npm install pm2 -g
cd /var/www/ivotec
pm2 start ecosystem.config.js
pm2 startup
# Copie e execute o comando gerado pelo `pm2 startup`
pm2 save
```

### e. Configuração Final do Nginx

**1. Crie um arquivo de configuração para o site:**
```bash
sudo nano /etc/nginx/sites-available/ivotec
```
Cole a seguinte configuração (substitua `SEU_IP_OU_DOMINIO`):
```nginx
server {
    listen 80;
    listen [::]:80;

    server_name SEU_IP_OU_DOMINIO;

    root /var/www/ivotec;
    index index.html;

    location /api/ {
        proxy_pass http://localhost:8069;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        try_files $uri /index.html;
    }
}
```

**2. Ative o site e reinicie o Nginx:**
```bash
sudo ln -s /etc/nginx/sites-available/ivotec /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### f. Permissões de Arquivo e Firewall

**1. Dê ao Nginx Permissão para Ler os Arquivos:**
```bash
sudo chown -R www-data:www-data /var/www/ivotec
sudo chmod -R 755 /var/www/ivotec
```

**2. Libere as Portas no Firewall:**
```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow 'OpenSSH'
sudo ufw enable
```

**3. Acesse sua aplicação:**
Acesse `http://<IP_DO_SEU_SERVIDOR>` no seu navegador.

---

## 3. Solução de Problemas (Troubleshooting)

### Erro `errored` no PM2 ou 502 Bad Gateway

Isso geralmente significa que a aplicação backend travou na inicialização.

**1. Verifique os Logs do PM2:**
Este é o primeiro e mais importante passo.
```bash
pm2 logs ivotec-backend
```
A aplicação agora fornece logs detalhados. A causa mais comum é um erro no arquivo `.env`.

**2. Use o Endpoint de Verificação de Saúde:**
Acesse `http://SEU_IP_OU_DOMINIO/api/health` para verificar o status do backend e do banco de dados.