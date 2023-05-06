module.exports = {
  apps: [
    // {
    //   name: "app",
    //   script: "nest start --watch",
    //   error_file: ".pm2/logs/app/app-error.log",
    //   out_file: ".pm2/logs/app/app-out.log",
    //   log_file: ".pm2/logs/app/app-log.log",
    // },
    {
      name: "listener",
      script: "npx nestjs-command listener:run",
      error_file: ".pm2/logs/listener/listener-error.log",
      out_file: ".pm2/logs/listener/listener-out.log",
      log_file: ".pm2/logs/listener/listener-log.log",
    },
  ],
};
