const winston = require('winston');
const path = require('path');
const fs = require('fs');

// En entorno web/cloud, usamos el directorio actual para logs
const userDataPath = process.cwd();
const logDir = path.join(userDataPath, 'logs');

if (!fs.existsSync(logDir)) {
  try {
    fs.mkdirSync(logDir, { recursive: true });
  } catch (e) {
    console.error("No se pudo crear el directorio de logs:", e.message);
  }
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

console.log("[SYSTEM] >>> LOGGER WEB ACTIVADO (SIN ELECTRON) <<<");

module.exports = logger;
