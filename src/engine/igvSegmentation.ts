/**
 * Segmentación IGV — Subcuentas PCGE 4011
 * 
 * Según el Tipo de Operación (Tabla 12 SUNAT), el crédito fiscal
 * se imputa a diferentes subcuentas del PCGE:
 * 
 * - 40111: Crédito fiscal pleno (destino exclusivo gravadas)
 * - 40112: Prorrata al cierre (destino común gravadas/no gravadas)
 * - 40113: Sin crédito fiscal (destino exclusivo no gravadas)
 */

/**
 * Regla A: Destino exclusivo operaciones gravadas → Crédito fiscal pleno
 * Códigos Tabla 12: 01, 05, 10, 11
 */
const DESTINO_GRAVADAS = new Set(['01', '05', '10', '11']);

/**
 * Regla B: Destino común (gravadas + no gravadas) → Prorrata al cierre
 * Códigos Tabla 12: 02, 06
 */
const DESTINO_COMUN = new Set(['02', '06']);

/**
 * Regla C: Destino exclusivo no gravadas → Anula crédito (gasto/costo)
 * Códigos Tabla 12: 03, 04
 */
const DESTINO_NO_GRAVADAS = new Set(['03', '04']);

export type IGVDestination = 'PLENO' | 'PRORRATA' | 'SIN_CREDITO';

export interface IGVSegmentResult {
  subcuenta: string;
  destination: IGVDestination;
  description: string;
}

/**
 * Determina la subcuenta PCGE 4011x para el IGV basándose en el
 * código de tipo de operación (Tabla 12 SUNAT).
 * 
 * @param tipOperCode - Código de tipo de operación (Tabla 12)
 * @returns Subcuenta PCGE y metadata de destino
 */
export function determineIGVSubcuenta(tipOperCode: string): IGVSegmentResult {
  const code = (tipOperCode || '01').trim();

  if (DESTINO_GRAVADAS.has(code)) {
    return {
      subcuenta: '40111',
      destination: 'PLENO',
      description: 'IGV - Crédito fiscal (Destino exclusivo gravadas)',
    };
  }

  if (DESTINO_COMUN.has(code)) {
    return {
      subcuenta: '40112',
      destination: 'PRORRATA',
      description: 'IGV - Prorrata (Destino común)',
    };
  }

  if (DESTINO_NO_GRAVADAS.has(code)) {
    return {
      subcuenta: '40113',
      destination: 'SIN_CREDITO',
      description: 'IGV - Sin crédito fiscal (Destino no gravadas)',
    };
  }

  // Default: crédito fiscal pleno para códigos no reconocidos
  return {
    subcuenta: '40111',
    destination: 'PLENO',
    description: 'IGV - Crédito fiscal (Default)',
  };
}

/**
 * Determina la subcuenta IGV para ventas.
 * En ventas, el IGV siempre se registra como débito fiscal en 40112.
 */
export function determineIGVVentasSubcuenta(): string {
  return '40112';
}
