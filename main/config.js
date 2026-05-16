module.exports = {
  PORTALES: {
    1: "https://e-menu.sunat.gob.pe/cl-ti-itmenu2/MenuInternetPlataforma.htm?exe=55.1.1.1.1", // Mis declaraciones y pagos
    2: "https://e-menu.sunat.gob.pe/cl-ti-itmenucabina/MenuInternet.htm", // Ventana Principal
    3: "https://e-menu.sunat.gob.pe/cl-ti-itmenu/MenuInternet.htm?pestana=*&agrupacion=*&exe=buzon", // Portal Buzón Directo
    4: "https://e-menu.sunat.gob.pe/cl-ti-itmenucabina/MenuInternet.htm" // Emitir Factura
  },
  PLAYWRIGHT: {
    headless: true, // Navegación oculta por solicitud del usuario
    timeout: 30000,
    concurrency: 3
  }
};
