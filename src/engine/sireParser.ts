/**
 * SIRE Parser — Ingesta de Anexos 3 y 11 (archivos TXT delimitados por |)
 * Valida longitudes exactas de campos clave (RUC=11, CAR=27).
 */

import sireConfig from './sire_ingestion_config.json';

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

export interface SireRecord {
  ruc_emisor: string;
  codigo_car: string;
  tipo_comprobante: string;
  serie: string;
  numero: string;
  fecha_emision: string;
  base_imponible: number;
  igv: number;
  importe_total: number;
  estado_cpe: string;
  /** Línea original para trazabilidad */
  raw_line_number: number;
  /** Errores de validación detectados */
  validation_errors: string[];
}

export interface SireParseResult {
  records: SireRecord[];
  totalLines: number;
  validRecords: number;
  errorRecords: number;
  errors: { line: number; message: string }[];
}

// ═══════════════════════════════════════════════════════
// PARSER
// ═══════════════════════════════════════════════════════

const DELIMITER = sireConfig.sire_ingestion_pipeline.delimiter_char;
const BATCH_SIZE = sireConfig.sire_ingestion_pipeline.batch_processing_size;

/**
 * Parsea un archivo TXT del SIRE (Anexo 3 RVIE o Anexo 11 RCE).
 * @param content Contenido completo del archivo TXT
 * @returns Resultado del parseo con registros y errores
 */
export function parseSireTxt(content: string): SireParseResult {
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  const records: SireRecord[] = [];
  const errors: { line: number; message: string }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const line = lines[i].trim();

    // Saltar líneas de cabecera si las hubiera
    if (line.startsWith('#') || line.startsWith('//')) continue;

    const fields = line.split(DELIMITER);

    // Mínimo de campos esperados
    if (fields.length < 25) {
      errors.push({ line: lineNumber, message: `Campos insuficientes: ${fields.length}/25+` });
      continue;
    }

    const validationErrors: string[] = [];

    // ─── Extraer campos clave ───
    const ruc = (fields[0] || '').trim();
    const car = (fields[3] || '').trim();
    const tipoComp = (fields[6] || '').trim();
    const serie = (fields[7] || '').trim();
    const numero = (fields[8] || '').trim();
    const fechaEmision = (fields[5] || '').trim();
    const estadoCPE = (fields[fields.length - 1] || '').trim();

    // ─── Validar longitudes ───
    if (ruc.length !== 11) {
      validationErrors.push(`RUC inválido: "${ruc}" (${ruc.length} chars, esperado 11)`);
    }
    if (car.length !== 27 && car.length > 0) {
      validationErrors.push(`CAR inválido: "${car}" (${car.length} chars, esperado 27)`);
    }
    if (tipoComp.length > 2) {
      validationErrors.push(`Tipo comprobante inválido: "${tipoComp}"`);
    }

    // ─── Parsear campos monetarios ───
    const bi = parseDecimal(fields[13]);
    const igv = parseDecimal(fields[15]);
    const total = parseDecimal(fields[23]);

    records.push({
      ruc_emisor: ruc,
      codigo_car: car,
      tipo_comprobante: tipoComp.padStart(2, '0'),
      serie,
      numero,
      fecha_emision: fechaEmision,
      base_imponible: bi,
      igv,
      importe_total: total,
      estado_cpe: estadoCPE,
      raw_line_number: lineNumber,
      validation_errors: validationErrors,
    });

    if (validationErrors.length > 0) {
      errors.push({ line: lineNumber, message: validationErrors.join('; ') });
    }
  }

  return {
    records,
    totalLines: lines.length,
    validRecords: records.filter(r => r.validation_errors.length === 0).length,
    errorRecords: records.filter(r => r.validation_errors.length > 0).length,
    errors,
  };
}

function parseDecimal(value: string | undefined): number {
  if (!value) return 0;
  const cleaned = value.trim().replace(/,/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}
