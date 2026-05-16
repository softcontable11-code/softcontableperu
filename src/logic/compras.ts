

export interface CompraRecord {
  periodo: string; // From anio + Acod
  fecEmi: string;
  fecVto: string;
  tipoDoc: string;
  serie: string;
  numero: string;
  rucProv: string;
  nomProv: string;
  noGravado: number;
  subTotal: number;
  igv: number;
  total: number;
  detraccionFec: string;
  detraccionNum: string;
  tc: string;
  referenciaFec: string;
  referenciaTipo: string;
  referenciaSerie: string;
  referenciaNum: string;
}

export interface TotalesCompras {
  t01: number; // Subtotal Base 1
  t02: number; // IGV Base 1
  t03: number; // Subtotal Base 2
  t04: number; // IGV Base 2
  t05: number; // Subtotal Base 3
  t06: number; // IGV Base 3
  t07: number; // No Gravado
  t10: number; // Total
}

export const translateVBACompras = (records: any[]): { data: CompraRecord[], totals: TotalesCompras } => {
  const data: CompraRecord[] = [];
  const totals: TotalesCompras = { t01: 0, t02: 0, t03: 0, t04: 0, t05: 0, t06: 0, t07: 0, t10: 0 };

  records.forEach(row => {
    const subTotal = parseFloat(row.SUBTOT || 0);
    const igv = parseFloat(row.IGV || 0);
    const nograv = parseFloat(row.NOGRAV || 0);
    const total = parseFloat(row.TOTAL || 0);

    const record: CompraRecord = {
      periodo: `${String(row.anio).substring(2, 4)}-${String(row.Acod).padStart(4, '0')}`,
      fecEmi: row.FECEMI || '',
      fecVto: row.FECVTO || '',
      tipoDoc: String(row.TIPDOC || '').substring(0, 2),
      serie: row.SERDOC || '',
      numero: row.NUMDOC || '',
      rucProv: row.RUCPROV || '',
      nomProv: row.NOMPROV || '',
      noGravado: nograv,
      subTotal: 0, // Assigned in switch
      igv: 0,
      total: total,
      detraccionFec: row.FECDET || '',
      detraccionNum: row.NUMDET || '',
      tc: row.TCDOC || '',
      referenciaFec: row.drfec || '',
      referenciaTipo: row.drtip || '',
      referenciaSerie: row.drser || '',
      referenciaNum: row.drnum || '',
    };

    // Reflecting the "Select Case Rs.Fields!ATIPOPE" logic from VBA
    switch (Number(row.ATIPOPE)) {
      case 30:
        record.subTotal = subTotal;
        record.igv = igv;
        totals.t01 += subTotal;
        totals.t02 += igv;
        break;
      case 31:
        record.subTotal = subTotal;
        record.igv = igv;
        totals.t03 += subTotal;
        totals.t04 += igv;
        break;
      case 32:
        record.subTotal = subTotal;
        record.igv = igv;
        totals.t05 += subTotal;
        totals.t06 += igv;
        break;
    }

    totals.t07 += nograv;
    totals.t10 += total;
    data.push(record);
  });

  return { data, totals };
};
