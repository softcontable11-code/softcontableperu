const fs = require('fs');
const path = require('path');
let app, ipcMain;
try {
        const lib = 'electron';
        const electron = require(lib);
        app = electron.app;
        ipcMain = electron.ipcMain;
} catch (e) {}

// Base directory: inside the app's User Data or adjacent to executable
// User asked for a "flows" folder. We'll put it in the userData for reliability, 
// or if they want it portable, maybe alongside the executable?
// Let's stick to a safe appData location but exposing the path, 
// OR use the project root if in dev. 
// Let's us app.getPath('userData') + /flows/[RUC]/...

const FLOWS_DIR = path.join(app.getAppPath(), '..', 'flows'); // Try to verify if this is good for user
// Actually, let's use a safe path inside project root for now as they are on Windows and likely want to see it.
// Assuming development: process.cwd() / flows
// Assuming production: resources / ... or adjacent.

const getFlowsDir = (ruc) => {
    // Determine root based on environment
    const root = process.env.NODE_ENV === 'development' ? process.cwd() : path.dirname(app.getPath('exe'));
    const dir = path.join(root, 'flows', ruc);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
};

const setupFlowsHandlers = () => {
    ipcMain.handle('flows:save', async (_, { ruc, name, steps }) => {
        try {
            const dir = getFlowsDir(ruc);
            const safeName = name.replace(/[^a-z0-9áéíóúñ\s-_]/gi, '').trim();
            const filePath = path.join(dir, `${safeName}.json`);

            const flowData = {
                name: safeName,
                ruc,
                timestamp: new Date().toISOString(),
                steps
            };

            fs.writeFileSync(filePath, JSON.stringify(flowData, null, 2), 'utf-8');
            return { success: true, path: filePath };
        } catch (error) {
            console.error('Flow Save Error:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('flows:list', async (_, { ruc }) => {
        try {
            const dir = getFlowsDir(ruc);
            if (!fs.existsSync(dir)) return { success: true, flows: [] };

            const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
            const flows = files.map(f => {
                try {
                    const content = fs.readFileSync(path.join(dir, f), 'utf-8');
                    return JSON.parse(content);
                } catch (e) { return null; }
            }).filter(Boolean);

            return { success: true, flows };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('flows:delete', async (_, { ruc, name }) => {
        try {
            const dir = getFlowsDir(ruc);
            const safeName = name.replace(/[^a-z0-9áéíóúñ\s-_]/gi, '').trim();
            const filePath = path.join(dir, `${safeName}.json`);

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                return { success: true };
            }
            return { success: false, error: 'File not found' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // IMPORT JS SCRIPT (Puppeteer/Recorder)
    ipcMain.handle('flows:import-script', async (_, { filePath }) => {
        try {
            const boletaHandler = require('./boletaHandler'); // Lazy load to avoid circular deps if any
            const content = fs.readFileSync(filePath, 'utf-8');
            const steps = boletaHandler.parsePuppeteerScript(content);

            if (!steps || steps.length === 0) {
                return { success: false, error: 'No se encontraron pasos válidos en el script' };
            }
            return { success: true, steps };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
};

module.exports = { setupFlowsHandlers };
