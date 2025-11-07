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

**b. Instale o Node.js (via NVM):**
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

**c. Instale o PostgreSQL:**
O banco de dados para armazenar os dados da aplicação.
```bash
sudo apt install postgresql postgresql-contrib -y
```

**d. Instale o Nginx:**
O servidor web que irá exibir a interface do seu site (frontend).
```bash
sudo apt install nginx -y
```

**e. Instale o PM2 (Gerenciador de Processos):**
Para manter o servidor backend rodando em segundo plano.
```bash
npm install -g pm2
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
GRANT ALL PRIVILEGES ON DATABASE meu_app_db TO meu_app_user;
\q
```

**c. Conecte-se ao novo banco de dados e crie a tabela `users`:**
```bash
sudo -u postgres psql -d meu_app_db
```
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

**d. Insira o usuário desenvolvedor inicial:**
A senha `senha12345` precisa ser "hashed" (criptografada) antes de ser inserida. O hash abaixo corresponde a `senha12345`.
Cole o seguinte comando SQL para criar o usuário `gamecardiv@gmail.com`:
```sql
INSERT INTO users (name, email, role, password_hash) VALUES 
('Gamecard User', 'gamecardiv@gmail.com', 'Developer', '$2a$10$fPL4bJg2C9jlY2hw3bJ9A.5xXJgGeGLrIBv2d9/101EY2SnlUFg.C');
```
*Nota: Este hash foi gerado com `bcrypt` com um custo de 10.*

**e. Saia do psql:**
```sql
\q
```

---

## 3. Implantação e Configuração do Código

**a. Crie um diretório para a aplicação:**
```bash
sudo mkdir -p /var/www/meu-app
```

**b. Transfira TODOS os arquivos do projeto** para `/var/www/meu-app`.
Use `scp` ou `git clone`. Certifique-se de que `server.ts`, `package.json`, `index.html`, etc., estejam todos neste diretório.

**c. Instale as dependências do Node.js:**
```bash
cd /var/www/meu-app
npm install
```

**d. Configure as variáveis de ambiente:**
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

**e. Defina as permissões corretas:**
```bash
sudo chown -R $USER:www-data /var/www/meu-app
sudo chmod -R 775 /var/www/meu-app
```

---

## 4. Executando o Backend e o Frontend

**a. Inicie o servidor Backend com PM2:**
O PM2 garantirá que seu servidor reinicie automaticamente se falhar ou após o reboot do sistema.
```bash
# Navegue até o diretório do projeto, se não estiver lá
cd /var/www/meu-app

# Inicie o servidor com PM2
pm2 start "npm run dev:server" --name "meu-app-backend"

# Salve a configuração do PM2 para reiniciar após o boot
pm2 save
```

**b. Configure o Nginx para servir o Frontend:**
Crie um arquivo de configuração para o site.
```bash
sudo nano /etc/nginx/sites-available/meu-app
```
Cole a seguinte configuração:
```nginx
server {
    listen 80;
    listen [::]:80;

    root /var/www/meu-app;
    index index.html;

    server_name _; # Responde a qualquer nome de domínio/IP

    location / {
        # Essencial para Single Page Apps: sempre retorna o index.html
        # se o arquivo ou diretório solicitado não for encontrado.
        try_files $uri $uri/ /index.html;
    }
}
```
Salve e feche o arquivo.

**c. Ative o site e reinicie o Nginx:**
```bash
sudo ln -s /etc/nginx/sites-available/meu-app /etc/nginx/sites-enabled/
# Opcional: Remova o site padrão se não for usá-lo
sudo rm /etc/nginx/sites-enabled/default

sudo nginx -t      # Testa a configuração
sudo systemctl restart nginx # Aplica as mudanças
```

---

## 5. Configurando o Firewall e Acessando

**a. Libere as portas no firewall:**
Precisamos liberar a porta `80` para o Nginx (Frontend) e a `8069` para a API (Backend).
```bash
sudo ufw allow 'Nginx Full' # Abre as portas 80 (http) e 443 (https)
sudo ufw allow 8069/tcp      # Abre a porta da API
sudo ufw enable              # Ativa o firewall, se não estiver ativo
sudo ufw status              # Verifica o status
```

**b. Acesse sua aplicação:**
Encontre o IP do seu servidor com `hostname -I`. Em qualquer dispositivo na mesma rede, abra o navegador e acesse:
`http://<IP_DO_SEU_SERVIDOR>`

Você deverá ver o site "Moto World". O login e todas as funcionalidades agora estarão se comunicando com seu backend e banco de dados reais.
