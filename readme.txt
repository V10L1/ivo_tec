# Guia de Implantação Full-Stack: Aplicação Modular em Ubuntu Server 22.04

Este guia detalha os passos para implantar e executar a aplicação completa (Frontend React + Backend Node.js) em um servidor Ubuntu 22.04, permitindo o acesso na sua rede local.

## Visão Geral da Arquitetura

Esta é uma aplicação full-stack:
1.  **Frontend:** Uma "Single Page Application" (SPA) construída com React, que roda no navegador do usuário.
2.  **Backend:** Um servidor API construído com Node.js e Express, responsável pela lógica de negócios e comunicação com o banco de dados.
3.  **Banco de Dados:** PostgreSQL, para armazenar todos os dados da aplicação de forma persistente.

Para a implantação, vamos configurar o Backend para rodar na porta `8069` e usar o Nginx como um servidor web robusto para servir o Frontend na porta `80` (padrão HTTP).

---

## 1. Pré-requisitos e Instalação de Programas

Execute estes comandos no seu servidor Ubuntu para instalar todo o software necessário.

**a. Atualize o Sistema:**
```bash
sudo apt update
sudo apt upgrade -y
```

**b. Instale o Git:**
```bash
sudo apt install git -y
```

**c. Instale o Node.js (via NVM):**
O Node.js é necessário para rodar o servidor backend.
```bash
# Instale o cURL
sudo apt install curl -y

# Baixe e instale o NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Carregue o NVM no seu shell (ou feche e reabra o terminal)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Instale a versão LTS (Long Term Support) do Node.js
nvm install --lts

# Verifique a instalação
node -v
npm -v
```

**d. Instale o PostgreSQL:**
O banco de dados para armazenar os dados da aplicação.
```bash
sudo apt install postgresql postgresql-contrib -y
```

**e. Instale o Nginx:**
O servidor web que irá exibir a interface do seu site (frontend).
```bash
sudo apt install nginx -y
```

---

## 2. Configuração do Banco de Dados (PostgreSQL)

**a. Acesse o PostgreSQL:**
```bash
sudo -u postgres psql
```

**b. Crie um usuário e um banco de dados:**
Substitua `sua_senha_segura` por uma senha forte de sua escolha.
```sql
CREATE DATABASE meu_app_db;
CREATE USER meu_app_user WITH PASSWORD 'sua_senha_segura';
ALTER ROLE meu_app_user SET client_encoding TO 'utf8';
ALTER ROLE meu_app_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE meu_app_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE meu_app_db TO meu_app_user;
\q
```

**c. Conecte-se ao novo banco de dados para criar as tabelas:**
```bash
sudo -u postgres psql -d meu_app_db
```

**d. Crie a tabela `users`:**
Cole o seguinte comando SQL no terminal `psql` e pressione Enter:
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

**e. Crie a tabela `site_content` para o construtor de páginas:**
Esta tabela usará um campo `JSONB` para armazenar de forma flexível a estrutura da página.
```sql
CREATE TABLE site_content (
    id INT PRIMARY KEY,
    content JSONB,
    last_updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**f. Insira o usuário desenvolvedor inicial:**
A senha `senha12345` precisa ser "hashed" (criptografada). O hash abaixo corresponde a `senha12345`.
```sql
INSERT INTO users (name, email, role, password_hash) VALUES 
('Gamecard User', 'gamecardiv@gmail.com', 'Developer', '$2b$10$fPL4bJg2C9jlY2hw3bJ9A.5xXJgGeGLrIBv2d9/101EY2SnlUFg.C');
```

**g. Insira o conteúdo inicial do site:**
```sql
INSERT INTO site_content (id, content) VALUES
(1, '[
    {
        "id": "block_1",
        "type": "hero",
        "content": {
            "title": "Welcome to Moto World",
            "subtitle": "Your one-stop shop for the best bikes on the planet. Start your adventure today.",
            "ctaText": "Explore Collection"
        }
    },
    {
        "id": "block_2",
        "type": "text",
        "content": {
            "heading": "About Our Passion",
            "body": "We live and breathe motorcycles. Our mission is to provide fellow enthusiasts with top-quality machines and unparalleled service. Every bike in our collection is hand-picked and inspected to ensure it meets our high standards of performance and reliability."
        }
    }
]');
```

**h. Saia do psql:**
```sql
\q
```

---

## 3. Implantação e Configuração do Código

**a. Clone o repositório:**
Navegue até o diretório onde deseja armazenar o projeto (ex: `/var/www`) e clone o código.
```bash
# Crie o diretório e defina as permissões
sudo mkdir -p /var/www/
sudo chown -R $USER:$USER /var/www/

# Clone o repositório
cd /var/www
git clone https://github.com/V10L1/ivo_tec meu-app
cd meu-app
```

**b. Instale as dependências do Node.js:**
```bash
npm install
```

**c. Configure as variáveis de ambiente:**
Copie o arquivo de exemplo e edite-o.
```bash
cp .env.example .env
nano .env
```
Preencha o arquivo `.env` com suas informações. Ele deve ficar assim:
```env
# URL de Conexão com o Banco de Dados (substitua com sua senha)
DATABASE_URL="postgresql://meu_app_user:sua_senha_segura@localhost:5432/meu_app_db"

# Porta para o servidor Backend
PORT=8069

# Segredo para os tokens de autenticação (JWT) - use uma frase longa e aleatória
JWT_SECRET="este-e-um-segredo-muito-longo-e-seguro-para-meu-app"
```
Pressione `Ctrl+X`, `Y` e `Enter` para salvar.

---

## 4. Compilando e Executando a Aplicação

**a. Compile o código TypeScript do Backend:**
```bash
npx tsc
```

**b. Inicie o servidor Backend com PM2:**
O PM2 garantirá que seu servidor reinicie automaticamente. Ele irá executar o código JavaScript compilado que está na pasta `dist`.
```bash
# Inicie o servidor com PM2
pm2 start dist/server.js --name "meu-app-backend"

# Salve a configuração do PM2 para reiniciar após o boot
pm2 save

# Monitore os logs (opcional)
pm2 logs meu-app-backend
```

**c. Configure o Nginx para servir o Frontend:**
Crie um arquivo de configuração para o site.
```bash
sudo nano /etc/nginx/sites-available/meu-app
```
Cole a seguinte configuração:
```nginx
server {
    listen 80;
    listen [::]:80;

    # O root agora aponta para o diretório que contém o index.html
    root /var/www/meu-app;
    index index.html;

    server_name SEU_IP_OU_DOMINIO; # Substitua pelo IP do seu servidor ou domínio

    location / {
        # Essencial para Single Page Apps: sempre retorna o index.html
        try_files $uri /index.html;
    }

    # Redireciona as chamadas de API para o servidor backend
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
Salve e feche o arquivo.

**d. Ative o site e reinicie o Nginx:**
```bash
sudo ln -s /etc/nginx/sites-available/meu-app /etc/nginx/sites-enabled/
# Opcional: Remova o site padrão
sudo rm /etc/nginx/sites-enabled/default

sudo nginx -t      # Testa a configuração
sudo systemctl restart nginx # Aplica as mudanças
```

---

## 5. Configurando o Firewall e Acessando

**a. Libere as portas no firewall:**
```bash
sudo ufw allow 'Nginx Full' # Abre as portas 80 (http) e 443 (https)
sudo ufw enable              # Ativa o firewall, se não estiver ativo
sudo ufw status              # Verifica o status
```
*A porta 8069 não precisa mais ser aberta publicamente, pois o Nginx está atuando como um proxy reverso.*

**b. Acesse sua aplicação:**
Encontre o IP do seu servidor com `hostname -I`. Em qualquer dispositivo na mesma rede, abra o navegador e acesse:
`http://<IP_DO_SEU_SERVIDOR>`

Você deverá ver o site dinâmico. O login e todas as funcionalidades agora estarão se comunicando com seu backend e banco de dados reais.
