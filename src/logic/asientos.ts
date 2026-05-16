export interface EntryLine {
  id: number;
  cuenta: string;
  denominacion: string;
  debe: number;
  haber: number;
}

export interface AsientoHeader {
  periodo: string;
  moneda: 'SOLES' | 'DOLARES';
  tc: number;
  ruc: string;
  entidad: string;
  tipoDoc: string;
  serie: string;
  numero: string;
  fecha: string;
  glosa: string;
}

export const calculateTax = (base: number, type: string) => {
  const IGV_RATE = 0.18;
  switch (type) {
    case '01': // Factura
      return { igv: base * IGV_RATE, total: base * (1 + IGV_RATE) };
    case '03': // Boleta (usually inclusive)
      return { igv: (base / (1 + IGV_RATE)) * IGV_RATE, total: base };
    default:
      return { igv: 0, total: base };
  }
};
