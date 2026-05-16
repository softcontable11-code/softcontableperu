/**
 * Inferencia PCGE — Motor de clasificación de gastos
 * Reimplementación en TypeScript del modelo NLP estricto (Python eliminado).
 * Clasifica gastos por CIIU del proveedor + excepciones NIC 2 / NIIF 16.
 */

import { UIT_2026, UMBRAL_ACTIVO_FIJO_NIIF16 } from '../constants/tributario';

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

export interface PCGEInferenceResult {
  cuentaPCGE: string;
  categoria: string;
  riesgoDesviacion: 'Bajo' | 'Medio' | 'Alto';
  reglaAplicada: string;
}

interface CIIUMapping {
  cuenta_base: string;
  categoria: string;
  riesgo_desviacion: 'Bajo' | 'Medio' | 'Alto';
}

// ═══════════════════════════════════════════════════════
// MATRIZ DETERMINÍSTICA CIIU → PCGE
// ═══════════════════════════════════════════════════════

const MATRIZ_CIIU_PCGE: Record<string, CIIUMapping> = {
  '4741': { cuenta_base: '6011', categoria: 'Mercaderías manufacturadas', riesgo_desviacion: 'Bajo' },
  '6920': { cuenta_base: '632',  categoria: 'Asesoría contable, legal y auditoría', riesgo_desviacion: 'Bajo' },
  '3510': { cuenta_base: '6361', categoria: 'Suministro de energía eléctrica', riesgo_desviacion: 'Bajo' },
  '6190': { cuenta_base: '6364', categoria: 'Servicios de telecomunicaciones', riesgo_desviacion: 'Bajo' },
  '7310': { cuenta_base: '637',  categoria: 'Publicidad, publicaciones y RRPP', riesgo_desviacion: 'Medio' },
  '4923': { cuenta_base: '6311', categoria: 'Transporte de carga por carretera', riesgo_desviacion: 'Alto' },
  '5610': { cuenta_base: '6032', categoria: 'Restaurantes y servicios de comida', riesgo_desviacion: 'Bajo' },
  '4520': { cuenta_base: '6343', categoria: 'Mantenimiento de vehículos', riesgo_desviacion: 'Bajo' },
  '4771': { cuenta_base: '6032', categoria: 'Venta minorista de vestido y calzado', riesgo_desviacion: 'Bajo' },
  '6810': { cuenta_base: '6352', categoria: 'Alquileres', riesgo_desviacion: 'Bajo' },
  '3600': { cuenta_base: '6361', categoria: 'Suministro de agua', riesgo_desviacion: 'Bajo' },
  '8010': { cuenta_base: '635',  categoria: 'Servicios de seguridad', riesgo_desviacion: 'Bajo' },
  '8121': { cuenta_base: '634',  categoria: 'Limpieza general de edificios', riesgo_desviacion: 'Bajo' },
  '8211': { cuenta_base: '632',  categoria: 'Servicios administrativos', riesgo_desviacion: 'Bajo' },
};

// ═══════════════════════════════════════════════════════
// PATRONES SEMÁNTICOS (NIC 2 / NIIF 16)
// ═══════════════════════════════════════════════════════

const PATRONES_FLETE = /\b(flete|transporte|despacho|acarreo|envio|envío|courier)\b/i;
const PATRONES_SEGURO = /\b(seguro|poliza|póliza|cobertura|prima)\b/i;
const PATRONES_ACTIVOS = /\b(laptop|servidor|computadora|computador|maquinaria|vehículo|vehiculo|escritorio|impresora|monitor|tablet|celular|aire acondicionado)\b/i;

// ═══════════════════════════════════════════════════════
// FUNCIÓN PRINCIPAL DE INFERENCIA
// ═══════════════════════════════════════════════════════

/**
 * Infiere la cuenta PCGE (Clase 6) para un gasto basándose en:
 * 1. CIIU del proveedor (mapeo directo)
 * 2. Excepciones NIC 2 (fletes → 6091, seguros → 651)
 * 3. Excepciones NIIF 16 (activos > 1/4 UIT → 336)
 * 4. Fallback → 659
 */
export function inferPCGEAccount(
  ciiuProveedor: string,
  descripcionLinea: string,
  montoOperacion: number
): PCGEInferenceResult {
  const texto = (descripcionLinea || '').toLowerCase().trim();
  let cuentaPCGE: string | null = null;
  let categoria = '';
  let riesgo: 'Bajo' | 'Medio' | 'Alto' = 'Bajo';
  let regla = '';

  // Paso 1: Mapeo CIIU directo
  const ciiu = MATRIZ_CIIU_PCGE[ciiuProveedor];
  if (ciiu) {
    cuentaPCGE = ciiu.cuenta_base;
    categoria = ciiu.categoria;
    riesgo = ciiu.riesgo_desviacion;
    regla = `CIIU ${ciiuProveedor} → ${ciiu.cuenta_base}`;
  }

  // Paso 2: Excepciones NIC 2 (tienen prioridad sobre CIIU)
  if (PATRONES_FLETE.test(texto)) {
    cuentaPCGE = '6091';
    categoria = 'Costos vinculados con compras - Flete';
    riesgo = 'Medio';
    regla = 'NIC 2: Flete/transporte → 6091';
  } else if (PATRONES_SEGURO.test(texto)) {
    cuentaPCGE = '651';
    categoria = 'Seguros';
    riesgo = 'Bajo';
    regla = 'NIC 2: Seguro/póliza → 651';
  }

  // Paso 3: Excepciones NIIF 16 (activos > 1/4 UIT = S/ 1,375)
  if (PATRONES_ACTIVOS.test(texto) && montoOperacion >= UMBRAL_ACTIVO_FIJO_NIIF16) {
    cuentaPCGE = '336';
    categoria = 'Equipos diversos (Activo Fijo - NIIF 16)';
    riesgo = 'Alto';
    regla = `NIIF 16: Activo inmovilizado > 1/4 UIT (S/ ${UMBRAL_ACTIVO_FIJO_NIIF16.toFixed(2)}) → 336`;
  }

  // Paso 4: Fallback
  if (!cuentaPCGE) {
    cuentaPCGE = '659';
    categoria = 'Otros gastos de gestión';
    riesgo = 'Medio';
    regla = 'Fallback: Sin match → 659';
  }

  return { cuentaPCGE, categoria, riesgoDesviacion: riesgo, reglaAplicada: regla };
}
