# Guia de Implantação: Aplicação de Painel Modular em Ubuntu Server 22.04

Este guia detalha os passos para implantar e executar esta aplicação React em um servidor Ubuntu 22.04, permitindo o acesso na sua rede local.

## Visão Geral da Arquitetura

Esta aplicação é uma "Single Page Application" (SPA) construída com React. Ela foi desenvolvida sem uma etapa de "build" tradicional (como Webpack ou Vite). Em vez disso, ela utiliza o sistema de módulos ES6 nativo do navegador и carrega o React a partir de uma CDN.

Isso significa que para implantá-la, precisamos apenas de um servidor web estático para servir os arquivos HTML, TSX (que o navegador tratará como JavaScript), e outros assets.

---

## 1. Pré-requisitos no Ubuntu Server 22.04

Antes de começar, você precisa de um servidor web para servir os arquivos. Vamos cobrir duas opções: Nginx (recomendado para produção) e o pacote `serve` do Node.js (mais simples e ótimo para testes rápidos).

### Opção A: Node.js e `serve` (Mais Simples)

Esta é a maneira mais rápida de colocar o site no ar para testes.

**a. Instale o Node.js e npm:**
Recomendamos usar o NVM (Node Version Manager) para instalar o Node.js, pois ele permite gerenciar múltiplas versões facilmente.

```bash
# Atualize os pacotes do seu sistema
sudo apt update
sudo apt upgrade -y

# Instale o cURL para baixar o NVM
sudo apt install curl -y

# Baixe e execute o script de instalação do NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Carregue o NVM no seu shell atual (ou feche e reabra o terminal)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Instale a versão mais recente do Node.js (LTS - Long Term Support)
nvm install --lts

# Verifique a instalação
node -v
npm -v
```

**b. Instale o pacote `serve` globalmente:**
`serve` é um servidor web estático simples e poderoso.

```bash
npm install -g serve
```

### Opção B: Nginx (Mais Robusto)

Nginx é um servidor web de nível de produção, ideal para uma implantação mais permanente.

```bash
# Atualize os pacotes do seu sistema
sudo apt update
sudo apt upgrade -y

# Instale o Nginx
sudo apt install nginx -y

# Verifique se o Nginx está rodando
sudo systemctl status nginx
```

---

## 2. Implantação do Código

Agora, você precisa transferir os arquivos da aplicação para o seu servidor.

**a. Crie um diretório para a sua aplicação:**

```bash
# Crie um diretório dentro de /var/www, que é o local padrão para conteúdo web
sudo mkdir -p /var/www/meu-app
```

**b. Transfira os arquivos:**
Copie todos os arquivos do projeto (`index.html`, `index.tsx`, `App.tsx`, etc.) para o diretório `/var/www/meu-app` no servidor. Você pode fazer isso usando `scp` do seu computador local para o servidor, ou usando `git clone` se o seu projeto estiver em um repositório Git.

Exemplo usando `scp` (execute no seu computador local):
```bash
# scp -r /caminho/local/do/projeto/* usuario@ip_do_servidor:/var/www/meu-app/
```
*Substitua os valores de exemplo pelos seus.*

**c. Ajuste as permissões:**
O Nginx (e outros servidores web) geralmente roda com o usuário `www-data`. Dê a ele a propriedade do diretório.

```bash
sudo chown -R www-data:www-data /var/www/meu-app
sudo chmod -R 755 /var/www/meu-app
```

---

## 3. Configuração do Servidor Web (na porta 8069)

Escolha uma das opções abaixo para servir os arquivos que você acabou de transferir.

### Opção A: Usando o `serve`

**a. Navegue até o diretório da aplicação:**

```bash
cd /var/www/meu-app
```

**b. Inicie o servidor na porta 8069:**
O comando `serve` servirá o conteúdo do diretório atual. A flag `-s` é crucial para SPAs; ela garante que qualquer rota desconhecida (como `/#/administrator`) seja redirecionada para o `index.html`, permitindo que o roteamento do React funcione.

```bash
serve -s . -l 8069
```

O servidor estará rodando. Para mantê-lo rodando em segundo plano, você pode usar uma ferramenta como `pm2` ou `screen`.

### Opção B: Configurando o Nginx

**a. Crie um arquivo de configuração para o seu site:**

```bash
sudo nano /etc/nginx/sites-available/meu-app
```

**b. Cole a seguinte configuração no arquivo:**
Esta configuração diz ao Nginx para ouvir na porta 8069 e servir os arquivos do seu diretório. A diretiva `try_files` é o equivalente do Nginx para a flag `-s` do `serve`, essencial para o roteamento da SPA.

```nginx
server {
    listen 8069;
    listen [::]:8069;

    # O IP do seu servidor pode ser colocado aqui, ou deixe como está para todos
    # server_name seu_dominio_ou_ip;

    root /var/www/meu-app;
    index index.html;

    location / {
        # Tenta servir o arquivo solicitado diretamente.
        # Se não encontrar, tenta servir um diretório com esse nome.
        # Se falhar, redireciona para o index.html, permitindo o roteamento do React.
        try_files $uri $uri/ /index.html;
    }
}
```
Pressione `Ctrl+X`, depois `Y` e `Enter` para salvar e fechar.

**c. Ative o site e reinicie o Nginx:**
Crie um link simbólico do seu arquivo de configuração para o diretório `sites-enabled`.

```bash
# Crie o link para ativar a configuração
sudo ln -s /etc/nginx/sites-available/meu-app /etc/nginx/sites-enabled/

# Verifique se a sintaxe da configuração está correta
sudo nginx -t

# Se o teste for bem-sucedido, reinicie o Nginx para aplicar as alterações
sudo systemctl restart nginx
```

---

## 4. Liberando a Porta no Firewall

Para que outros computadores na sua rede possam acessar a aplicação, você precisa abrir a porta `8069` no firewall do Ubuntu (UFW).

```bash
# Permita o tráfego na porta 8069
sudo ufw allow 8069/tcp

# Verifique o status para confirmar
sudo ufw status
```

---

## 5. Acessando e Testando na Rede Local

**a. Encontre o endereço IP local do seu servidor Ubuntu:**
Execute um dos seguintes comandos no terminal do servidor:

```bash
hostname -I
# Ou
ip a
```
Anote o endereço IP (ex: `192.168.1.10`).

**b. Acesse a aplicação:**
Em qualquer outro dispositivo (computador, smartphone) conectado à **mesma rede local**, abra um navegador web e digite:

`http://<IP_DO_SEU_SERVIDOR>:8069`

Exemplo: `http://192.168.1.10:8069`

Você deverá ver a página "Moto World". O login do administrador e todas as outras funcionalidades de navegação devem funcionar perfeitamente.
