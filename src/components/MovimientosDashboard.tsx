import React, { useMemo, useState } from 'react';
import { 
  TrendingUp, 
  ShoppingCart, 
  Calculator, 
  Edit2,
  Trash2,
  Unlock,
  Plus,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  ArrowRightLeft
} from 'lucide-react';
import { useStore } from '../store';
import { toast } from 'react-hot-toast';
import { exportMultipleSheets } from '../utils/excelExport';

const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SET', 'OCT', 'NOV', 'DIC'];

// --- Subcomponente: Celda Editable ---
interface EditableCellProps {
  value: number;
  onSave: (val: number) => void;
  isOverride?: boolean;
  onReset?: () => void;
  className?: string;
  prefix?: string;
}

const EditableCell: React.FC<EditableCellProps> = ({ value, onSave, isOverride, onReset, className = '', prefix = '' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value.toFixed(2));

  const handleBlur = () => {
    setIsEditing(false);
    const parsed = parseFloat(tempValue.replace(/[^0-9.-]/g, ''));
    if (!isNaN(parsed) && parsed !== value) {
      onSave(parsed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleBlur();
    if (e.key === 'Escape') {
      setIsEditing(false);
      setTempValue(value.toFixed(2));
    }
  };

  if (isEditing) {
    return (
      <input
        autoFocus
        className={`w-full bg-pld-blue/10 border-none outline-none text-right font-mono p-1 rounded text-app-text ${className}`}
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
    );
  }

  return (
    <div 
      className={`group cursor-pointer relative flex items-center justify-end gap-1 px-1 rounded hover:bg-app-hover transition-all ${isOverride ? 'text-pld-blue font-bold' : 'text-app-text'} ${className}`}
      onClick={() => setIsEditing(true)}
    >
      {prefix}{value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      {isOverride && onReset && (
        <button 
          onClick={(e) => { e.stopPropagation(); onReset(); }}
          className="opacity-0 group-hover:opacity-100 p-0.5 text-app-muted hover:text-pld-blue transition-all"
          title="Restablecer"
        >
          <Trash2 size={10} />
        </button>
      )}
    </div>
  );
};

// --- Componente Principal ---
const MovimientosView: React.FC = () => {
  const { sales, purchases, currentCompany, movimientosData, upsertMovimientoData, deleteMovimientoData } = useStore();
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(new Date().getMonth());
  const [isAddingCta, setIsAddingCta] = useState<{ section: 'V' | 'C' | null }>({ section: null });
  const [newCtaValue, setNewCtaValue] = useState('');
  
  const [renamingCta, setRenamingCta] = useState<{ section: 'V' | 'C', oldCta: string } | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const currentPeriod = currentCompany.period || new Date().getFullYear().toString();

  const handleSave = async (monthNum: number, section: string, key: string, value: number) => {
    await upsertMovimientoData({ month: monthNum, section, key, value });
    toast.success('Cambio guardado');
  };

  const handleReset = async (monthNum: number, section: string, key: string) => {
    await deleteMovimientoData(monthNum, section, key);
    toast.success('Valores restablecidos');
  };

  const handleAddAccountAction = () => {
    if (newCtaValue && /^\d+$/.test(newCtaValue) && isAddingCta.section) {
      const targetMonth = selectedMonthIndex + 1;
      handleSave(targetMonth, isAddingCta.section, newCtaValue, 0);
      setNewCtaValue('');
      setIsAddingCta({ section: null });
    } else if (isAddingCta.section) {
      toast.error('Ingrese un número de cuenta válido');
    }
  };

  const handleDeleteAccount = async (section: 'V' | 'C', cta: string) => {
    if (!window.confirm(`¿Seguro que desea eliminar la cuenta ${cta} y todo su contenido sobreescrito manualmente en todos los periodos?`)) return;
    const relevantList = movimientosData.filter(m => m.section === section && m.key === cta && m.period === currentPeriod);
    for (const m of relevantList) {
      await deleteMovimientoData(m.month, m.section, m.key);
    }
    toast.success('Cuenta eliminada');
  };

  const handleRenameAccountConfirm = async () => {
    if (!renamingCta) return;
    const { section, oldCta } = renamingCta;
    const newCta = renameValue.trim();
    
    if (!newCta || newCta === oldCta || !/^\d+$/.test(newCta)) {
       setRenamingCta(null);
       return;
    }
    
    const relevantList = movimientosData.filter(m => m.section === section && m.key === oldCta && m.period === currentPeriod);
    for (const m of relevantList) {
      await upsertMovimientoData({ ...m, key: newCta });
      await deleteMovimientoData(m.month, m.section, oldCta);
    }
    
    setRenamingCta(null);
    setRenameValue('');
    toast.success('Cuenta renombrada');
  };

  const monthlyData = useMemo(() => {
    // 1. Obtener todas las llaves (CTA) manuales de este periodo y sección
    const getCtaKeys = (section: string) => {
      const keys = movimientosData
        .filter(m => m.section === section && m.period === currentPeriod)
        .map(m => m.key)
        .filter(k => !['BI', 'EXO', 'IGV', 'TOT', 'V', 'C', 'VAL'].includes(k));
      return Array.from(new Set(keys));
    };

    const vManualKeys = getCtaKeys('V');
    const cManualKeys = getCtaKeys('C');

    // 2. Obtener todas las llaves (CTA) detectadas en transacciones de TODO el año
    const vDetectedKeys = Array.from(new Set(sales
      .filter(s => new Date(s.fecha).getFullYear().toString() === currentPeriod)
      .map(s => s.ctaIngreso || '70111')
    ));
    const cDetectedKeys = Array.from(new Set(purchases
      .filter(p => new Date(p.fecha).getFullYear().toString() === currentPeriod)
      .map(p => p.ctaGasto || '60111')
    ));

    // 3. Listas Maestras de Cuentas para el Dashboad
    const allVctas = Array.from(new Set([...vManualKeys, ...vDetectedKeys, '70111']));
    const allCctas = Array.from(new Set([...cManualKeys, ...cDetectedKeys, '60111', '63111']));

    return MONTHS.map((name, index) => {
      const monthNum = index + 1;

      const filterByMonth = (items: any[]) => items.filter(i => {
        const d = new Date(i.fecha);
        return (d.getMonth() + 1 === monthNum) && (d.getFullYear().toString() === currentPeriod);
      });

      const mSales = filterByMonth(sales);
      const mPurchases = filterByMonth(purchases);

      // --- VENTAS logic ---
      const salesAccounts: Record<string, { val: number, ov: boolean }> = {};
      allVctas.forEach(cta => {
        const sysVal = mSales.filter(s => (s.ctaIngreso || '70111') === cta).reduce((acc, s) => acc + s.bi, 0);
        const ovVal = movimientosData.find(m => m.month === monthNum && m.section === 'V' && m.key === cta && m.period === currentPeriod)?.value;
        salesAccounts[cta] = { val: ovVal ?? sysVal, ov: ovVal !== undefined };
      });

      const sBI = Object.values(salesAccounts).reduce((acc, a) => acc + a.val, 0);
      const sEXO_sys = mSales.reduce((acc, s) => acc + (s.noGravada || 0), 0);
      const sEXO_ov = movimientosData.find(m => m.month === monthNum && m.section === 'V' && m.key === 'EXO' && m.period === currentPeriod)?.value;
      const sEXO = sEXO_ov ?? sEXO_sys;

      const sIGV_sys = mSales.reduce((acc, s) => acc + s.igv, 0);
      const sIGV_ov = movimientosData.find(m => m.month === monthNum && m.section === 'V' && m.key === 'IGV' && m.period === currentPeriod)?.value;
      const hasAnyVov = Object.values(salesAccounts).some(a => a.ov);
      const sIGV = sIGV_ov ?? (hasAnyVov ? sBI * 0.18 : sIGV_sys);

      const sTotal_sys = mSales.reduce((acc, s) => acc + s.total, 0);
      const sTotal_ov = movimientosData.find(m => m.month === monthNum && m.section === 'V' && m.key === 'TOT' && m.period === currentPeriod)?.value;
      const sTotal = sTotal_ov ?? (hasAnyVov || sIGV_ov !== undefined ? sBI + sEXO + sIGV : sTotal_sys);

      // --- COMPRAS logic ---
      const purchaseAccounts: Record<string, { val: number, ov: boolean }> = {};
      allCctas.forEach(cta => {
        const sysVal = mPurchases.filter(p => (p.ctaGasto || '60111') === cta).reduce((acc, p) => acc + p.bi, 0);
        const ovVal = movimientosData.find(m => m.month === monthNum && m.section === 'C' && m.key === cta && m.period === currentPeriod)?.value;
        purchaseAccounts[cta] = { val: ovVal ?? sysVal, ov: ovVal !== undefined };
      });

      const pBI = Object.values(purchaseAccounts).reduce((acc, a) => acc + a.val, 0);
      const pIGV_sys = mPurchases.reduce((acc, p) => acc + p.igv, 0);
      const pIGV_ov = movimientosData.find(m => m.month === monthNum && m.section === 'C' && m.key === 'IGV' && m.period === currentPeriod)?.value;
      const hasAnyPov = Object.values(purchaseAccounts).some(a => a.ov);
      const pIGV = pIGV_ov ?? (hasAnyPov ? pBI * 0.18 : pIGV_sys);

      const pTotal_sys = mPurchases.reduce((acc, p) => acc + p.total, 0);
      const pTotal_ov = movimientosData.find(m => m.month === monthNum && m.section === 'C' && m.key === 'TOT' && m.period === currentPeriod)?.value;
      const pTotal = pTotal_ov ?? (hasAnyPov || pIGV_ov !== undefined ? pBI + pIGV : pTotal_sys);

      // PDT and Renta
      const pdtV = movimientosData.find(m => m.month === monthNum && m.section === 'PDT' && m.key === 'V' && m.period === currentPeriod)?.value ?? 0;
      const pdtC = movimientosData.find(m => m.month === monthNum && m.section === 'PDT' && m.key === 'C' && m.period === currentPeriod)?.value ?? 0;
      const rentaManual = movimientosData.find(m => m.month === monthNum && m.section === 'R' && m.key === 'VAL' && m.period === currentPeriod)?.value;
      const renta = rentaManual ?? (sBI * (currentCompany.regimenTributario === 'MYPE' ? 0.01 : 0.015));

      return {
        monthNum, name,
        sales: { bi: sBI, exo: sEXO, igv: sIGV, total: sTotal, acc: salesAccounts, ov: { exo: sEXO_ov!==undefined, igv: sIGV_ov!==undefined, tot: sTotal_ov!==undefined } },
        purchases: { bi: pBI, igv: pIGV, total: pTotal, acc: purchaseAccounts, ov: { igv: pIGV_ov!==undefined, tot: pTotal_ov!==undefined } },
        pdt: { v: pdtV, c: pdtC, ovV: pdtV!==0, ovC: pdtC!==0 },
        renta, isRentaOv: rentaManual !== undefined
      };
    });
  }, [sales, purchases, currentCompany, movimientosData]);

  const totals = useMemo(() => {
    return monthlyData.reduce((acc, m) => ({
      s: { bi: acc.s.bi + m.sales.bi, exo: acc.s.exo + m.sales.exo, igv: acc.s.igv + m.sales.igv, tot: acc.s.tot + m.sales.total },
      p: { bi: acc.p.bi + m.purchases.bi, igv: acc.p.igv + m.purchases.igv, tot: acc.p.tot + m.purchases.total },
      renta: acc.renta + m.renta
    }), { s: { bi: 0, exo: 0, igv: 0, tot: 0 }, p: { bi: 0, igv: 0, tot: 0 }, renta: 0 });
  }, [monthlyData]);

  const format = (n: number) => n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const exportExcel = () => {
    // 1. Resumen Mensual
    const resumenData = monthlyData.map(m => ({
      Mes: m.name,
      'Ventas BI': m.sales.bi,
      'Ventas EXO': m.sales.exo,
      'Ventas IGV': m.sales.igv,
      'Ventas Total': m.sales.total,
      'Compras BI': m.purchases.bi,
      'Compras IGV': m.purchases.igv,
      'Compras Total': m.purchases.total,
      'P.A.C. Renta': m.renta,
      'PDT Calc (Sist)': m.sales.igv - m.purchases.igv,
      'PDT Decl (Manual)': m.pdt.v - m.pdt.c,
      'Diferencia': (m.sales.igv - m.purchases.igv) - (m.pdt.v - m.pdt.c)
    }));

    // 2. Detalle por Cuentas (Ventas)
    const ventasCtas: any[] = [];
    const allVctas = Object.keys(monthlyData[0].sales.acc).sort();
    allVctas.forEach(cta => {
      const row: any = { Cuenta: cta, Tipo: 'VENTAS' };
      MONTHS.forEach((m, i) => {
        row[m] = monthlyData[i].sales.acc[cta].val;
      });
      row['TOTAL'] = monthlyData.reduce((acc, m) => acc + m.sales.acc[cta].val, 0);
      ventasCtas.push(row);
    });

    // 3. Detalle por Cuentas (Compras)
    const comprasCtas: any[] = [];
    const allCctas = Object.keys(monthlyData[0].purchases.acc).sort();
    allCctas.forEach(cta => {
      const row: any = { Cuenta: cta, Tipo: 'COMPRAS' };
      MONTHS.forEach((m, i) => {
        row[m] = monthlyData[i].purchases.acc[cta].val;
      });
      row['TOTAL'] = monthlyData.reduce((acc, m) => acc + m.purchases.acc[cta].val, 0);
      comprasCtas.push(row);
    });

    const monthColumns = MONTHS.map(m => ({
      header: m,
      key: m,
      width: 12,
      style: 'currency' as const,
      alignment: 'right' as const
    }));

    const salesTotals: Record<string, any> = { Cuenta: 'TOTAL GENERAL', Tipo: '' };
    MONTHS.forEach((m, idx) => {
      salesTotals[m] = monthlyData[idx].sales.bi;
    });
    salesTotals['TOTAL'] = totals.s.bi;

    const purchasesTotals: Record<string, any> = { Cuenta: 'TOTAL GENERAL', Tipo: '' };
    MONTHS.forEach((m, idx) => {
      purchasesTotals[m] = monthlyData[idx].purchases.bi;
    });
    purchasesTotals['TOTAL'] = totals.p.bi;

    exportMultipleSheets([
      {
        sheetName: 'Resumen Fiscal',
        title: 'RESUMEN FISCAL MENSUAL - IGV Y RENTA',
        columns: [
          { header: 'MES', key: 'Mes', width: 10, alignment: 'center' },
          { header: 'VENTAS BI', key: 'Ventas BI', width: 16, style: 'currency' },
          { header: 'VENTAS EXO', key: 'Ventas EXO', width: 16, style: 'currency' },
          { header: 'VENTAS IGV', key: 'Ventas IGV', width: 16, style: 'currency' },
          { header: 'VENTAS TOTAL', key: 'Ventas Total', width: 18, style: 'currency' },
          { header: 'COMPRAS BI', key: 'Compras BI', width: 16, style: 'currency' },
          { header: 'COMPRAS IGV', key: 'Compras IGV', width: 16, style: 'currency' },
          { header: 'COMPRAS TOTAL', key: 'Compras Total', width: 18, style: 'currency' },
          { header: 'P.A.C. RENTA', key: 'P.A.C. Renta', width: 16, style: 'currency' },
          { header: 'PDT CALC (SIST)', key: 'PDT Calc (Sist)', width: 16, style: 'currency' },
          { header: 'PDT DECL (MANUAL)', key: 'PDT Decl (Manual)', width: 16, style: 'currency' },
          { header: 'DIFERENCIA', key: 'Diferencia', width: 16, style: 'currency' }
        ],
        rows: resumenData,
        totals: {
          Mes: 'TOTAL GENERAL',
          'Ventas BI': totals.s.bi,
          'Ventas EXO': totals.s.exo,
          'Ventas IGV': totals.s.igv,
          'Ventas Total': totals.s.tot,
          'Compras BI': totals.p.bi,
          'Compras IGV': totals.p.igv,
          'Compras Total': totals.p.tot,
          'P.A.C. Renta': totals.renta,
          'PDT Calc (Sist)': totals.s.igv - totals.p.igv,
          'PDT Decl (Manual)': monthlyData.reduce((acc, m) => acc + (m.pdt.v - m.pdt.c), 0),
          'Diferencia': (totals.s.igv - totals.p.igv) - monthlyData.reduce((acc, m) => acc + (m.pdt.v - m.pdt.c), 0)
        },
        companyInfo: {
          ruc: currentCompany?.ruc || '',
          name: currentCompany?.name || 'EMPRESA',
          period: currentPeriod,
        }
      },
      {
        sheetName: 'Detalle Ventas',
        title: 'DETALLE MENSUAL DE CUENTAS DE VENTAS (CLASE 7)',
        columns: [
          { header: 'CUENTA', key: 'Cuenta', width: 12, alignment: 'center' },
          { header: 'TIPO', key: 'Tipo', width: 12, alignment: 'center' },
          ...monthColumns,
          { header: 'TOTAL', key: 'TOTAL', width: 16, style: 'currency' }
        ],
        rows: ventasCtas,
        totals: salesTotals,
        companyInfo: {
          ruc: currentCompany?.ruc || '',
          name: currentCompany?.name || 'EMPRESA',
          period: currentPeriod,
        }
      },
      {
        sheetName: 'Detalle Compras',
        title: 'DETALLE MENSUAL DE CUENTAS DE COMPRAS (CLASE 6)',
        columns: [
          { header: 'CUENTA', key: 'Cuenta', width: 12, alignment: 'center' },
          { header: 'TIPO', key: 'Tipo', width: 12, alignment: 'center' },
          ...monthColumns,
          { header: 'TOTAL', key: 'TOTAL', width: 16, style: 'currency' }
        ],
        rows: comprasCtas,
        totals: purchasesTotals,
        companyInfo: {
          ruc: currentCompany?.ruc || '',
          name: currentCompany?.name || 'EMPRESA',
          period: currentPeriod,
        }
      }
    ], `Reporte_Fiscal_${currentCompany.ruc}_${currentPeriod}`);
  };

  const exportPDF = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6 p-6 md:p-10 h-full overflow-y-auto bg-app-bg custom-scrollbar animate-fade-in print:bg-white print:p-0">
      
      {/* Header */}
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-2xl font-black italic uppercase text-app-text flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20 text-white"><ArrowRightLeft size={24} /></div>
            Movimientos Fiscales
          </h1>
          <p className="text-xs font-bold text-app-muted mt-1 uppercase tracking-widest">{currentCompany.name} • {currentCompany.period}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportExcel} className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all flex items-center gap-2 text-[10px] font-black uppercase">
            <FileSpreadsheet size={16} /> Excel
          </button>
          <button onClick={exportPDF} className="p-2.5 bg-app-surface border border-app-border text-app-text rounded-xl shadow-sm hover:scale-105 transition-all flex items-center gap-2 text-[10px] font-black uppercase">
            <FileText size={16} /> Imprimir
          </button>
          <div className="bg-app-surface px-4 py-2 rounded-xl shadow-sm border border-app-border flex items-center gap-2 ml-4">
            <Unlock size={14} className="text-amber-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-app-muted">Modo Edición</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        
        {/* Ventas Table */}
        <div className="bg-app-surface rounded-3xl shadow-sm border border-app-border overflow-hidden">
          <div className="p-4 bg-app-bg border-b border-app-border flex justify-between items-center">
            <h2 className="text-xs font-black uppercase tracking-widest text-blue-600 flex items-center gap-2"><TrendingUp size={16} /> Movimiento Ventas (Clase 7)</h2>
            <div className="flex gap-2">
              {isAddingCta.section === 'V' ? (
                <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200">
                  <input 
                    autoFocus
                    type="text"
                    placeholder="Número CTA..."
                    className="p-1 px-2 border border-blue-400 rounded-lg text-[10px] w-24"
                    value={newCtaValue}
                    onChange={e => setNewCtaValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddAccountAction()}
                  />
                  <button onClick={handleAddAccountAction} className="p-1 px-2 bg-blue-600 text-white rounded-lg text-[10px] uppercase font-black">OK</button>
                  <button onClick={() => setIsAddingCta({ section: null })} className="p-1 px-2 bg-app-muted/50 text-app-text rounded-lg text-[10px] uppercase font-black">X</button>
                </div>
              ) : (
                <button onClick={() => setIsAddingCta({ section: 'V' })} className="p-1 px-3 bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase flex items-center gap-1 hover:bg-blue-700 transition-all print:hidden">
                  <Plus size={12} /> Añadir CTA
                </button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-right border-collapse font-mono text-[12px]">
              <thead>
                <tr className="bg-app-bg text-app-muted uppercase text-[10px] font-black">
                  <th className="p-3 text-left pl-6 sticky left-0 bg-app-bg z-10 w-32 border-r border-app-border">Cuenta</th>
                  {MONTHS.map(m => <th key={m} className="p-3 min-w-[100px] text-center">{m}</th>)}
                  <th className="p-3 pr-6 bg-blue-500/10 text-blue-600">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {Object.keys(monthlyData[0].sales.acc).sort().map(cta => (
                  <tr key={cta} className="hover:bg-app-hover transition-colors group/row">
                    <td className="p-3 pl-6 text-left font-black text-app-text sticky left-0 bg-app-surface z-10 border-r border-app-border">
                      {renamingCta?.section === 'V' && renamingCta.oldCta === cta ? (
                        <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200">
                          <input 
                            autoFocus
                            type="text"
                            className="p-1 px-2 border border-blue-400 rounded-lg text-[10px] w-20 font-bold"
                            value={renameValue}
                            onChange={e => setRenameValue(e.target.value)}
                            onKeyDown={e => { if(e.key === 'Enter') handleRenameAccountConfirm(); if(e.key === 'Escape') setRenamingCta(null); }}
                          />
                          <button onClick={handleRenameAccountConfirm} className="p-1 px-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-black">OK</button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                           <span>{cta}</span>
                           <div className="flex gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity print:hidden">
                             <button onClick={() => { setRenamingCta({ section: 'V', oldCta: cta }); setRenameValue(cta); }} className="text-app-muted hover:text-pld-blue"><Edit2 size={12} /></button>
                             <button onClick={() => handleDeleteAccount('V', cta)} className="text-app-muted hover:text-red-500"><Trash2 size={12} /></button>
                           </div>
                        </div>
                      )}
                    </td>
                    {monthlyData.map(m => (
                      <td key={m.name} className="p-3">
                        <EditableCell 
                          value={m.sales.acc[cta].val} 
                          onSave={v => handleSave(m.monthNum, 'V', cta, v)} 
                          isOverride={m.sales.acc[cta].ov} 
                          onReset={() => handleReset(m.monthNum, 'V', cta)} 
                        />
                      </td>
                    ))}
                    <td className="p-3 pr-6 font-black font-mono bg-app-bg text-app-text">
                      {format(monthlyData.reduce((acc, m) => acc + m.sales.acc[cta].val, 0))}
                    </td>
                  </tr>
                ))}
                <tr className="bg-blue-500/10 font-black">
                  <td className="p-3 pl-6 text-left text-blue-600 sticky left-0 bg-blue-500/10 z-10 border-r border-app-border">SUBTOTAL BI</td>
                  {monthlyData.map(m => <td key={m.name} className="p-3 text-blue-600">{format(m.sales.bi)}</td>)}
                  <td className="p-3 pr-6 font-black bg-blue-500/20 text-blue-600">{format(totals.s.bi)}</td>
                </tr>
                <tr>
                  <td className="p-3 pl-6 text-left font-black text-app-text sticky left-0 bg-app-surface z-10 border-r border-app-border uppercase">Exonerado</td>
                  {monthlyData.map(m => <td key={m.name} className="p-3 ml-2"><EditableCell value={m.sales.exo} onSave={v => handleSave(m.monthNum, 'V', 'EXO', v)} isOverride={m.sales.ov.exo} onReset={() => handleReset(m.monthNum, 'V', 'EXO')} /></td>)}
                  <td className="p-3 pr-6 font-black text-app-muted">{format(totals.s.exo)}</td>
                </tr>
                <tr className="bg-amber-500/10">
                  <td className="p-3 pl-6 text-left font-black text-amber-500 sticky left-0 bg-amber-500/10 z-10 border-r border-amber-500/20">4011 (IGV)</td>
                  {monthlyData.map(m => <td key={m.name} className="p-3 font-bold text-amber-500"><EditableCell value={m.sales.igv} onSave={v => handleSave(m.monthNum, 'V', 'IGV', v)} isOverride={m.sales.ov.igv} onReset={() => handleReset(m.monthNum, 'V', 'IGV')} /></td>)}
                  <td className="p-3 pr-6 font-black bg-amber-500/20 text-amber-600">{format(totals.s.igv)}</td>
                </tr>
                <tr className="bg-app-bg border-t-2 border-app-border">
                  <td className="p-3 pl-6 text-left font-black text-app-text sticky left-0 bg-app-bg z-10 border-r border-app-border">1212 (TOTAL)</td>
                  {monthlyData.map(m => <td key={m.name} className="p-3 font-black"><EditableCell value={m.sales.total} onSave={v => handleSave(m.monthNum, 'V', 'TOT', v)} isOverride={m.sales.ov.tot} onReset={() => handleReset(m.monthNum, 'V', 'TOT')} /></td>)}
                  <td className="p-3 pr-6 font-black text-app-text">{format(totals.s.tot)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Compras Table */}
        <div className="bg-app-surface rounded-3xl shadow-sm border border-app-border overflow-hidden">
          <div className="p-4 bg-app-bg border-b border-app-border flex justify-between items-center">
            <h2 className="text-xs font-black uppercase tracking-widest text-violet-500 flex items-center gap-2"><ShoppingCart size={16} /> Movimiento Compras (Clase 6)</h2>
            <div className="flex gap-2">
              {isAddingCta.section === 'C' ? (
                <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200">
                  <input 
                    autoFocus
                    type="text"
                    placeholder="Número CTA..."
                    className="p-1 px-2 border border-violet-400 rounded-lg text-[10px] w-24"
                    value={newCtaValue}
                    onChange={e => setNewCtaValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddAccountAction()}
                  />
                  <button onClick={handleAddAccountAction} className="p-1 px-2 bg-violet-600 text-white rounded-lg text-[10px] uppercase font-black">OK</button>
                  <button onClick={() => setIsAddingCta({ section: null })} className="p-1 px-2 bg-app-muted/50 text-app-text rounded-lg text-[10px] uppercase font-black">X</button>
                </div>
              ) : (
                <button onClick={() => setIsAddingCta({ section: 'C' })} className="p-1 px-3 bg-violet-600 text-white rounded-lg text-[9px] font-black uppercase flex items-center gap-1 hover:bg-violet-700 transition-all print:hidden">
                  <Plus size={12} /> Añadir CTA
                </button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-right border-collapse font-mono text-[12px]">
              <thead>
                <tr className="bg-app-bg text-app-muted uppercase text-[10px] font-black">
                  <th className="p-3 text-left pl-6 sticky left-0 bg-app-bg z-10 w-32 border-r border-app-border">Cuenta</th>
                  {MONTHS.map(m => <th key={m} className="p-3 min-w-[100px] text-center">{m}</th>)}
                  <th className="p-3 pr-6 bg-violet-500/10 text-violet-500">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {Object.keys(monthlyData[0].purchases.acc).sort().map(cta => (
                  <tr key={cta} className="hover:bg-app-hover transition-colors group/row">
                    <td className="p-3 pl-6 text-left font-black text-app-text sticky left-0 bg-app-surface z-10 border-r border-app-border">
                      {renamingCta?.section === 'C' && renamingCta.oldCta === cta ? (
                        <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200">
                          <input 
                            autoFocus
                            type="text"
                            className="p-1 px-2 border border-violet-400 rounded-lg text-[10px] w-20 font-bold"
                            value={renameValue}
                            onChange={e => setRenameValue(e.target.value)}
                            onKeyDown={e => { if(e.key === 'Enter') handleRenameAccountConfirm(); if(e.key === 'Escape') setRenamingCta(null); }}
                          />
                          <button onClick={handleRenameAccountConfirm} className="p-1 px-1.5 bg-violet-600 text-white rounded-lg text-[10px] font-black">OK</button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                           <span>{cta}</span>
                           <div className="flex gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity print:hidden">
                             <button onClick={() => { setRenamingCta({ section: 'C', oldCta: cta }); setRenameValue(cta); }} className="text-app-muted hover:text-violet-500"><Edit2 size={12} /></button>
                             <button onClick={() => handleDeleteAccount('C', cta)} className="text-app-muted hover:text-red-500"><Trash2 size={12} /></button>
                           </div>
                        </div>
                      )}
                    </td>
                    {monthlyData.map(m => (
                      <td key={m.name} className="p-3">
                        <EditableCell 
                          value={m.purchases.acc[cta].val} 
                          onSave={v => handleSave(m.monthNum, 'C', cta, v)} 
                          isOverride={m.purchases.acc[cta].ov} 
                          onReset={() => handleReset(m.monthNum, 'C', cta)} 
                        />
                      </td>
                    ))}
                    <td className="p-3 pr-6 font-black font-mono bg-app-bg text-app-text">
                      {format(monthlyData.reduce((acc, m) => acc + m.purchases.acc[cta].val, 0))}
                    </td>
                  </tr>
                ))}
                <tr className="bg-violet-500/10 font-black">
                  <td className="p-3 pl-6 text-left text-violet-500 sticky left-0 bg-violet-500/10 z-10 border-r border-app-border">SUBTOTAL BI</td>
                  {monthlyData.map(m => <td key={m.name} className="p-3 text-violet-500">{format(m.purchases.bi)}</td>)}
                  <td className="p-3 pr-6 font-black bg-violet-500/20 text-violet-600">{format(totals.p.bi)}</td>
                </tr>
                <tr className="bg-amber-500/10">
                  <td className="p-3 pl-6 text-left font-black text-amber-500 sticky left-0 bg-amber-500/10 z-10 border-r border-amber-500/20">4011 (IGV)</td>
                  {monthlyData.map(m => <td key={m.name} className="p-3 font-bold text-amber-500"><EditableCell value={m.purchases.igv} onSave={v => handleSave(m.monthNum, 'C', 'IGV', v)} isOverride={m.purchases.ov.igv} onReset={() => handleReset(m.monthNum, 'C', 'IGV')} /></td>)}
                  <td className="p-3 pr-6 font-black bg-amber-500/20 text-amber-600">{format(totals.p.igv)}</td>
                </tr>
                <tr className="bg-app-bg border-t-2 border-app-border">
                  <td className="p-3 pl-6 text-left font-black text-app-text sticky left-0 bg-app-bg z-10 border-r border-app-border">4212 (TOTAL)</td>
                  {monthlyData.map(m => <td key={m.name} className="p-3 font-black"><EditableCell value={m.purchases.total} onSave={v => handleSave(m.monthNum, 'C', 'TOT', v)} isOverride={m.purchases.ov.tot} onReset={() => handleReset(m.monthNum, 'C', 'TOT')} /></td>)}
                  <td className="p-3 pr-6 font-black text-app-text">{format(totals.p.tot)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Detail Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Card: Monthly Breakdown and PDT Compare */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-slate-600 dark:text-slate-400 italic">Análisis Mensual Detallado</h3>
              <select 
                value={selectedMonthIndex} 
                onChange={e => setSelectedMonthIndex(Number(e.target.value))}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-lg text-[10px] font-black uppercase text-blue-600"
              >
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-app-surface p-6 rounded-3xl border border-app-border shadow-sm transition-all hover:shadow-md">
                <p className="text-[10px] font-black text-blue-500 uppercase mb-4">SEGÚN SISTEMA</p>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs text-app-text"><span>IGV Ventas</span><span className="font-mono font-bold">{format(monthlyData[selectedMonthIndex].sales.igv)}</span></div>
                  <div className="flex justify-between text-xs text-app-text"><span>IGV Compras</span><span className="font-mono font-bold">{format(monthlyData[selectedMonthIndex].purchases.igv)}</span></div>
                  <div className="pt-2 border-t border-app-border flex justify-between text-xs font-black text-app-text"><span>POR PAGAR</span><span className="text-pld-blue">{format(monthlyData[selectedMonthIndex].sales.igv - monthlyData[selectedMonthIndex].purchases.igv)}</span></div>
                </div>
              </div>

              <div className="bg-app-bg p-6 rounded-3xl border border-app-border shadow-sm transition-all hover:shadow-md group">
                <p className="text-[10px] font-black text-amber-500 uppercase mb-4">SEGÚN PDT (MANUAL)</p>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs text-app-text"><span>IGV Decl. V</span><EditableCell value={monthlyData[selectedMonthIndex].pdt.v} onSave={v => handleSave(selectedMonthIndex+1, 'PDT', 'V', v)} isOverride={monthlyData[selectedMonthIndex].pdt.ovV} onReset={() => handleReset(selectedMonthIndex+1, 'PDT', 'V')} /></div>
                  <div className="flex justify-between text-xs text-app-text"><span>IGV Decl. C</span><EditableCell value={monthlyData[selectedMonthIndex].pdt.c} onSave={v => handleSave(selectedMonthIndex+1, 'PDT', 'C', v)} isOverride={monthlyData[selectedMonthIndex].pdt.ovC} onReset={() => handleReset(selectedMonthIndex+1, 'PDT', 'C')} /></div>
                  <div className="pt-2 border-t border-app-border flex justify-between text-xs font-black text-app-text"><span>DECLARADO</span><span className="text-amber-500">{format(monthlyData[selectedMonthIndex].pdt.v - monthlyData[selectedMonthIndex].pdt.c)}</span></div>
                </div>
              </div>
            </div>

            {/* Error/Rectification Alert */}
            {(() => {
              const diffMonthNames = monthlyData
                .filter(m => Math.abs((m.sales.igv - m.purchases.igv) - (m.pdt.v - m.pdt.c)) > 0.1)
                .map(m => m.name);
              
              if (diffMonthNames.length === 0) return null;

              return (
                <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/30 p-6 rounded-2xl space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-rose-600 text-white rounded-2xl shadow-lg shadow-rose-600/20"><AlertTriangle size={24} /></div>
                    <div>
                      <p className="text-sm font-black text-rose-600 uppercase tracking-widest">Inconsistencia Detectada (PDT vs Sistema)</p>
                      <p className="text-[10px] text-rose-500 font-bold uppercase mt-1">Se han detectado discrepancias en {diffMonthNames.length} {diffMonthNames.length === 1 ? 'periodo' : 'periodos'}.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {monthlyData.map(m => {
                      const diff = (m.sales.igv - m.purchases.igv) - (m.pdt.v - m.pdt.c);
                      if (Math.abs(diff) <= 0.1) return null;
                      return (
                        <div key={m.name} className="p-2 bg-white/50 dark:bg-black/20 rounded-xl border border-rose-100 dark:border-rose-900/20 flex justify-between items-center px-4">
                          <span className="text-[10px] font-black text-slate-500">{m.name}</span>
                          <span className="text-xs font-mono font-black text-rose-600">S/ {format(Math.abs(diff))}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[9px] text-rose-400 font-medium italic">* La diferencia puede deberse a facturas no registradas en el sistema o errores manuales en la declaración.</p>
                </div>
              );
            })()}
          </div>

          {/* Renta and Impuestos Overview */}
          <div className="space-y-6">
             <div className="bg-indigo-600 text-white p-8 rounded-[2rem] shadow-xl shadow-indigo-600/20 relative overflow-hidden group">
                <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-6">PAGOS A CUENTA - IMPUESTO A LA RENTA</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-4xl font-black italic tracking-tighter">S/ {format(totals.renta)}</p>
                      <p className="text-[10px] uppercase font-bold mt-2 opacity-60">Acumulado Periodo {currentCompany.period}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black uppercase mb-1">Cálculo Seleccionado ({MONTHS[selectedMonthIndex]})</p>
                       <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10">
                          <EditableCell 
                             value={monthlyData[selectedMonthIndex].renta} 
                             onSave={v => handleSave(selectedMonthIndex+1, 'R', 'VAL', v)} 
                             isOverride={monthlyData[selectedMonthIndex].isRentaOv} 
                             onReset={() => handleReset(selectedMonthIndex+1, 'R', 'VAL')}
                             className="text-white text-lg"
                          />
                       </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-all duration-1000" />
             </div>

             <div className="bg-app-surface p-8 rounded-[2rem] border border-app-border shadow-sm flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase text-app-text italic tracking-widest flex items-center gap-2"><Calculator size={16} /> Resumen Impuestos Totales</h4>
                  <p className="text-[10px] text-app-muted font-bold mt-1">IGV + Renta acumulados a pagar</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-rose-500">S/ {format(totals.s.igv - totals.p.igv + totals.renta)}</p>
                </div>
             </div>
          </div>

        </div>

      </div>

      <div className="mt-8 pt-8 border-t border-app-border text-center opacity-40">
        <p className="text-[9px] font-black uppercase tracking-[0.6em] text-app-muted">SoftContable Intelligence Division • Movimientos Dashboard</p>
      </div>

    </div>
  );
};

export default MovimientosView;
