# Painel de Administração Modular Full-Stack

Este documento é o guia completo para configuração, desenvolvimento e implantação da aplicação.

## Visão Geral da Arquitetura

Esta é uma aplicação full-stack com uma arquitetura moderna e desacoplada:

1.  **Frontend:** Uma "Single Page Application" (SPA) construída com **React**. Utiliza uma abordagem "build-less" com **Import Maps** para carregar dependências diretamente no navegador, simplificando o desenvolvimento.
2.  **Backend:** Um servidor API construído com **Node.js, Express e TypeScript**, responsável pela lógica de negócios, autenticação e comunicação com o banco de dados.
3.  **Banco de Dados:** **PostgreSQL**, um sistema de banco de dados relacional robusto para garantir a persistência e a integridade dos dados.

---

## 1. Configuração para Desenvolvimento Local

Siga estes passos para configurar um ambiente de desenvolvimento na sua máquina.

### a. Pré-requisitos
- **Node.js:** Instale a versão LTS. Recomenda-se usar o `nvm` (Node Version Manager).
- **Git:** Para clonar o repositório.
- **Docker e Docker Compose:** (Recomendado) A maneira mais fácil de executar um banco de dados PostgreSQL localmente sem instalar nada globalmente.

### b. Passo a Passo

**1. Clone o repositório:**
```bash
git clone <URL_DO_SEU_REPOSITORIO> meu-app
cd meu-app
```

**2. Configure o Banco de Dados com Docker:**
Se você tiver o Docker instalado, crie um arquivo `docker-compose.yml` na raiz do projeto com o seguinte conteúdo:
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
Inicie o contêiner do banco de dados com:
```bash
docker-compose up -d
```
*Se preferir instalar o PostgreSQL localmente, siga a documentação oficial para o seu sistema operacional.*

**3. Configure as Variáveis de Ambiente:**
Copie o arquivo de exemplo e edite-o.
```bash
cp .env.example .env
nano .env
```
Preencha o arquivo `.env` para o ambiente local. Ele deve ficar assim:
```env
# URL de Conexão com o Banco de Dados (use a senha do Docker Compose)
DATABASE_URL="postgresql://meu_app_user:sua_senha_segura@localhost:5432/meu_app_db"

# Porta para o servidor Backend
PORT=8069

# Segredo para os tokens de autenticação (JWT)
JWT_SECRET="segredo-de-desenvolvimento-pode-ser-simples"
```

**4. Instale as Dependências e Rode o Backend:**
Abra um terminal na raiz do projeto.
```bash
# Instale todas as dependências do Node.js
npm install

# Inicie o servidor de desenvolvimento. Ele reiniciará automaticamente a cada mudança nos arquivos.
npm run dev:server
```
O backend estará rodando em `http://localhost:8069`.

**5. Sirva o Frontend:**
O frontend é composto por arquivos estáticos (`index.html`, `index.tsx`, etc.). Abra um **segundo terminal** e sirva esses arquivos com um servidor simples.
```bash
# Instale um servidor estático simples (se ainda não tiver)
npm install -g serve

# Sirva a pasta atual na porta 3000
serve -l 3000
```
Agora você pode acessar a aplicação no seu navegador em `http://localhost:3000`.

---

## 2. Guia de Implantação em Produção (Ubuntu Server 22.04)

Siga estes passos para implantar a aplicação em um servidor de produção.

### a. Pré-requisitos e Instalação de Programas

Execute estes comandos no seu servidor Ubuntu.

**1. Atualize o Sistema:**
```bash
sudo apt update && sudo apt upgrade -y
```

**2. Instale Git, cURL, Nginx, PostgreSQL:**
```bash
sudo apt install git curl nginx postgresql postgresql-contrib -y
```

**3. Instale o Node.js (via NVM):**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install --lts
```

### b. Configuração do Banco de Dados (PostgreSQL)

**1. Acesse o PostgreSQL:**
```bash
sudo -u postgres psql
```

**2. Crie o Banco de Dados e o Usuário:** (Substitua `sua_senha_segura_de_producao` por uma senha forte)
```sql
CREATE DATABASE meu_app_db;
CREATE USER meu_app_user WITH PASSWORD 'sua_senha_segura_de_producao';
ALTER ROLE meu_app_user SET client_encoding TO 'utf8';
ALTER ROLE meu_app_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE meu_app_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE meu_app_db TO meu_app_user;
\q
```

**3. Crie as Tabelas:** Conecte-se ao novo banco e execute os seguintes comandos SQL.
```bash
sudo -u postgres psql -d meu_app_db
```

**Tabela de Usuários:**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Tabela de Conteúdo do Site:**
```sql
CREATE TABLE site_content (
    id INT PRIMARY KEY,
    content JSONB,
    last_updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Tabelas do Módulo de Loja:**
```sql
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category_id UUID REFERENCES product_categories(id),
    image_url VARCHAR(2048),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Tabela do Módulo de Estoque:**
```sql
CREATE TABLE stock_inventory (
    product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 0,
    last_updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Tabela do Módulo de Mensagens:**
```sql
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id VARCHAR(255) NOT NULL,
    sender_type VARCHAR(50) NOT NULL,
    sender_id VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_conversation_id ON chat_messages(conversation_id);
```

**Tabela do Módulo de Suporte:**
```sql
CREATE TABLE support_tickets (
    id SERIAL PRIMARY KEY,
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Aberto',
    priority VARCHAR(50) NOT NULL DEFAULT 'Baixa',
    submitted_by_email VARCHAR(255) NOT NULL,
    assigned_to UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ
);
```

**4. Insira os Dados Iniciais:**
```sql
-- Usuário desenvolvedor com senha 'senha12345'
INSERT INTO users (name, email, role, password_hash) VALUES 
('Gamecard User', 'gamecardiv@gmail.com', 'Developer', '$2b$10$fPL4bJg2C9jlY2hw3bJ9A.5xXJgGeGLrIBv2d9/101EY2SnlUFg.C');

-- Conteúdo inicial do site
INSERT INTO site_content (id, content) VALUES
(1, '[
    { "id": "block_1", "type": "hero", "content": { "title": "Bem-vindo ao Mundo Moto", "subtitle": "Sua parada única para as melhores motos do planeta. Comece sua aventura hoje.", "ctaText": "Explorar Coleção" }},
    { "id": "block_2", "type": "text", "content": { "heading": "Sobre Nossa Paixão", "body": "Nós vivemos e respiramos motocicletas. Nossa missão é fornecer aos entusiastas máquinas de alta qualidade e serviço incomparável. Cada moto em nossa coleção é escolhida a dedo e inspecionada para garantir que atenda aos nossos altos padrões de desempenho e confiabilidade." }}
]');
```
Saia do psql com `\q`.

### c. Implantação e Configuração do Código

**1. Clone o repositório e instale dependências:**
```bash
sudo mkdir -p /var/www/ && sudo chown -R $USER:$USER /var/www/
cd /var/www
git clone <URL_DO_SEU_REPOSITORIO> meu-app
cd meu-app
npm install
```

**2. Configure as Variáveis de Ambiente para Produção:**
```bash
cp .env.example .env
nano .env
```
Preencha com suas informações de produção:
```env
DATABASE_URL="postgresql://meu_app_user:sua_senha_segura_de_producao@localhost:5432/meu_app_db"
PORT=8069
JWT_SECRET="gere-um-segredo-muito-longo-e-aleatorio-para-producao"
```

### d. Compilando e Executando a Aplicação

**1. Compile o TypeScript do Backend:**
```bash
npx tsc
```

**2. Instale o PM2 e Inicie o Servidor:**
O PM2 garantirá que seu servidor reinicie automaticamente.
```bash
npm install pm2 -g
pm2 start dist/server.js --name "meu-app-backend"
pm2 startup
pm2 save
```

### e. Configure o Nginx

**1. Crie um arquivo de configuração para o site:**
```bash
sudo nano /etc/nginx/sites-available/meu-app
```
Cole a seguinte configuração (substitua `SEU_IP_OU_DOMINIO`):
```nginx
server {
    listen 80;
    listen [::]:80;

    root /var/www/meu-app;
    index index.html;

    server_name SEU_IP_OU_DOMINIO;

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:8069;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
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

### f. Configurando o Firewall e Acessando

**1. Libere as portas no firewall:**
```bash
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

**2. Acesse sua aplicação:**
Encontre o IP do seu servidor com `hostname -I`. Em qualquer dispositivo, abra o navegador e acesse: `http://<IP_DO_SEU_SERVIDOR>`
