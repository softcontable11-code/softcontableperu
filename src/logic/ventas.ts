export interface VentasRecord {
  periodo: string;
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
  tc: string;
  referenciaFec: string;
  referenciaTipo: string;
  referenciaSerie: string;
  referenciaNum: string;
}

export interface TotalesVentas {
  t01: number; // Exportacion / Base 1
  t02: number; // Base 2
  t03: number; // No Gravado 1
  t04: number; // No Gravado 2
  t06: number; // IGV
  t08: number; // Total
}

export const translateVBAVentas = (records: any[]): { data: VentasRecord[], totals: TotalesVentas } => {
  const data: VentasRecord[] = [];
  const totals: TotalesVentas = { t01: 0, t02: 0, t03: 0, t04: 0, t06: 0, t08: 0 };

  records.forEach(row => {
    const subTotal = parseFloat(row.SUBTOT || 0);
    const igv = parseFloat(row.IGV || 0);
    const nograv = parseFloat(row.NOGRAV || 0);
    const total = parseFloat(row.TOTAL || 0);

    const record: VentasRecord = {
      periodo: `${String(row.anio).substring(2, 4)}-${String(row.Acod).padStart(4, '0')}`,
      fecEmi: row.FECEMI || '',
      fecVto: row.FECVTO || '',
      tipoDoc: String(row.TIPDOC || '').substring(0, 2),
      serie: row.SERDOC || '',
      numero: row.NUMDOC || '',
      rucProv: row.RUCPROV || '',
      nomProv: row.NOMPROV || '',
      noGravado: 0,
      subTotal: 0,
      igv: igv,
      total: total,
      tc: row.TCDOC || '',
      referenciaFec: row.drfec || '',
      referenciaTipo: row.drtip || '',
      referenciaSerie: row.drser || '',
      referenciaNum: row.drnum || '',
    };

    switch (Number(row.ATIPOPE)) {
      case 20: 
        record.subTotal = subTotal;
        totals.t01 += subTotal;
        break;
      case 21:
        record.subTotal = subTotal;
        totals.t02 += subTotal;
        break;
      case 22:
        record.noGravado = nograv;
        totals.t03 += nograv;
        break;
      case 23:
        record.noGravado = nograv;
        totals.t04 += nograv;
        break;
    }

    totals.t06 += igv;
    totals.t08 += total;
    data.push(record);
  });

  return { data, totals };
};
