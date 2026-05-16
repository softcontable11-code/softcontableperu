let app, BrowserWindow, ipcMain;
try {
  const lib = 'electron';
  const electron = require(lib);
  app = electron.app;
  BrowserWindow = electron.BrowserWindow;
  ipcMain = electron.ipcMain;
} catch (e) {}
const path = require('path');
const buzonHandler = require('./buzonHandler');
const db = require('./database');
const sireHandler = require('../modulo/sireHandler');
const sireAjustesHandler = require('../modulo/sireAjustesHandler');
const fs = require('fs');

// --- Resolución de rutas compatible con desarrollo y producción (ASAR) ---
const isPackaged = app.isPackaged;
const appRoot = isPackaged ? path.join(process.resourcesPath, 'app.asar') : path.join(__dirname, '..');

function resolveAppPath(...segments) {
  return path.join(appRoot, ...segments);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    title: "SOFTCONTABLE",
    backgroundColor: '#0f111a',
    frame: false, // Oculta la barra nativa
    icon: resolveAppPath('public', 'assets', 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Content Security Policy — incluye font-src para Google Fonts
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://dniruc.apisperu.com https://*.sunat.gob.pe https://fonts.googleapis.com https://fonts.gstatic.com; frame-src 'self' https://*.sunat.gob.pe;"
        ]
      }
    });
  });

  // IPC Handlers for Buzon v2.0 — with input validation
  ipcMain.handle('buzon:consultar', async (event, args) => {
    if (!args || typeof args.ruc !== 'string' || typeof args.usuario !== 'string' || typeof args.clave !== 'string') {
      return { success: false, error: 'Parámetros inválidos para consulta de buzón.' };
    }
    if (!/^\d{11}$/.test(args.ruc)) {
      return { success: false, error: 'RUC inválido. Debe tener 11 dígitos.' };
    }
    return await buzonHandler.consultarBuzon({ 
      ruc: args.ruc, 
      usuario: args.usuario, 
      clave: args.clave,
      email: args.email || '',
      empresa: args.empresa || ''
    });
  });
  
  ipcMain.handle('buzon:descargarAdjunto', async (event, args) => {
    if (!args || typeof args.browserId !== 'string' || typeof args.mensajeId !== 'string') {
      return { success: false, error: 'Parámetros inválidos.' };
    }
    return await buzonHandler.descargarAdjunto(args);
  });

  ipcMain.handle('buzon:extraerDetalle', async (event, args) => {
    if (!args || typeof args.browserId !== 'string' || typeof args.mensajeId !== 'string') {
      return { success: false, error: 'Parámetros inválidos.' };
    }
    return await buzonHandler.extraerDetalleMensaje(args.browserId, args.mensajeId);
  });

  ipcMain.handle('buzon:listarConstancias', async (event, args) => {
    if (!args || typeof args.ruc !== 'string' || !/^\d{11}$/.test(args.ruc)) {
      return { success: false, error: 'RUC inválido.' };
    }
    return await buzonHandler.listarConstancias(args.ruc);
  });

  ipcMain.handle('buzon:abrirConstancia', async (event, args) => {
    if (!args || typeof args.ruta !== 'string') {
      return { success: false, error: 'Ruta inválida.' };
    }
    // Validate path is within download directory
    const safePath = path.resolve(args.ruta);
    const downloadBase = path.resolve(path.join(process.cwd(), 'descargas_buzon'));
    if (!safePath.startsWith(downloadBase)) {
      return { success: false, error: 'Acceso no autorizado a esa ruta.' };
    }
    return await buzonHandler.abrirConstancia(args.ruta);
  });

  ipcMain.handle('buzon:cerrarTodas', async () => {
    return await buzonHandler.cerrarTodasLasSesiones();
  });

  // --- Database Handlers ---
  ipcMain.handle('db:getWorkspaces', async () => db.getWorkspaces());
  ipcMain.handle('db:saveWorkspace', async (event, w) => db.saveWorkspace(w));
  ipcMain.handle('db:deleteWorkspace', async (event, ruc) => db.deleteWorkspace(ruc));
  ipcMain.handle('db:getWorkspaceData', async (event, ruc) => db.getWorkspaceData(ruc));
  ipcMain.handle('db:execute', async (event, sql, params) => db.run(sql, params));
  ipcMain.handle('db:query', async (event, sql, params) => db.queryAll(sql, params));
  ipcMain.handle('db:backup', async () => db.backup());
  ipcMain.handle('db:clearWorkspace', async (event, ruc) => db.clearWorkspace(ruc));
  ipcMain.handle('db:saveBalanceInicial', async (event, ruc, item) => db.saveBalanceInicial(ruc, item));
  ipcMain.handle('db:deleteBalanceInicial', async (event, id) => db.deleteBalanceInicial(id));
  ipcMain.handle('db:importBackup', async (event, data) => db.importBackup(data));
  ipcMain.handle('db:saveSirePurchases', async (event, ruc, records) => db.saveSirePurchases(ruc, records));
  ipcMain.handle('db:saveSireSales', async (event, ruc, records) => db.saveSireSales(ruc, records));

  // --- SIRE Handlers ---
  ipcMain.handle('sire:ejecutar', async (event, datos) => {
    return await sireHandler.ejecutarSire(datos);
  });

  ipcMain.handle('sire:generar-archivo', async (event, args) => {
    return await sireHandler.generarArchivoSireEnvio(args);
  });

  ipcMain.handle('sire:listar-archivos', async () => {
    const outputDir = path.join(process.cwd(), 'SIRE SUNAT');
    if (!fs.existsSync(outputDir)) return [];
    
    let allFiles = [];
    const walk = (dir) => {
      if (!fs.existsSync(dir)) return;
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          walk(fullPath);
        } else if (file.endsWith('.xlsx') || file.endsWith('.zip') || file.endsWith('.txt')) {
          const stats = fs.statSync(fullPath);
          allFiles.push({
            nombre: file,
            fecha: stats.mtime.toLocaleString('es-PE'),
            fullPath: fullPath,
            size: stats.size
          });
        }
      });
    };
    
    try {
      walk(outputDir);
      return allFiles.sort((a, b) => b.fecha.localeCompare(a.fecha));
    } catch (e) {
      return [];
    }
  });

  ipcMain.handle('sire:abrir-archivo', async (event, nombre) => {
    const outputDir = path.join(process.cwd(), 'SIRE SUNAT');
    // Basic search for the file in outputDir
    const findFile = (dir, target) => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          const found = findFile(fullPath, target);
          if (found) return found;
        } else if (file === target) {
          return fullPath;
        }
      }
      return null;
    };

    const filePath = findFile(outputDir, nombre);
    if (filePath) {
      const { exec } = require('child_process');
      exec(`start "" "${filePath}"`);
      return { success: true };
    }
    return { success: false, error: 'Archivo no encontrado' };
  });

  ipcMain.handle('sire:eliminar-archivo', async (event, nombre) => {
    const outputDir = path.join(process.cwd(), 'SIRE SUNAT');
    const findFile = (dir, target) => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          const found = findFile(fullPath, target);
          if (found) return found;
        } else if (file === target) {
          return fullPath;
        }
      }
      return null;
    };

    const filePath = findFile(outputDir, nombre);
    if (filePath) {
      fs.unlinkSync(filePath);
      
      // Si es un TXT, intentar borrar también el ZIP si existe
      if (nombre.endsWith('.txt')) {
        const zipPath = filePath.replace('.txt', '.zip');
        if (fs.existsSync(zipPath)) {
          fs.unlinkSync(zipPath);
        }
      }
      return { success: true };
    }
    return { success: false, error: 'Archivo no encontrado' };
  });


  // --- Window Control Handlers ---
  ipcMain.on('window:minimize', () => win.minimize());
  ipcMain.on('window:maximize', () => {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  });
  ipcMain.on('window:close', () => win.close());
  ipcMain.handle('window:isMaximized', () => win.isMaximized());

  // --- Initialize SIRE Ajustes ---
  sireAjustesHandler.registerHandlers();

  // --- SIRE TXT Import (Anexo 3/11) ---
  ipcMain.handle('sire:importar-txt', async () => {
    const lib = 'electron';
    const { dialog } = require(lib);
    const result = await dialog.showOpenDialog(win, {
      title: 'Importar Archivo SIRE (Anexo 3 o 11)',
      filters: [
        { name: 'Archivos de texto', extensions: ['txt', 'csv'] },
        { name: 'Todos los archivos', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: 'Operación cancelada' };
    }

    try {
      const content = fs.readFileSync(result.filePaths[0], 'utf-8');
      return { success: true, content, filename: path.basename(result.filePaths[0]) };
    } catch (err) {
      return { success: false, error: `Error al leer archivo: ${err.message}` };
    }
  });

  // --- Kardex: Auto-generación asiento 691/201 en salidas ---
  ipcMain.handle('kardex:save-with-auto-entry', async (event, args) => {
    const { movement, ruc } = args;
    try {
      const insertMov = db.run;
      const insertJ = db.run;
      
      // Transacción atómica: movimiento + asiento de costo de venta
      db.run(
        `INSERT OR REPLACE INTO inventory_movements 
        (id, workspace_id, product_id, fecha, tipo_operacion, tipo_doc, serie, numero,
         cantidad_in, costo_unit_in, total_in, cantidad_out, costo_unit_out, total_out,
         cantidad_saldo, costo_unit_saldo, total_saldo, reference_id)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [movement.id, ruc, movement.product_id, movement.fecha,
         movement.tipo_operacion, movement.tipo_doc, movement.serie, movement.numero,
         movement.cantidad_in, movement.costo_unit_in, movement.total_in,
         movement.cantidad_out, movement.costo_unit_out, movement.total_out,
         movement.cantidad_saldo, movement.costo_unit_saldo, movement.total_saldo,
         movement.reference_id]
      );

      // Si es salida por venta (operación '01'), auto-generar asiento 691/201
      if (movement.tipo_operacion === '01' && movement.total_out > 0) {
        const costoVenta = movement.total_out;
        const asientoId = `kardex-cv-${movement.id}`;
        const glosa = 'Centralización del kárdex - Costo de ventas Formato 13.1';
        
        // DEBE: 6911 (Costo de Ventas - Mercaderías)
        db.run(
          `INSERT OR REPLACE INTO journal (id, workspace_id, source, asiento, fecha, glosa, cta, desc, debe, haber)
           VALUES (?,?,?,?,?,?,?,?,?,?)`,
          [`${asientoId}-debe`, ruc, 'KARDEX', 'KARDEX-CV', movement.fecha,
           glosa, '6911', 'COSTO DE VENTAS - MERCADERÍAS', costoVenta, 0]
        );

        // HABER: 2011 (Mercaderías Manufacturadas)
        db.run(
          `INSERT OR REPLACE INTO journal (id, workspace_id, source, asiento, fecha, glosa, cta, desc, debe, haber)
           VALUES (?,?,?,?,?,?,?,?,?,?)`,
          [`${asientoId}-haber`, ruc, 'KARDEX', 'KARDEX-CV', movement.fecha,
           glosa, '2011', 'MERCADERÍAS MANUFACTURADAS', 0, costoVenta]
        );
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // --- CCC Dashboard: Métricas financieras ---
  ipcMain.handle('analytics:ccc-metrics', async (event, ruc) => {
    try {
      // DIO: Días de Inventario (Promedio Inventario / Costo de Ventas × 365)
      const invAvg = db.queryAll(
        `SELECT AVG(total_saldo) as avg_val FROM inventory_movements WHERE workspace_id = ?`, [ruc]
      );
      const costVentas = db.queryAll(
        `SELECT SUM(total_out) as sum_val FROM inventory_movements WHERE workspace_id = ? AND tipo_operacion = '01'`, [ruc]
      );
      
      // DSO: Días de Cuentas por Cobrar (Promedio CxC / Ventas × 365)
      const cxcAvg = db.queryAll(
        `SELECT AVG(debe) as avg_val FROM journal WHERE workspace_id = ? AND cta LIKE '121%' AND debe > 0`, [ruc]
      );
      const ventasCredito = db.queryAll(
        `SELECT SUM(bi) as sum_val FROM sales WHERE workspace_id = ?`, [ruc]
      );
      
      // DPO: Días de Cuentas por Pagar (Promedio CxP / Compras × 365)
      const cxpAvg = db.queryAll(
        `SELECT AVG(haber) as avg_val FROM journal WHERE workspace_id = ? AND cta LIKE '421%' AND haber > 0`, [ruc]
      );
      const compras = db.queryAll(
        `SELECT SUM(bi) as sum_val FROM purchases WHERE workspace_id = ?`, [ruc]
      );

      const mediaInv = (invAvg && invAvg[0] && invAvg[0].avg_val) || 0;
      const sumCostVentas = (costVentas && costVentas[0] && costVentas[0].sum_val) || 0;
      const mediaCxC = (cxcAvg && cxcAvg[0] && cxcAvg[0].avg_val) || 0;
      const sumVentasCredito = (ventasCredito && ventasCredito[0] && ventasCredito[0].sum_val) || 0;
      const mediaCxP = (cxpAvg && cxpAvg[0] && cxpAvg[0].avg_val) || 0;
      const sumCompras = (compras && compras[0] && compras[0].sum_val) || 0;

      const dio = sumCostVentas > 0 ? Math.round((mediaInv / sumCostVentas) * 365 * 10) / 10 : 0;
      const dso = sumVentasCredito > 0 ? Math.round((mediaCxC / sumVentasCredito) * 365 * 10) / 10 : 0;
      const dpo = sumCompras > 0 ? Math.round((mediaCxP / sumCompras) * 365 * 10) / 10 : 0;
      const ccc = Math.round((dio + dso - dpo) * 10) / 10;

      return { success: true, data: { dio, dso, dpo, ccc } };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    // Ruta correcta al index.html dentro del ASAR empaquetado
    const indexPath = resolveAppPath('dist', 'index.html');
    console.log('[MAIN] Cargando index.html desde:', indexPath);
    console.log('[MAIN] isPackaged:', isPackaged);
    console.log('[MAIN] appRoot:', appRoot);

    win.loadFile(indexPath).then(() => {
        console.log('[MAIN] index.html cargado con éxito.');
    }).catch((err) => {
        console.error('[MAIN] ERROR CRITICO al cargar index.html:', err);
        console.error('[MAIN] Ruta intentada:', indexPath);
    });
  }
  
  win.setMenu(null);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    process.exit(0); // Forzar la salida del proceso para cerrar el CMD
  }
});
