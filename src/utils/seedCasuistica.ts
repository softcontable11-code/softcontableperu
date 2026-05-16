export interface GlosaHabitual {
  id: string;
  category?: string;
  glosa: string;
  lines: { cuenta: string, detalle: string }[];
}

export const SEED_GLOSAS: (Omit<GlosaHabitual, 'id'> & { category: string })[] = [
  // --- SECTOR COMERCIAL (CASOS REALES) ---
  {
    category: "COMERCIAL",
    glosa: "3.1. COMERCIAL: ANTICIPOS RECIBIDOS DE CLIENTES (A11)",
    lines: [
      { cuenta: "1041", detalle: "CUENTAS CORRIENTES OPERATIVAS" },
      { cuenta: "122", detalle: "ANTICIPOS DE CLIENTES" },
      { cuenta: "40111", detalle: "IGV - CUENTA PROPIA" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por el cobro del anticipo y emisión de factura" }
    ]
  },
  {
    category: "COMERCIAL",
    glosa: "3.2. COMERCIAL: ANTICIPOS A PROVEEDORES LOCALES (A12-A13)",
    lines: [
      { cuenta: "422", detalle: "ANTICIPOS A PROVEEDORES" },
      { cuenta: "40111", detalle: "IGV - CUENTA PROPIA" },
      { cuenta: "4212", detalle: "EMITIDAS (LIQ. ANTICIPO)" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por la recepción de la factura por anticipo" },
      { cuenta: "4212", detalle: "EMITIDAS (PAGO)" },
      { cuenta: "1041", detalle: "CUENTAS CORRIENTES OPERATIVAS" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por el pago del anticipo al proveedor" }
    ]
  },
  {
    category: "COMERCIAL",
    glosa: "4.1. COMERCIAL: DEVOLUCIÓN MERCADERÍA PROVEEDOR (A14-A15)",
    lines: [
      { cuenta: "4212", detalle: "EMITIDAS (NC REVERSIÓN)" },
      { cuenta: "40111", detalle: "IGV - CUENTA PROPIA" },
      { cuenta: "6011", detalle: "MERCADERÍAS MANUFACTURADAS" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por el reconocimiento de la Nota de Crédito" },
      { cuenta: "6111", detalle: "MERCADERÍAS MANUFACTURADAS" },
      { cuenta: "20111", detalle: "COSTO (EXTORNO ALMACÉN)" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por el extorno del ingreso al almacén" }
    ]
  },
  {
    category: "COMERCIAL",
    glosa: "4.2. COMERCIAL: DESCUENTOS PRONTO PAGO CONCEDIDOS (A16)",
    lines: [
      { cuenta: "1041", detalle: "CUENTAS CORRIENTES OPERATIVAS" },
      { cuenta: "675", detalle: "DESCUENTOS CONCEDIDOS PRONTO PAGO" },
      { cuenta: "40111", detalle: "IGV - CUENTA PROPIA (REVERSIÓN)" },
      { cuenta: "1212", detalle: "EMITIDAS EN CARTERA" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por el cobro con descuento financiero (Nota de Crédito)" }
    ]
  },
  {
    category: "COMERCIAL",
    glosa: "5.1. COMERCIAL: VENTA Y CANJE DE GIFT CARDS (A17-A18)",
    lines: [
      { cuenta: "1041", detalle: "CUENTAS CORRIENTES OPERATIVAS" },
      { cuenta: "122", detalle: "ANTICIPOS DE CLIENTES (GIFT CARDS)" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por la venta y cobro de la Gift Card (Pasivo)" },
      { cuenta: "122", detalle: "ANTICIPOS DE CLIENTES (CANJE)" },
      { cuenta: "40111", detalle: "IGV - CUENTA PROPIA" },
      { cuenta: "701", detalle: "MERCADERÍAS" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por el canje de la Gift Card y reconocimiento de ingreso" }
    ]
  },
  {
    category: "COMERCIAL",
    glosa: "5.2. COMERCIAL: ENTREGA DE MUESTRAS GRATIS (A19-A20)",
    lines: [
      { cuenta: "659", detalle: "OTROS GASTOS DE GESTIÓN (MUESTRAS)" },
      { cuenta: "6415", detalle: "IGV ASUMIDO (RETIRO BIENES)" },
      { cuenta: "20111", detalle: "COSTO (MERCADERÍA)" },
      { cuenta: "40111", detalle: "IGV - CUENTA PROPIA" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por el gasto de promoción y retiro de bienes" },
      { cuenta: "951", detalle: "GASTOS DE VENTAS" },
      { cuenta: "791", detalle: "CARGAS IMPUTABLES" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por el destino del gasto por promoción" }
    ]
  },
  {
    category: "COMERCIAL",
    glosa: "6.1. COMERCIAL: COBRANZA DUDOSA Y CASTIGO (A21-A22)",
    lines: [
      { cuenta: "6841", detalle: "ESTIMACIÓN CUENTAS COBRANZA DUDOSA" },
      { cuenta: "1911", detalle: "FACTURAS POR COBRAR" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por el reconocimiento de la provisión cobranza dudosa" },
      { cuenta: "1911", detalle: "FACTURAS POR COBRAR" },
      { cuenta: "1212", detalle: "EMITIDAS EN CARTERA" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por el castigo de la cuenta (Baja en libros)" }
    ]
  },
  {
    category: "COMERCIAL",
    glosa: "6.2. COMERCIAL: DESMEDRO CON ACTA NOTARIAL (A23-A25)",
    lines: [
      { cuenta: "6851", detalle: "DESVALORIZACIÓN DE MERCADERÍAS" },
      { cuenta: "2911", detalle: "MERCADERÍAS (DETERIORO)" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por el reconocimiento del deterioro (Desmedro)" },
      { cuenta: "941", detalle: "GASTOS ADMINISTRATIVOS" },
      { cuenta: "781", detalle: "CARGAS CUBIERTAS POR PROVISIONES" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por el destino del gasto por deterioro" },
      { cuenta: "2911", detalle: "MERCADERÍAS" },
      { cuenta: "20111", detalle: "COSTO (BAJA DESTRUC.)" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por la baja en libros de la mercadería destruida" }
    ]
  },
  {
    category: "COMERCIAL",
    glosa: "7. COMERCIAL: ALQUILER LOCAL - RETENCIÓN 5% (A26-A27)",
    lines: [
      { cuenta: "6351", detalle: "ALQUILER DE EDIFICACIONES" },
      { cuenta: "40172", detalle: "RETENCIONES 2DA CATEGORÍA" },
      { cuenta: "4699", detalle: "OTRAS CUENTAS POR PAGAR" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por la provisión del alquiler y retención 5%" },
      { cuenta: "951", detalle: "GASTOS DE VENTAS" },
      { cuenta: "791", detalle: "CARGAS IMPUTABLES" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por el destino del gasto de alquiler" }
    ]
  },
  {
    category: "COMERCIAL",
    glosa: "8. COMERCIAL: CIERRE CONTABLE INTEGRAL (A28-A30)",
    lines: [
      { cuenta: "6111", detalle: "VARIACIÓN DE INVENTARIOS" },
      { cuenta: "69121", detalle: "COSTO DE VENTAS (CIERRE)" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por la cancelación del costo de ventas" },
      { cuenta: "801", detalle: "MARGEN COMERCIAL" },
      { cuenta: "6011", detalle: "COMPRAS (CANCELACIÓN)" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por la determinación del margen comercial" },
      { cuenta: "70121", detalle: "VENTAS (CANCELACIÓN)" },
      { cuenta: "801", detalle: "MARGEN COMERCIAL (SALDO)" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por la cancelación de ventas al margen comercial" }
    ]
  },

  // --- SECTOR INDUSTRIAL ---
  {
    category: "INDUSTRIAL",
    glosa: "2.1. INDUSTRIAL: CONSUMO MATERIA PRIMA (A20-A21)",
    lines: [
      { cuenta: "6121", detalle: "VARIACIÓN DE INVENTARIOS" },
      { cuenta: "2411", detalle: "MATERIAS PRIMAS" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por el consumo de materia prima por naturaleza" },
      { cuenta: "90111", detalle: "MATERIA PRIMA - DPTO CORTE" },
      { cuenta: "791", detalle: "CARGAS IMPUTABLES" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por el destino al centro de costos productivo" }
    ]
  },
  {
    category: "INDUSTRIAL",
    glosa: "2.2. INDUSTRIAL: PLANILLA OPERARIOS MOD (A22-A23)",
    lines: [
      { cuenta: "6211", detalle: "SUELDOS Y SALARIOS" },
      { cuenta: "6271", detalle: "ESSALUD" },
      { cuenta: "4031", detalle: "ESSALUD" },
      { cuenta: "417", detalle: "AFP (RETENCIÓN)" },
      { cuenta: "4111", detalle: "SUELDOS POR PAGAR" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por el reconocimiento de la planilla por naturaleza" },
      { cuenta: "90211", detalle: "MOD - DPTO CORTE" },
      { cuenta: "791", detalle: "CARGAS IMPUTABLES" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por el destino de la mano de obra directa" }
    ]
  },
  {
    category: "INDUSTRIAL",
    glosa: "2.3. INDUSTRIAL: CIF Y DEPRECIACIÓN (A24-A25)",
    lines: [
      { cuenta: "6361", detalle: "ENERGÍA ELÉCTRICA" },
      { cuenta: "6814", detalle: "DEPRECIACIÓN PPE" },
      { cuenta: "40111", detalle: "IGV - CUENTA PROPIA" },
      { cuenta: "4212", detalle: "EMITIDAS" },
      { cuenta: "3952", detalle: "DEPRECIACIÓN MAQUINARIAS" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por el reconocimiento de depreciación y energía" },
      { cuenta: "90311", detalle: "CIF - ENERGÍA Y DEPREC." },
      { cuenta: "791", detalle: "CARGAS IMPUTABLES" },
      { cuenta: "781", detalle: "CARGAS DEDUCIBLES" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por el destino de los CIF" }
    ]
  },
  {
    category: "INDUSTRIAL",
    glosa: "2.4. INDUSTRIAL: LIQUIDACIÓN DE PRODUCCIÓN (A26)",
    lines: [
      { cuenta: "211", detalle: "PRODUCTOS MANUFACTURADOS" },
      { cuenta: "7111", detalle: "PRODUCTOS MANUFACTURADOS" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por la incorporación al inventario de productos terminados" }
    ]
  },

  // --- SECTOR CONSTRUCCIÓN ---
  {
    category: "CONSTRUCCIÓN",
    glosa: "3.1. CONSTRUCCIÓN: PLANILLA OBREROS CAPECO (A27-A28)",
    lines: [
      { cuenta: "6211", detalle: "JORNAL + DOMINICAL" },
      { cuenta: "6214", detalle: "BONIFICACIONES (BUC)" },
      { cuenta: "622", detalle: "MOVILIDAD (INAFECTA)" },
      { cuenta: "6271", detalle: "ESSALUD" },
      { cuenta: "4031", detalle: "ESSALUD" },
      { cuenta: "4032", detalle: "ONP (RETENCIÓN)" },
      { cuenta: "4699", detalle: "CONAFOVICER" },
      { cuenta: "4111", detalle: "SUELDOS POR PAGAR" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por el registro de la planilla semanal de obra" },
      { cuenta: "9021", detalle: "MOD - PROYECTO A" },
      { cuenta: "791", detalle: "CARGAS IMPUTABLES" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por el destino de la planilla de obra" }
    ]
  },
  {
    category: "CONSTRUCCIÓN",
    glosa: "3.2. CONSTRUCCIÓN: VALORIZACIÓN Y DETRACCIÓN (A29-A30)",
    lines: [
      { cuenta: "1212", detalle: "EMITIDAS EN CARTERA" },
      { cuenta: "40111", detalle: "IGV - CUENTA PROPIA" },
      { cuenta: "7032", detalle: "VALORIZACIONES DE OBRA" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por la emisión de la factura de valorización" },
      { cuenta: "1041", detalle: "CC OPERATIVAS (NETO)" },
      { cuenta: "1042", detalle: "CC FINES ESPECÍFICOS (BN)" },
      { cuenta: "1212", detalle: "COBRO VALORIZACIÓN" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por el cobro de valorización con detracción 4%" }
    ]
  },
  {
    category: "CONSTRUCCIÓN",
    glosa: "3.2. CONSTRUCCIÓN: APORTE SENCICO (A31)",
    lines: [
      { cuenta: "644", detalle: "OTROS GASTOS (SENCICO)" },
      { cuenta: "4039", detalle: "OTRAS INSTITUCIONES" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por la provisión del aporte a SENCICO (0.2%)" }
    ]
  },

  // --- SECTOR AGRÍCOLA ---
  {
    category: "AGRÍCOLA",
    glosa: "4.1. AGRÍCOLA: INVERSIÓN CULTIVOS (A32)",
    lines: [
      { cuenta: "3522", detalle: "ACTIVOS BIOLÓGICOS EN DESARROLLO" },
      { cuenta: "724", detalle: "PRODUCCIÓN ACTIVO INMOVILIZADO" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por la capitalización inicial del activo biológico" }
    ]
  },
  {
    category: "AGRÍCOLA",
    glosa: "4.2. AGRÍCOLA: VALOR RAZONABLE E IR DIFERIDO (A33-A34)",
    lines: [
      { cuenta: "3522", detalle: "ACTIVOS BIOLÓGICOS" },
      { cuenta: "7622", detalle: "GANANCIA VALOR RAZONABLE" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por el reconocimiento del incremento por NIC 41" },
      { cuenta: "882", detalle: "IMPUESTO A LA RENTA - DIFERIDO" },
      { cuenta: "4912", detalle: "IR DIFERIDO - PASIVO" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por el reconocimiento del impuesto a la renta diferido" }
    ]
  },
  {
    category: "AGRÍCOLA",
    glosa: "4.3. AGRÍCOLA: COSECHA Y PUNTO DE VENTA (A35-A36)",
    lines: [
      { cuenta: "213", detalle: "PRODUCTOS AGRÍCOLAS" },
      { cuenta: "7113", detalle: "PRODUCTOS AGRÍCOLAS" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por el traslado de activo biológico a producto agrícola" },
      { cuenta: "659", detalle: "OTROS GASTOS DE GESTIÓN" },
      { cuenta: "3522", detalle: "ACTIVOS BIOLÓGICOS" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por la baja del activo biológico" }
    ]
  },

  // --- SECTOR MINERO ---
  {
    category: "MINERO",
    glosa: "5.1. MINERO: EXPLORACIÓN Y AGOTAMIENTO (A37-A39)",
    lines: [
      { cuenta: "3411", detalle: "CONCESIONES MINERAS" },
      { cuenta: "723", detalle: "INTANGIBLES (CAPITALIZACIÓN)" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por el destino y capitalización de exploración" },
      { cuenta: "682", detalle: "AMORTIZACIÓN (AGOTAMIENTO)" },
      { cuenta: "392", detalle: "AMORTIZACIÓN ACUMULADA" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por el reconocimiento del agotamiento por naturaleza" },
      { cuenta: "9041", detalle: "COSTOS DE AGOTAMIENTO" },
      { cuenta: "781", detalle: "CARGAS CUBIERTAS" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por el destino del agotamiento al costo minero" }
    ]
  },
  {
    category: "MINERO",
    glosa: "5.3. MINERO: REGALÍA MINERA (A40)",
    lines: [
      { cuenta: "641", detalle: "IMPUESTO A LAS GANANCIAS" },
      { cuenta: "406", detalle: "GOBIERNOS LOCALES (CANON/REGALÍA)" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por la provisión de la regalía minera operativa" }
    ]
  },

  // --- SECTOR SERVICIOS ---
  {
    category: "SERVICIOS",
    glosa: "6.1. SERVICIOS: HONORARIOS 4TA CATEGORÍA (A41)",
    lines: [
      { cuenta: "632", detalle: "ASESORÍA Y CONSULTORÍA" },
      { cuenta: "4017", detalle: "RETENCIONES 4TA CATEGORÍA" },
      { cuenta: "424", detalle: "HONORARIOS POR PAGAR" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por la provisión del servicio y retención del 8%" }
    ]
  },
  {
    category: "SERVICIOS",
    glosa: "6.2. SERVICIOS: FACTURACIÓN Y DETRACCIÓN 12% (A42-A43)",
    lines: [
      { cuenta: "1212", detalle: "EMITIDAS EN CARTERA" },
      { cuenta: "40111", detalle: "IGV - CUENTA PROPIA" },
      { cuenta: "7041", detalle: "PRESTACIÓN DE SERVICIOS" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por la emisión de factura de servicios especializados" },
      { cuenta: "1041", detalle: "CC OPERATIVAS (NETO)" },
      { cuenta: "1042", detalle: "CC FINES ESPECÍFICOS (BN)" },
      { cuenta: "1212", detalle: "COBRO FACTURA" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por el cobro de factura y depósito detracción 12%" }
    ]
  },

  // --- SECTOR HOTELES Y RESTAURANTES ---
  {
    category: "HOTELES",
    glosa: "8.1. HOTELES: VENTA SERVICIOS IGV 10.5% (A47-A48)",
    lines: [
      { cuenta: "1212", detalle: "EMITIDAS EN CARTERA" },
      { cuenta: "40111", detalle: "IGV - CUENTA PROPIA (10.5%)" },
      { cuenta: "7041", detalle: "HOTELERÍA Y RESTAURANTES" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por el reconocimiento de la venta bajo tasa especial" },
      { cuenta: "1041", detalle: "CUENTAS CORRIENTES OPERATIVAS" },
      { cuenta: "1212", detalle: "COBRO SERVICIO" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por el cobro del servicio en efectivo/bancos" }
    ]
  },
  {
    category: "HOTELES",
    glosa: "8.2. HOTELES: MERMAS Y DESMEDROS (A49-A50)",
    lines: [
      { cuenta: "6851", detalle: "DESVALORIZACIÓN INVENTARIOS" },
      { cuenta: "2911", detalle: "MERCADERÍAS" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por el gasto por desmedro de existencias perecibles" },
      { cuenta: "941", detalle: "GASTOS ADMINISTRATIVOS" },
      { cuenta: "781", detalle: "CARGAS DEDUCIBLES" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por el destino del gasto por desmedro" }
    ]
  },

  // --- SECTOR INMOBILIARIO ---
  {
    category: "INMOBILIARIO",
    glosa: "9.1. INMOBILIARIO: VENTA DE DEPARTAMENTO (A51)",
    lines: [
      { cuenta: "1212", detalle: "EMITIDAS EN CARTERA" },
      { cuenta: "40111", detalle: "IGV - 18% (SOBRE 50% CONSTRUC)" },
      { cuenta: "7022", detalle: "PRODUCTOS INMUEBLES - TERRENO" },
      { cuenta: "7022", detalle: "PRODUCTOS INMUEBLES - CONSTRUC" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por la venta de inmueble (50% gravado / 50% inafecto)" }
    ]
  },
  {
    category: "INMOBILIARIO",
    glosa: "9.2. INMOBILIARIO: COSTO DE VENTAS (A52)",
    lines: [
      { cuenta: "6922", detalle: "PRODUCTOS INMUEBLES VENDIDOS" },
      { cuenta: "212", detalle: "PRODUCTOS INMUEBLES" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por el reconocimiento del costo de ventas inmobiliario" }
    ]
  },

  // --- SECTOR EXPORTACIÓN ---
  {
    category: "EXPORTACIÓN",
    glosa: "10.1. EXPORTACIÓN: FACTURACIÓN AL EXTERIOR (A53)",
    lines: [
      { cuenta: "1212", detalle: "FACTURA EXTERIOR (INVOICE)" },
      { cuenta: "7041", detalle: "EXPORTACIÓN DE SERVICIOS" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por la emisión del Invoice (Servicios inafectos)" }
    ]
  },
  {
    category: "EXPORTACIÓN",
    glosa: "10.2. EXPORTACIÓN: COBRO Y DIFERENCIA CAMBIO (A54)",
    lines: [
      { cuenta: "1041", detalle: "CUENTAS CORRIENTES" },
      { cuenta: "1212", detalle: "FACTURA EXTERIOR (COBRO)" },
      { cuenta: "776", detalle: "DIFERENCIA DE CAMBIO" },
      { cuenta: "GLOSA", detalle: "{FECHA} Por el cobro internacional y ganancia cambiaria" }
    ]
  }
];
