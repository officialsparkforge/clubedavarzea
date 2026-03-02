// Configuração PM2 para gerenciar o backend
module.exports = {
  apps: [{
    name: 'clubevarzea-api',
    script: './server.cjs',
    instances: 1,
    exec_mode: 'fork',
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    watch: false,
    max_memory_restart: '500M',
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000,
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
  }]
};

