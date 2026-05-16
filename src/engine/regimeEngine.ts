/**
 * Motor de Reglas Tributario — SOFTCONTABLE 2026
 * Clasificación de contribuyente y alertas preventivas
 * basado en PCGE, NIIF y normativas MEF.
 */

import fiscalConfig from './fiscal_config_2026.json';

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

export type RegimeCode = 'NRUS' | 'RER' | 'RMT' | 'RG';

export interface CompanyFinancials {
  annualRevenue: number;
  monthlyRevenue: number;
  annualPurchases: number;
  monthlyPurchases: number;
  fixedAssetsValue: number;
  employeeCount: number;
  ciiuCode: string;
  /** Ingresos conjuntos con empresas vinculadas (para RMT) */
  linkedCompaniesRevenue?: number;
  /** Impuesto del ejercicio anterior (para coeficiente) */
  previousYearTax?: number;
  /** Ingresos del ejercicio anterior */
  previousYearRevenue?: number;
  /** Utilidad neta del ejercicio */
  netIncome?: number;
}

export interface RegimeAlert {
  level: 'INFO' | 'WARNING' | 'CRITICAL';
  code: string;
  message: string;
  recommendation?: string;
}

export interface RegimeEvaluation {
  currentRegime: RegimeCode;
  isEligible: boolean;
  alerts: RegimeAlert[];
  requiredBooks: string[];
  monthlyTaxRate: number | null;
  monthlyQuota: number | null;
  annualTaxRate: number;
}

// ═══════════════════════════════════════════════════════
// CONSTANTS FROM CONFIG
// ═══════════════════════════════════════════════════════

const UIT = fiscalConfig.fiscal_year_config.global_parameters.uit_official_value;
const config = fiscalConfig.regime_decision_tree;

// ═══════════════════════════════════════════════════════
// REGIME RULE ENGINE
// ═══════════════════════════════════════════════════════

/**
 * Evalúa la elegibilidad del contribuyente en su régimen actual
 * y emite alertas preventivas si está próximo a exceder umbrales.
 */
export function evaluateRegime(
  regime: RegimeCode,
  financials: CompanyFinancials
): RegimeEvaluation {
  const alerts: RegimeAlert[] = [];
  let isEligible = true;

  switch (regime) {
    case 'NRUS':
      isEligible = evaluateNRUS(financials, alerts);
      break;
    case 'RER':
      isEligible = evaluateRER(financials, alerts);
      break;
    case 'RMT':
      isEligible = evaluateRMT(financials, alerts);
      break;
    case 'RG':
      // RG no tiene restricciones de elegibilidad
      break;
  }

  return {
    currentRegime: regime,
    isEligible,
    alerts,
    requiredBooks: getRequiredBooks(regime, financials.annualRevenue),
    monthlyTaxRate: calculateMonthlyTaxRate(regime, financials),
    monthlyQuota: regime === 'NRUS' ? calculateNRUSQuota(financials.monthlyRevenue) : null,
    annualTaxRate: calculateAnnualTaxRate(regime, financials),
  };
}

// ─── NRUS ─────────────────────────────────────────────

function evaluateNRUS(f: CompanyFinancials, alerts: RegimeAlert[]): boolean {
  const rules = config.NRUS.eligibility_conditions;
  let eligible = true;

  // Check revenue limits
  if (f.annualRevenue > rules.max_annual_revenue) {
    alerts.push({
      level: 'CRITICAL',
      code: 'NRUS_REVENUE_EXCEEDED',
      message: `Ingresos anuales (S/ ${f.annualRevenue.toLocaleString()}) superan el límite de S/ ${rules.max_annual_revenue.toLocaleString()}.`,
      recommendation: 'Debe migrar al RER o RMT antes del cierre del periodo.',
    });
    eligible = false;
  } else if (f.annualRevenue > rules.max_annual_revenue * 0.85) {
    alerts.push({
      level: 'WARNING',
      code: 'NRUS_REVENUE_WARNING',
      message: `Ingresos anuales al 85% del límite NRUS (S/ ${f.annualRevenue.toLocaleString()} / S/ ${rules.max_annual_revenue.toLocaleString()}).`,
      recommendation: 'Evalúe la migración preventiva al RER.',
    });
  }

  if (f.monthlyRevenue > rules.max_monthly_revenue) {
    alerts.push({
      level: 'CRITICAL',
      code: 'NRUS_MONTHLY_EXCEEDED',
      message: `Ingresos mensuales (S/ ${f.monthlyRevenue.toLocaleString()}) superan S/ ${rules.max_monthly_revenue.toLocaleString()}.`,
      recommendation: 'Se activa obligación de cambio de régimen.',
    });
    eligible = false;
  }

  // Check purchase limits
  if (f.annualPurchases > rules.max_annual_purchases) {
    alerts.push({
      level: 'CRITICAL',
      code: 'NRUS_PURCHASES_EXCEEDED',
      message: `Compras anuales exceden el límite NRUS de S/ ${rules.max_annual_purchases.toLocaleString()}.`,
    });
    eligible = false;
  }

  // Check disallowed CIIU
  if (rules.disallowed_ciiu_codes.includes(f.ciiuCode)) {
    alerts.push({
      level: 'CRITICAL',
      code: 'NRUS_CIIU_EXCLUDED',
      message: `La actividad económica CIIU ${f.ciiuCode} está excluida del NRUS.`,
      recommendation: 'Debe operar bajo RER, RMT o RG.',
    });
    eligible = false;
  }

  return eligible;
}

// ─── RER ──────────────────────────────────────────────

function evaluateRER(f: CompanyFinancials, alerts: RegimeAlert[]): boolean {
  const rules = config.RER.eligibility_conditions;
  let eligible = true;

  if (f.annualRevenue > rules.max_annual_revenue) {
    alerts.push({
      level: 'CRITICAL',
      code: 'RER_REVENUE_EXCEEDED',
      message: `Ingresos anuales (S/ ${f.annualRevenue.toLocaleString()}) superan el límite RER de S/ ${rules.max_annual_revenue.toLocaleString()}.`,
      recommendation: 'Debe migrar al RMT o RG.',
    });
    eligible = false;
  } else if (f.annualRevenue > rules.max_annual_revenue * 0.80) {
    alerts.push({
      level: 'WARNING',
      code: 'RER_REVENUE_WARNING',
      message: `Ingresos anuales al 80% del límite RER.`,
    });
  }

  if (f.fixedAssetsValue > rules.max_fixed_assets_value) {
    alerts.push({
      level: 'CRITICAL',
      code: 'RER_ASSETS_EXCEEDED',
      message: `Activos fijos (S/ ${f.fixedAssetsValue.toLocaleString()}) superan el límite de S/ ${rules.max_fixed_assets_value.toLocaleString()}.`,
    });
    eligible = false;
  }

  if (f.employeeCount > rules.max_employees_per_shift) {
    alerts.push({
      level: 'CRITICAL',
      code: 'RER_EMPLOYEES_EXCEEDED',
      message: `Número de trabajadores (${f.employeeCount}) supera el máximo de ${rules.max_employees_per_shift} por turno.`,
    });
    eligible = false;
  }

  if (rules.disallowed_ciiu_codes.includes(f.ciiuCode)) {
    alerts.push({
      level: 'CRITICAL',
      code: 'RER_CIIU_EXCLUDED',
      message: `CIIU ${f.ciiuCode} excluido del RER (construcción, ingeniería, notarías, salud).`,
    });
    eligible = false;
  }

  return eligible;
}

// ─── RMT ──────────────────────────────────────────────

function evaluateRMT(f: CompanyFinancials, alerts: RegimeAlert[]): boolean {
  const rules = config.RMT.eligibility_conditions;
  const maxRevenue = rules.max_annual_revenue_uit * UIT;
  let eligible = true;

  if (f.annualRevenue > maxRevenue) {
    alerts.push({
      level: 'CRITICAL',
      code: 'RMT_REVENUE_EXCEEDED',
      message: `Ingresos anuales superan ${rules.max_annual_revenue_uit} UIT (S/ ${maxRevenue.toLocaleString()}).`,
      recommendation: 'Debe migrar al Régimen General.',
    });
    eligible = false;
  } else if (f.annualRevenue > maxRevenue * 0.90) {
    alerts.push({
      level: 'WARNING',
      code: 'RMT_REVENUE_WARNING',
      message: `Ingresos anuales al 90% del límite RMT (${rules.max_annual_revenue_uit} UIT).`,
    });
  }

  // Check corporate linkage
  const linkedLimit = rules.corporate_linkage_revenue_limit_uit * UIT;
  if (f.linkedCompaniesRevenue && f.linkedCompaniesRevenue > linkedLimit) {
    alerts.push({
      level: 'CRITICAL',
      code: 'RMT_LINKAGE_EXCEEDED',
      message: `Ingresos conjuntos con empresas vinculadas superan ${rules.corporate_linkage_revenue_limit_uit} UIT.`,
      recommendation: 'Restricción de vinculación RG. Debe migrar al RG.',
    });
    eligible = false;
  }

  return eligible;
}

// ═══════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════

/**
 * Calcula la cuota mensual fija del NRUS.
 */
export function calculateNRUSQuota(monthlyRevenue: number): number {
  if (monthlyRevenue <= 5000) return 20;
  if (monthlyRevenue <= 8000) return 50;
  return -1; // Señal de que debe cambiar de régimen
}

/**
 * Retorna la tasa mensual de IR según régimen.
 */
export function calculateMonthlyTaxRate(
  regime: RegimeCode,
  f: CompanyFinancials
): number | null {
  switch (regime) {
    case 'NRUS':
      return null; // Cuota fija, no tasa
    case 'RER':
      return config.RER.system_outputs.income_tax_monthly_rate;
    case 'RMT': {
      const revenueUIT = f.annualRevenue / UIT;
      if (revenueUIT <= 300) return 0.01;
      // Coeficiente dinámico
      if (f.previousYearTax && f.previousYearRevenue && f.previousYearRevenue > 0) {
        return f.previousYearTax / f.previousYearRevenue;
      }
      return 0.01; // Fallback
    }
    case 'RG': {
      // max(1.5%, coeficiente)
      if (f.previousYearTax && f.previousYearRevenue && f.previousYearRevenue > 0) {
        const coef = f.previousYearTax / f.previousYearRevenue;
        return Math.max(0.015, coef);
      }
      return 0.015;
    }
    default:
      return null;
  }
}

/**
 * Calcula la tasa anual de IR.
 */
export function calculateAnnualTaxRate(
  regime: RegimeCode,
  f: CompanyFinancials
): number {
  const rates = fiscalConfig.fiscal_year_config.global_parameters.corporate_income_tax_rates;

  switch (regime) {
    case 'NRUS':
      return 0; // Cuota fija
    case 'RER':
      return 0.015 * 12; // Aproximación anualizada
    case 'RMT': {
      const netIncomeUIT = (f.netIncome || 0) / UIT;
      if (netIncomeUIT <= rates.rmt_tier_1_max_uit) return rates.rmt_tier_1_rate;
      return rates.rmt_tier_2_rate;
    }
    case 'RG':
      return rates.rg_flat_rate;
    default:
      return rates.rg_flat_rate;
  }
}

/**
 * Determina los libros contables obligatorios según régimen y nivel de ingresos.
 */
export function getRequiredBooks(regime: RegimeCode, annualRevenue: number): string[] {
  const revenueUIT = annualRevenue / UIT;

  switch (regime) {
    case 'NRUS':
      return []; // Sin libros

    case 'RER':
      return ['RVIE', 'RCE'];

    case 'RMT': {
      const matrix = config.RMT.system_outputs.dynamic_books_matrix;
      if (revenueUIT <= 300) return matrix.under_300_uit;
      if (revenueUIT <= 500) return matrix.under_500_uit;
      return matrix.under_1700_uit;
    }

    case 'RG': {
      const matrix = config.RG.system_outputs.dynamic_books_matrix;
      if (revenueUIT <= 300) return matrix.under_300_uit;
      if (revenueUIT <= 500) return matrix.under_500_uit;
      if (revenueUIT <= 1700) return matrix.under_1700_uit;
      return matrix.above_1700_uit;
    }

    default:
      return [];
  }
}
