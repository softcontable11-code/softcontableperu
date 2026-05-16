let app;
try {
    if (!process.env.RAILWAY_ENVIRONMENT && !process.env.RAILWAY_STATIC_URL) {
        const lib = 'electron';
        app = require(lib).app;
    }
} catch (e) {
    app = null;
}

const path = require('path');

class PathResolver {
    constructor() {
        this.isPackaged = app && app.isPackaged !== undefined ? app.isPackaged : false;
        this.rootPath = this.isPackaged
            ? process.resourcesPath
            : (process.env.RAILWAY_ENVIRONMENT ? process.cwd() : path.join(__dirname, '..'));
    }

    resolve(relativePath) {
        return path.join(this.rootPath, relativePath);
    }

    getDescargasBuzonPath() {
        return this.resolve('descargas_buzon');
    }
}

module.exports = new PathResolver();
