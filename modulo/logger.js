const winston = require('winston');
const path = require('path');
const fs = require('fs');
let userDataPath;
try {
  userDataPath = process.cwd();
} catch (error) {
  userDataPath = '.';
}
const logDir = path.join(userDataPath, 'logs');

// Crear directorio de logs si no existe
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'automatizador-sunat' },
  transports: [
    // Archivo con rotación diaria
    new winston.transports.File({
      filename: path.join(logDir, 'automatizador.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    // Consola para desarrollo
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Función para redactar información sensible
logger.redactSensitive = (message, data = {}) => {
  const redactedData = { ...data };
  if (redactedData.clave) {
    redactedData.clave = '***REDACTED***';
  }
  if (redactedData.password) {
    redactedData.password = '***REDACTED***';
  }
  return logger.info(message, redactedData);
};

module.exports = logger;