module.exports = {
  apps : [{
    name   : "ivotec-backend",
    script : "./dist/server/server.js",
    // Define o diretório de trabalho para a raiz do projeto,
    // garantindo que o arquivo .env seja encontrado.
    cwd    : "/var/www/ivotec",
    watch  : false,
    // Garante que as variáveis de ambiente do .env sejam carregadas
    // antes que a aplicação inicie.
    autorestart: true,
  }]
}
