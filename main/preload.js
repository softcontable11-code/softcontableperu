const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  buzonConsultar: (args) => ipcRenderer.invoke('buzon:consultar', args),
  buzonDescargarAdjunto: (args) => ipcRenderer.invoke('buzon:descargarAdjunto', args),
  buzonExtraerDetalle: (args) => ipcRenderer.invoke('buzon:extraerDetalle', args),
  buzonListarConstancias: (args) => ipcRenderer.invoke('buzon:listarConstancias', args),
  buzonAbrirConstancia: (args) => ipcRenderer.invoke('buzon:abrirConstancia', args),
  buzonCerrarTodas: () => ipcRenderer.invoke('buzon:cerrarTodas'),

  // --- Database API ---
  dbGetWorkspaces: () => ipcRenderer.invoke('db:getWorkspaces'),
  dbSaveWorkspace: (w) => ipcRenderer.invoke('db:saveWorkspace', w),
  dbDeleteWorkspace: (ruc) => ipcRenderer.invoke('db:deleteWorkspace', ruc),
  dbGetWorkspaceData: (ruc) => ipcRenderer.invoke('db:getWorkspaceData', ruc),
  dbExecute: (sql, params) => ipcRenderer.invoke('db:execute', sql, params),
  dbQuery: (sql, params) => ipcRenderer.invoke('db:query', sql, params),
  dbBackup: () => ipcRenderer.invoke('db:backup'),
  dbClearWorkspace: (ruc) => ipcRenderer.invoke('db:clearWorkspace', ruc),
  dbSaveBalanceInicial: (ruc, item) => ipcRenderer.invoke('db:saveBalanceInicial', ruc, item),
  dbDeleteBalanceInicial: (id) => ipcRenderer.invoke('db:deleteBalanceInicial', id),
  dbImportBackup: (data) => ipcRenderer.invoke('db:importBackup', data),

  // --- SIRE Bulk API ---
  sireSavePurchases: (ruc, records) => ipcRenderer.invoke('db:saveSirePurchases', ruc, records),
  sireSaveSales: (ruc, records) => ipcRenderer.invoke('db:saveSireSales', ruc, records),

  // --- Window Control ---
  winMinimize: () => ipcRenderer.send('window:minimize'),
  winMaximize: () => ipcRenderer.send('window:maximize'),
  winClose: () => ipcRenderer.send('window:close'),
  winIsMaximized: () => ipcRenderer.invoke('window:isMaximized'),

  // --- SIRE API ---
  ejecutarSire: (datos) => ipcRenderer.invoke('sire:ejecutar', datos),
  generarArchivoSire: (args) => ipcRenderer.invoke('sire:generar-archivo', args),
  listarArchivosSire: () => ipcRenderer.invoke('sire:listar-archivos'),
  abrirArchivoSire: (nombre) => ipcRenderer.invoke('sire:abrir-archivo', nombre),
  eliminarArchivoSire: (nombre) => ipcRenderer.invoke('sire:eliminar-archivo', nombre),

  // --- SIRE TXT Import (Motor Conciliación Fase 3) ---
  sireImportarTxt: () => ipcRenderer.invoke('sire:importar-txt'),

  // --- Kardex ACID (Fase 4) ---
  kardexSaveWithAutoEntry: (args) => ipcRenderer.invoke('kardex:save-with-auto-entry', args),

  // --- Analytics CCC (Fase 4) ---
  analyticsCCCMetrics: (ruc) => ipcRenderer.invoke('analytics:ccc-metrics', ruc)
});

