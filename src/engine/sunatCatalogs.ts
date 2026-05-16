/**
 * Catálogos SUNAT — Mapeo en RAM
 */

export const CATALOGO_01_CPE = new Map<string, string>([
  ['00', 'Otros'], ['01', 'Factura'], ['02', 'Recibo por Honorarios'],
  ['03', 'Boleta de Venta'], ['04', 'Liquidación de Compra'],
  ['07', 'Nota de Crédito'], ['08', 'Nota de Débito'],
  ['12', 'Ticket Máquina Registradora'], ['14', 'Recibo Servicios Públicos'],
  ['50', 'DUA - Importación'], ['52', 'DUA - Exportación'],
  ['91', 'Comprobante de No Domiciliado'],
]);

export const CATALOGO_06_IDENTIDAD = new Map<string, { label: string; length: number }>([
  ['0', { label: 'Otros', length: 15 }],
  ['1', { label: 'DNI', length: 8 }],
  ['4', { label: 'Carnet de Extranjería', length: 12 }],
  ['6', { label: 'RUC', length: 11 }],
  ['7', { label: 'Pasaporte', length: 12 }],
  ['A', { label: 'Cédula Diplomática', length: 15 }],
]);

export const CATALOGO_07_AFECTACION_IGV = new Map<string, { label: string; gravada: boolean; igvRate: number }>([
  ['10', { label: 'Gravado - Operación Onerosa', gravada: true, igvRate: 0.18 }],
  ['20', { label: 'Exonerado', gravada: false, igvRate: 0 }],
  ['30', { label: 'Inafecto', gravada: false, igvRate: 0 }],
  ['40', { label: 'Exportación', gravada: false, igvRate: 0 }],
]);

export const CATALOGO_12_OPERACIONES = new Map<string, { label: string; esEntrada: boolean }>([
  ['01', { label: 'Venta', esEntrada: false }],
  ['02', { label: 'Compra', esEntrada: true }],
  ['05', { label: 'Devolución Recibida', esEntrada: true }],
  ['06', { label: 'Devolución Entregada', esEntrada: false }],
  ['13', { label: 'Mermas', esEntrada: false }],
  ['14', { label: 'Desmedros', esEntrada: false }],
  ['16', { label: 'Saldo Inicial', esEntrada: true }],
  ['99', { label: 'Otros', esEntrada: true }],
]);

export function getCPELabel(code: string): string {
  return CATALOGO_01_CPE.get(code) || `Documento (${code})`;
}

export function isOperationTaxable(afectacionCode: string): boolean {
  return CATALOGO_07_AFECTACION_IGV.get(afectacionCode)?.gravada ?? false;
}
