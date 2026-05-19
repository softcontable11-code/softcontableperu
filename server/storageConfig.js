const path = require('path');
const fs = require('fs');

// Obtener el directorio base de almacenamiento persistente
const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'database', 'pld_contable.db');
const storageBase = path.dirname(dbPath); // e.g. /data o /app/database

const isWeb = !!process.env.RAILWAY_ENVIRONMENT;

const sireDir = isWeb 
  ? path.join(storageBase, 'SIRE SUNAT')
  : path.join(process.cwd(), 'SIRE SUNAT');

const buzonDir = isWeb
  ? path.join(storageBase, 'descargas_buzon')
  : path.join(process.cwd(), 'descargas_buzon');

// Asegurar que existan los directorios
if (!fs.existsSync(sireDir)) {
  fs.mkdirSync(sireDir, { recursive: true });
}
if (!fs.existsSync(buzonDir)) {
  fs.mkdirSync(buzonDir, { recursive: true });
}

module.exports = {
  sireDir,
  buzonDir,
  isWeb
};
