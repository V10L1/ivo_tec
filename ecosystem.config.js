export default {
  apps : [{
    name   : "ivotec-backend",
    script : "./dist/server/server.js",
    cwd    : "/var/www/ivotec",
    watch  : false,
    autorestart: true,
  }]
}