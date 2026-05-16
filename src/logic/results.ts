export interface HHTTRecord {
  cta: string;
  description: string;
  debe: number;
  haber: number;
  deudor: number;
  acreedor: number;
  inventarioActivo: number;
  inventarioPasivo: number;
  naturalezaPérdida: number;
  naturalezaGanancia: number;
  funciónPérdida: number;
  funciónGanancia: number;
}

export const processHHTT = (records: any[]): HHTTRecord[] => {
  // Simple logic to group by account and calculate sums
  const map = new Map<string, { debe: number, haber: number, desc: string, type: number }>();

  records.forEach(r => {
    const cta = String(r.DCTA2 || r.DCTA5).substring(0, 2);
    const curr = map.get(cta) || { debe: 0, haber: 0, desc: r.DESCRIPCION || '', type: r.TCTA || 1 };
    curr.debe += parseFloat(r.DEBE || 0);
    curr.haber += parseFloat(r.HABER || 0);
    map.set(cta, curr);
  });

  return Array.from(map.entries()).map(([cta, val]) => {
    const deudor = val.debe > val.haber ? val.debe - val.haber : 0;
    const acreedor = val.haber > val.debe ? val.haber - val.debe : 0;

    const record: HHTTRecord = {
      cta,
      description: val.desc,
      debe: val.debe,
      haber: val.haber,
      deudor,
      acreedor,
      inventarioActivo: 0,
      inventarioPasivo: 0,
      naturalezaPérdida: 0,
      naturalezaGanancia: 0,
      funciónPérdida: 0,
      funciónGanancia: 0,
    };

    // simplified logic based on TCTA (val.type)
    if (val.type === 1) { // Balance
       record.inventarioActivo = deudor;
       record.inventarioPasivo = acreedor;
    } else if (val.type === 2) { // Naturaleza
       record.naturalezaPérdida = deudor;
       record.naturalezaGanancia = acreedor;
    } else if (val.type === 3) { // Función
       record.funciónPérdida = deudor;
       record.funciónGanancia = acreedor;
    }

    return record;
  });
};
