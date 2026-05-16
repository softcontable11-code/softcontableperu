const path = require('path');

class PathResolver {
    constructor() {
        this.isPackaged = false;
        this.rootPath = process.env.RAILWAY_ENVIRONMENT ? process.cwd() : path.join(__dirname, '../..');
    }

    /**
     * Resuelve una ruta relativa al directorio de recursos
     * @param {string} relativePath - Ruta relativa (ej: 'data/CLIENTES.xlsx')
     * @returns {string} - Ruta absoluta
     */
    resolve(relativePath) {
        return path.join(this.rootPath, relativePath);
    }

    /**
     * Obtiene la ruta del directorio data/
     * @returns {string}
     */
    getDataPath() {
        return this.resolve('data');
    }

    /**
     * Obtiene la ruta del directorio login/
     * @returns {string}
     */
    getLoginPath() {
        return this.resolve('login');
    }

    /**
     * Obtiene la ruta del directorio descargas_cpe/
     * @returns {string}
     */
    getDescargasCPEPath() {
        return this.resolve('descargas_cpe');
    }

    /**
     * Obtiene la ruta del directorio descargas_buzon/
     * @returns {string}
     */
    getDescargasBuzonPath() {
        return this.resolve('descargas_buzon');
    }

    /**
     * Obtiene una ruta de archivo completa en data/
     * @param {string} filename - Nombre del archivo (ej: 'CLIENTES.xlsx')
     * @returns {string}
     */
    getDataFile(filename) {
        return path.join(this.getDataPath(), filename);
    }

    /**
     * Obtiene una ruta de archivo completa en login/
     * @param {string} filename - Nombre del archivo
     * @returns {string}
     */
    getLoginFile(filename) {
        return path.join(this.getLoginPath(), filename);
    }

    /**
     * Verifica si un archivo existe usando una ruta relativa
     * @param {string} relativePath
     * @returns {boolean}
     */
    exists(relativePath) {
        const fs = require('fs');
        const fullPath = this.resolve(relativePath);
        return fs.existsSync(fullPath);
    }

    /**
     * Información de debug
     * @returns {object}
     */
    getDebugInfo() {
        return {
            isPackaged: this.isPackaged,
            rootPath: this.rootPath,
            resourcesPath: process.resourcesPath,
            appPath: app.getAppPath(),
            dataPath: this.getDataPath(),
            loginPath: this.getLoginPath(),
            descargasCPEPath: this.getDescargasCPEPath(),
            descargasBuzonPath: this.getDescargasBuzonPath()
        };
    }
}

// Exportar instancia singleton
module.exports = new PathResolver();
