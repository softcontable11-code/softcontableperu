const { contextBridge, ipcRenderer } = require('electron');

// Exponer API segura al renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Gestión de clientes
  getClients: (filePath) => ipcRenderer.invoke('get-clients', filePath),
  selectExcelFile: () => ipcRenderer.invoke('select-excel-file'),
  createExampleFile: (filePath) => ipcRenderer.invoke('create-example-file', filePath),

  // Gestión de logins
  startLogins: (data) => ipcRenderer.invoke('start-logins', data),
  stopAllSessions: () => ipcRenderer.invoke('stop-all-sessions'),
  getActiveSessions: () => ipcRenderer.invoke('get-active-sessions'),

  // Configuración
  getConfig: () => ipcRenderer.invoke('get-config'),

  // Módulo SIRE
  abrirExcelSire: () => ipcRenderer.invoke('abrir-excel-sire'),
  ejecutarSire: (datos) => ipcRenderer.invoke('ejecutar-sire', datos),
  listarArchivosSire: () => ipcRenderer.invoke('listar-archivos-sire'),
  abrirArchivoSire: (nombreArchivo) => ipcRenderer.invoke('abrir-archivo-sire', nombreArchivo),
  eliminarArchivoSire: (nombreArchivo) => ipcRenderer.invoke('eliminar-archivo-sire', nombreArchivo),

  // SIRE AJUSTES - Nueva funcionalidad
  abrirSireAjustes: () => ipcRenderer.invoke('abrir-sire-ajustes'),

  // Funciones específicas de SIRE AJUSTES
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  on: (channel, func) => ipcRenderer.on(channel, func),

  // BUZÓN ELECTRÓNICO
  buzonObtenerClientes: () => ipcRenderer.invoke('buzon:obtener-clientes'),
  buzonConsultar: (datos) => ipcRenderer.invoke('buzon:consultar', datos),
  buzonDescargarAdjunto: (datos) => ipcRenderer.invoke('buzon:descargar-adjunto', datos),
  buzonCerrarSesion: (datos) => ipcRenderer.invoke('buzon:cerrar-sesion', datos),
  buzonObtenerSesiones: () => ipcRenderer.invoke('buzon:obtener-sesiones'),
  buzonListarConstancias: (datos) => ipcRenderer.invoke('buzon:listar-constancias', datos),
  buzonAbrirConstancia: (datos) => ipcRenderer.invoke('buzon:abrir-constancia', datos),
  onBuzonProgreso: (callback) => ipcRenderer.on('buzon:progreso', callback),

  // CPE SCRAPING
  cpeConsultar: (datos) => ipcRenderer.invoke('cpe-scraping-consultar', datos),
  cpeDescargar: (datos) => {
    // Mapear tipo genérico a canal específico
    const map = {
      'pdf': 'cpe-scraping-descargar-pdf',
      'xml': 'cpe-scraping-descargar-xml',
      'cdr': 'cpe-scraping-descargar-cdr' // Nota: Si no existe en main, fallará, pero lo dejamos mapeado
    };
    const channel = map[datos.tipo.toLowerCase()];
    if (!channel) return Promise.reject(new Error('Tipo de descarga no válido'));
    return ipcRenderer.invoke(channel, datos);
  },

  // CPE EXCEL - Carga automática de Excel
  cpeCargarExcelCliente: (params) => ipcRenderer.invoke('cpe-cargar-excel-cliente', params),
  cpeLeerHojaExcel: (params) => ipcRenderer.invoke('cpe-leer-hoja-excel', params),
  cpeAbrirArchivoExcel: (params) => ipcRenderer.invoke('cpe-abrir-archivo-excel', params),
  cpeListarConstancias: (params) => ipcRenderer.invoke('cpe-listar-constancias', params),
  cpeVisualizarFacturas: (params) => ipcRenderer.invoke('cpe-visualizar-facturas', params),
  cpeEmitirFacturas: (params) => ipcRenderer.invoke('cpe-emitir-facturas', params),

  // Eventos del proceso principal
  onLoginStarted: (callback) => ipcRenderer.on('login-started', callback),
  onLoginCompleted: (callback) => ipcRenderer.on('login-completed', callback),
  onLoginProcessCompleted: (callback) => ipcRenderer.on('login-process-completed', callback),

  // Limpiar listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),

  // Sistema de autenticación integrado
  authLogin: (credentials) => ipcRenderer.invoke('auth:login', credentials),
  authRegister: (userData) => ipcRenderer.invoke('auth:register', userData),
  authLogout: () => ipcRenderer.invoke('auth:logout'),
  authGetRecentEmails: () => ipcRenderer.invoke('auth:get-recent-emails'),
  authCheckFlag: () => ipcRenderer.invoke('auth:check-flag'),

  // ========== EMAIL SERVICE ==========
  // Configurar credenciales de email
  emailConfigurar: ({ user, pass }) => ipcRenderer.invoke('email:configurar', { user, pass }),

  // Enviar email básico
  emailEnviar: ({ destinatario, asunto, mensaje, mensajeHTML }) =>
    ipcRenderer.invoke('email:enviar', { destinatario, asunto, mensaje, mensajeHTML }),

  // Enviar email con archivos adjuntos
  emailEnviarConAdjuntos: ({ destinatario, asunto, mensaje, archivos }) =>
    ipcRenderer.invoke('email:enviar-con-adjuntos', { destinatario, asunto, mensaje, archivos }),

  // Enviar alerta de facturas nuevas
  emailAlertaFacturas: ({ destinatario, cliente, cantidad }) =>
    ipcRenderer.invoke('email:alerta-facturas', { destinatario, cliente, cantidad }),

  // Enviar reporte de facturas procesadas
  emailReporteFacturas: ({ destinatario, facturas, archivos }) =>
    ipcRenderer.invoke('email:reporte-facturas', { destinatario, facturas, archivos }),

  // Enviar notificación de error
  emailNotificarError: ({ destinatario, error, contexto }) =>
    ipcRenderer.invoke('email:notificar-error', { destinatario, error, contexto }),

  // ========== EMAIL CONFIGURATION MANAGEMENT ==========
  // Obtener configuración actual de email
  getEmailConfig: () => ipcRenderer.invoke('email:get-config'),

  // Actualizar configuración de email
  updateEmailConfig: ({ user, pass }) => ipcRenderer.invoke('email:update-config', { user, pass }),

  // Probar configuración de email
  testEmailConfig: ({ user, pass }) => ipcRenderer.invoke('email:test-config', { user, pass }),

  // Recargar configuración de email
  reloadEmailConfig: () => ipcRenderer.invoke('email:reload-config'),

  // ========== WHATSAPP SERVICE ==========
  // Obtener estado de WhatsApp
  getWhatsAppStatus: () => ipcRenderer.invoke('whatsapp:get-status'),

  // Inicializar WhatsApp
  initializeWhatsApp: () => ipcRenderer.invoke('whatsapp:initialize'),

  // Obtener QR code
  getWhatsAppQR: () => ipcRenderer.invoke('whatsapp:get-qr'),

  // Enviar mensaje de WhatsApp
  sendWhatsAppMessage: ({ phone, message }) =>
    ipcRenderer.invoke('whatsapp:send-message', { phone, message }),

  // Enviar archivo por WhatsApp
  sendWhatsAppFile: ({ phone, filePath, caption }) =>
    ipcRenderer.invoke('whatsapp:send-file', { phone, filePath, caption }),

  // Cerrar sesión de WhatsApp
  logoutWhatsApp: () => ipcRenderer.invoke('whatsapp:logout'),

  // Enviar mensaje de prueba
  sendWhatsAppTest: () => ipcRenderer.invoke('whatsapp:send-test'),

  // Enviar lote de archivos por WhatsApp
  sendWhatsAppFileBatch: ({ envios, delayMs }) =>
    ipcRenderer.invoke('whatsapp:send-file-batch', { envios, delayMs }),

  // Event listeners para WhatsApp
  onWhatsAppQR: (callback) => ipcRenderer.on('whatsapp:qr', callback),
  onWhatsAppReady: (callback) => ipcRenderer.on('whatsapp:ready', callback),
  onWhatsAppDisconnected: (callback) => ipcRenderer.on('whatsapp:disconnected', callback),
  onWhatsAppAuthFailure: (callback) => ipcRenderer.on('whatsapp:auth-failure', callback),
  onWhatsAppStateChanged: (callback) => ipcRenderer.on('whatsapp:state-changed', callback),
  onWhatsAppError: (callback) => ipcRenderer.on('whatsapp:error', callback),
  onWhatsAppLoading: (callback) => ipcRenderer.on('whatsapp:loading', callback),
  onWhatsAppBatchProgress: (callback) => ipcRenderer.on('whatsapp:batch-progress', callback),

  // Limpiar sesión de WhatsApp (eliminar .wwebjs_auth)
  clearWhatsAppSession: () => ipcRenderer.invoke('whatsapp:clear-session'),

  // ========== ZOOM GLOBAL ==========
  // Listener para sincronizar zoom con webviews
  onZoomChanged: (callback) => ipcRenderer.on('zoom-changed', (event, zoomFactor) => callback(zoomFactor)),

  // ========== BOLETA CONFIG (Emisión Específica) ==========
  // Guardar configuración de boletas por cliente
  boletaConfigSave: ({ ruc, config }) => ipcRenderer.invoke('boleta-config:save', { ruc, config }),

  // Cargar configuración de boletas por cliente
  boletaConfigLoad: ({ ruc }) => ipcRenderer.invoke('boleta-config:load', { ruc }),

  // Listar todas las configuraciones guardadas
  boletaConfigList: () => ipcRenderer.invoke('boleta-config:list'),

  // Eliminar configuración de boletas
  boletaConfigDelete: ({ ruc }) => ipcRenderer.invoke('boleta-config:delete', { ruc })
});