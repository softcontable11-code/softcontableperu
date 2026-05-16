export const DOCUMENT_TYPES = [
  { id: "00", label: "Otros" },
  { id: "01", label: "Factura" },
  { id: "03", label: "Boleta de Venta" },
  { id: "04", label: "Liquidación de compra" },
  { id: "07", label: "Nota de crédito" },
  { id: "08", label: "Nota de débito" },
  { id: "10", label: "Recibo por Arrendamiento" },
  { id: "14", label: "Recibo Serv. Públicos" },
  { id: "50", label: "DUA - Importación" },
];

export interface Transaction {
  id: number;
  ruc: string;
  nombre: string;
  fecha: string;
  tipoDoc: string;
  serie: string;
  numero: string;
  cta: string;
  desc: string;
  debe: number;
  haber: number;
  glosa: string;
  asiento: string;
}

export const MOCK_DATOS: Transaction[] = [
  { id: 1, ruc: '20100200300', nombre: 'PROVEEDOR A', fecha: '2026-03-01', tipoDoc: '01', serie: 'F001', numero: '501', cta: '6011', desc: 'MERCADERIAS', debe: 1000, haber: 0, glosa: 'COMPRA DE MARZO', asiento: '26-0001' },
  { id: 2, ruc: '20100200300', nombre: 'PROVEEDOR A', fecha: '2026-03-01', tipoDoc: '01', serie: 'F001', numero: '501', cta: '4011', desc: 'IGV', debe: 180, haber: 0, glosa: 'COMPRA DE MARZO', asiento: '26-0001' },
  { id: 3, ruc: '20100200300', nombre: 'PROVEEDOR A', fecha: '2026-03-01', tipoDoc: '01', serie: 'F001', numero: '501', cta: '4212', desc: 'FACTURAS POR PAGAR', debe: 0, haber: 1180, glosa: 'COMPRA DE MARZO', asiento: '26-0001' },
];
