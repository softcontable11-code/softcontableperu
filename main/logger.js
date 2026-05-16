const winston = require('winston');
const path = require('path');
const fs = require('fs');
let app;
try {
  if (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_STATIC_URL) {
    console.log("[LOGGER] Ejecutando en entorno Cloud (Railway).");
  } else {
    const lib = 'electron';
    app = require(lib).app;
  }
} catch (error) {
  app = null;
}

let userDataPath;
try {
  userDataPath = (app && app.getPath) ? app.getPath('userData') : path.join(process.cwd());
} catch (error) {
  userDataPath = process.cwd();
}
const logDir = path.join(userDataPath, 'logs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'pld-buzon-scraper' },
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'buzon.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

module.exports = logger;
