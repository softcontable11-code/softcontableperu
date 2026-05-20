import type { CompanyData } from '../store';

/**
 * Determina si un módulo/pestaña contable debe estar habilitado según las normas de SUNAT.
 * 
 * @param tabId Identificador de la pestaña/módulo
 * @param company Datos de la empresa activa
 */
export function isTabEnabled(tabId: string, company: CompanyData): boolean {
  if (!company) return true;

  const regimen = company.regimenTributario || 'RG';
  const sector = company.businessType || 'COMERCIAL';
  const ingresos = Number(company.annualIncomeUIT || 0);

  // 1. Módulos que NUNCA se deshabilitan (Transversales / No contables de SUNAT)
  const alwaysEnabled = [
    'EMPRESA',       // Panel Principal
    'CLIENTES',      // Mis Empresas
    'CLI_PRO',       // Directorio
    'PLAN',          // Plan Contable
    'DATOS',         // Tablas Generales
    'MANTENIMIENTO', // Configuración
    'BUZON',         // Buzón Electrónico
    'SIRE'           // SIRE
  ];
  if (alwaysEnabled.includes(tabId)) return true;

  // 2. Lógica para NUEVO RUS (NRUS)
  if (regimen === 'NRUS') {
    // Solo Tesorería (Caja/Movimientos) y Comprobantes (Compras/Ventas/Honorarios)
    const nrusEnabled = ['COMPRAS', 'VENTAS', 'CAJA', 'MOVIMIENTOS'];
    return nrusEnabled.includes(tabId);
  }

  // 3. Lógica para Régimen Especial de Renta (RER)
  if (regimen === 'RER') {
    // Solo Registro de Ventas (VENTAS_141), Compras (COMPRAS), Ventas (VENTAS) y Tesorería
    const rerEnabled = ['COMPRAS', 'VENTAS', 'VENTAS_141', 'CAJA', 'MOVIMIENTOS'];
    return rerEnabled.includes(tabId);
  }

  // 4. Lógica para Régimen MYPE Tributario (RMT)
  if (regimen === 'MYPE') {
    if (ingresos <= 300) {
      // Tramo 1 (<= 300 UIT): Reg. Ventas, Reg. Compras, Libro Diario Simplificado (DIARIO), Tesorería
      const mype300Enabled = ['COMPRAS', 'VENTAS', 'VENTAS_141', 'DIARIO', 'CAJA', 'MOVIMIENTOS'];
      return mype300Enabled.includes(tabId);
    } else if (ingresos <= 500) {
      // Tramo 2 (> 300 a <= 500 UIT): Reg. Ventas, Reg. Compras, Libro Diario completo, Libro Mayor, Tesorería
      const mype500Enabled = ['COMPRAS', 'VENTAS', 'VENTAS_141', 'DIARIO', 'MAYOR', 'CAJA', 'MOVIMIENTOS'];
      if (tabId === 'COSTOS') {
        return sector === 'MANUFACTURERA'; // Registro de Costos condicional
      }
      return mype500Enabled.includes(tabId);
    } else {
      // Tramo 3 (> 500 UIT): Contabilidad Completa
      // Excepciones y condicionales específicas por sector:
      if (tabId === 'COSTOS') {
        return sector === 'MANUFACTURERA';
      }
      if (tabId === 'PRODUCTOS') {
        // Registro de Inventario Permanente en Unidades Físicas
        return sector === 'COMERCIAL' || sector === 'MANUFACTURERA';
      }
      if (tabId === 'KARDEX') {
        // Registro de Inventario Permanente Valorizado
        if (sector === 'MANUFACTURERA') return true;
        if (sector === 'COMERCIAL') return ingresos > 1500; // Solo > 1500 UIT en comercio
        return false;
      }
      return true; // Todos los demás (Diario, Mayor, Caja y Bancos, Activos, Balances, etc.)
    }
  }

  // 5. Lógica para Régimen General (RG)
  if (regimen === 'RG') {
    if (ingresos <= 150) {
      // Tramo 1 (<= 150 UIT): Reg. Ventas, Reg. Compras, Libro Diario Simplificado, Tesorería
      const rg150Enabled = ['COMPRAS', 'VENTAS', 'VENTAS_141', 'DIARIO', 'CAJA', 'MOVIMIENTOS'];
      return rg150Enabled.includes(tabId);
    } else {
      // Tramo 2 (> 150 UIT): Contabilidad Completa
      if (tabId === 'COSTOS') {
        return sector === 'MANUFACTURERA';
      }
      if (tabId === 'PRODUCTOS') {
        // Reg. Inv. Permanente Unidades Físicas: Manufactura (siempre), Comercio (solo > 500 UIT)
        if (sector === 'MANUFACTURERA') return true;
        if (sector === 'COMERCIAL') return ingresos > 500;
        return false;
      }
      if (tabId === 'KARDEX') {
        // Reg. Inv. Permanente Valorizado: Manufactura (siempre), Comercio (solo > 1500 UIT)
        if (sector === 'MANUFACTURERA') return true;
        if (sector === 'COMERCIAL') return ingresos > 1500;
        return false;
      }
      return true; // Todos los demás libros contables
    }
  }

  return true;
}
