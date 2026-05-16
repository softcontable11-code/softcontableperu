import React, { useMemo, useState, useEffect } from 'react';
import { useStore, type BalanceInicialItem, type SectionType } from '../store';
import { 
  Calculator, 
  Printer, 
  FileDown, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  AlertCircle,
  TrendingUp,
  Landmark,
  PiggyBank,
  Search
} from 'lucide-react';
import toast from 'react-hot-toast';

const DEFAULT_STRUCTURE: { cta: string; desc: string; section: SectionType }[] = [
  { cta: '101', desc: 'Caja y Bancos', section: 'ACTIVO_CORRIENTE' },
  { cta: '111', desc: 'Valores Negociables', section: 'ACTIVO_CORRIENTE' },
  { cta: '121', desc: 'Cuentas por Cobrar Comerciales', section: 'ACTIVO_CORRIENTE' },
  { cta: '131', desc: 'Cuentas por Cobrar a Vinculadas', section: 'ACTIVO_CORRIENTE' },
  { cta: '141', desc: 'Otras Cuentas por Cobrar', section: 'ACTIVO_CORRIENTE' },
  { cta: '201', desc: 'Existencias', section: 'ACTIVO_CORRIENTE' },
  { cta: '181', desc: 'Gastos Pagados por Anticipado', section: 'ACTIVO_CORRIENTE' },
  { cta: '331', desc: 'Inmuebles, Maquinaria y Equipo', section: 'ACTIVO_NO_CORRIENTE' },
  { cta: '341', desc: 'Activos Intangibles', section: 'ACTIVO_NO_CORRIENTE' },
  { cta: '451', desc: 'Sobregiros y Pagarés Bancarios', section: 'PASIVO_CORRIENTE' },
  { cta: '421', desc: 'Cuentas por Pagar Comerciales', section: 'PASIVO_CORRIENTE' },
  { cta: '431', desc: 'Cuentas por Pagar a Vinculadas', section: 'PASIVO_CORRIENTE' },
  { cta: '461', desc: 'Otras Cuentas por Pagar', section: 'PASIVO_CORRIENTE' },
  { cta: '501', desc: 'Capital', section: 'PATRIMONIO' },
  { cta: '591', desc: 'Resultados Acumulados', section: 'PATRIMONIO' },
];

// --- Componente de Celda Editable para evitar saltos de cursor ---
const EditableCell = ({ value, onSave, className, placeholder, type = 'text', align = 'left' }: any) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = () => {
    if (localValue !== value) {
      onSave(type === 'number' ? parseFloat(localValue) || 0 : localValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <input 
      type={type}
      value={localValue}
      onChange={(e) => setLocalValue(type === 'text' ? e.target.value.toUpperCase() : e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`w-full bg-transparent border-none outline-none ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'} ${className}`}
      placeholder={placeholder}
    />
  );
};

export default function BalanceInicialView() {
  const { balanceInicial, currentCompany, saveBalanceInicialItem, saveBalanceInicialBulk, deleteBalanceInicialItem, setActiveTab, setDraftAsiento, plan } = useStore();
  const [isInitializing, setIsInitializing] = useState(false);
  const [showPicker, setShowPicker] = useState<{ section: SectionType } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const items = useMemo(() => {
    return [...balanceInicial].sort((a, b) => {
      const sectionA = a.section || 'ACTIVO_CORRIENTE';
      const sectionB = b.section || 'ACTIVO_CORRIENTE';
      if (sectionA !== sectionB) return 0; 
      return (a.cta || '').localeCompare(b.cta || '');
    });
  }, [balanceInicial]);

  const totals = useMemo(() => {
    const activo = items.filter(i => (i.section || '').startsWith('ACTIVO')).reduce((acc, i) => acc + (i.debe || 0), 0);
    const pasivoPat = items.filter(i => !(i.section || '').startsWith('ACTIVO')).reduce((acc, i) => acc + (i.haber || 0), 0);
    return { activo, pasivoPat, diff: Math.abs(activo - pasivoPat) };
  }, [items]);

  const filteredAccounts = useMemo(() => {
    if (!showPicker) return [];
    return plan.filter(acc => 
      (acc.cta.startsWith(searchTerm) || acc.desc.toLowerCase().includes(searchTerm.toLowerCase())) &&
      acc.cta.length >= 2
    ).slice(0, 10);
  }, [plan, searchTerm, showPicker]);

  const handleUpdate = async (id: string, updates: Partial<BalanceInicialItem>) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    await saveBalanceInicialItem({ ...item, ...updates } as BalanceInicialItem);
  };

  const handleInitialize = async () => {
    setIsInitializing(true);
    try {
      const payload = DEFAULT_STRUCTURE.map((d, i) => ({
        id: `fixed-${Date.now()}-${i}`,
        cta: d.cta,
        desc: d.desc,
        section: d.section,
        debe: 0,
        haber: 0
      }));
      await saveBalanceInicialBulk(payload);
      toast.success('Formato inicializado');
    } catch (e) {
      toast.error('Error al inicializar');
    } finally {
      setIsInitializing(false);
    }
  };

  const selectAccount = async (cta: string, desc: string) => {
    if (!showPicker) return;
    const newItem: BalanceInicialItem = {
      id: `custom-${Date.now()}`,
      cta,
      desc,
      section: showPicker.section,
      debe: 0,
      haber: 0
    };
    await saveBalanceInicialItem(newItem);
    setShowPicker(null);
    setSearchTerm('');
  };

  const renderSection = (title: string, section: SectionType) => (
    <div className="mb-6">
      <div className="flex justify-between items-center bg-app-surface/50 border-b border-app-border px-3 py-1.5 mb-1">
        <span className="text-[10px] font-black text-app-muted uppercase tracking-widest">{title}</span>
        <button 
          onClick={() => setShowPicker({ section })}
          className="p-1 hover:text-blue-600 text-app-muted transition-colors flex items-center gap-1"
        >
          <Plus size={14} />
          <span className="text-[8px] font-bold">AÑADIR CUENTA</span>
        </button>
      </div>
      
      {items.filter(i => i.section === section).map(item => (
        <div key={item.id} className="group flex h-9 border-b border-app-border hover:bg-app-hover transition-colors">
          <div className="flex-1 flex items-center border-r border-app-border">
            <EditableCell 
              value={item.desc}
              onSave={(val: string) => handleUpdate(item.id, { desc: val })}
              className="px-3 text-[11px] font-medium text-app-text uppercase"
              placeholder="Descripción..."
            />
          </div>
          <div className="w-20 flex items-center justify-center border-r border-app-border">
            <EditableCell 
              value={item.cta}
              onSave={(val: string) => handleUpdate(item.id, { cta: val })}
              className="text-center text-[10px] font-black text-blue-600"
              align="center"
              placeholder="000"
            />
          </div>
          <div className="w-32 flex items-center relative">
            <EditableCell 
              type="number"
              value={item.debe || item.haber || 0}
              onSave={(val: number) => handleUpdate(item.id, { 
                debe: section.startsWith('ACTIVO') ? val : 0,
                haber: !section.startsWith('ACTIVO') ? val : 0
              })}
              className="px-3 text-[11px] font-mono font-bold text-app-text"
              align="right"
              placeholder="0.00"
            />
            <button 
              onClick={() => deleteBalanceInicialItem(item.id)}
              className="absolute -left-6 opacity-0 group-hover:opacity-100 text-rose-500 p-1 transition-opacity"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-app-bg animate-fade-in relative">
      {/* Picker de Cuentas */}
      {showPicker && (
        <div className="absolute inset-0 bg-app-bg/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-app-surface border border-app-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-app-border bg-app-surface/50 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-app-text flex items-center gap-2">
                <Search size={14} className="text-blue-600" />
                Seleccionar Cuenta del Plan
              </h3>
              <button onClick={() => setShowPicker(null)} className="text-app-muted hover:text-app-text text-xs font-bold">CERRAR</button>
            </div>
            <div className="p-4">
              <input 
                autoFocus
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Busca por código o nombre (Ej: 101, Mercaderías)..."
                className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-xs outline-none focus:border-blue-600 transition-all text-app-text"
              />
            </div>
            <div className="max-h-64 overflow-auto py-2">
              {filteredAccounts.map(acc => (
                <button 
                  key={acc.cta}
                  onClick={() => selectAccount(acc.cta, acc.desc)}
                  className="w-full px-6 py-3 flex items-center justify-between hover:bg-app-hover transition-colors text-left border-b border-app-border/30 last:border-none"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-[11px] font-black text-blue-600 w-12">{acc.cta}</span>
                    <span className="text-[10px] font-bold text-app-text uppercase">{acc.desc}</span>
                  </div>
                  <Plus size={14} className="text-emerald-500" />
                </button>
              ))}
              {searchTerm && filteredAccounts.length === 0 && (
                <div className="p-10 text-center text-app-muted text-[10px] font-bold uppercase tracking-widest">
                  No se encontraron cuentas
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header Premium */}
      <header className="h-16 px-6 bg-app-surface border-b border-app-border flex items-center justify-between shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
            <Calculator size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-base font-black uppercase tracking-tighter text-app-text">Balance Inicial</h1>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase flex items-center gap-1 ${totals.diff < 0.01 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {totals.diff < 0.01 ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                {totals.diff < 0.01 ? 'Balance Cuadrado' : `Descuadre: S/ ${totals.diff.toLocaleString()}`}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleInitialize} className="h-10 px-4 text-app-muted hover:text-app-text text-[10px] font-black uppercase flex items-center gap-2 transition-colors">
            {isInitializing ? '...' : 'Reiniciar Formato'}
          </button>
          <button onClick={() => window.print()} className="h-10 px-4 bg-app-surface text-app-text border border-app-border rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-app-hover transition-colors shadow-sm">
            <Printer size={16} /> Imprimir
          </button>
          <button 
            onClick={() => {
              const journalLines = items
                .filter(i => (i.debe || 0) > 0 || (i.haber || 0) > 0)
                .map((i, index) => {
                  let d = i.debe || 0;
                  let h = i.haber || 0;
                  if (i.cta.startsWith('19') || i.cta.startsWith('29') || i.cta.startsWith('39')) {
                    if (d > 0) { h = d; d = 0; }
                  }
                  return { id: index + 1, cuenta: i.cta, detalle: i.desc, debe: d, haber: h };
                });
              if (journalLines.length === 0) { toast.error('No hay montos para generar el asiento'); return; }
              if (totals.diff > 0.01) { toast.error('El balance debe estar cuadrado'); return; }
              setDraftAsiento({
                header: { asiento: '000000', fecEmi: `${currentCompany?.period}-01-01`, glosa: `ASIENTO DE APERTURA - ${currentCompany?.period}`, anio: String(currentCompany?.period), mes: '00' },
                lines: journalLines,
                editingId: null
              } as any);
              setActiveTab('ASIENTOS');
              toast.success('Asiento cargado en borradores');
            }}
            className="h-10 px-6 bg-blue-600 text-white rounded-xl text-[11px] font-black uppercase shadow-lg shadow-blue-600/20 flex items-center gap-2 hover:bg-blue-700 transition-all active:scale-95"
          >
            <CheckCircle2 size={18} /> Generar Asiento
          </button>
        </div>
      </header>

      {/* Papel Contable */}
      <div className="flex-1 overflow-auto custom-scrollbar p-6 lg:p-10 bg-app-bg">
        <div className="max-w-6xl mx-auto bg-app-surface border border-app-border shadow-2xl rounded-xl p-12 min-h-[1000px] transition-all duration-500">
          
          <div className="mb-10 text-center border-b border-app-border pb-6">
            <h2 className="text-lg font-black uppercase tracking-tighter text-app-text mb-2">Libro de Inventarios y Balances</h2>
            <p className="text-xs font-bold text-app-muted uppercase tracking-widest">Formato 3.1 - Estado de Situación Financiera</p>
          </div>

          <div className="grid grid-cols-2 gap-12">
            {/* Columna Activo */}
            <div>
              <div className="flex bg-app-text text-app-surface p-3 rounded-t-lg font-black text-[11px] uppercase items-center gap-2">
                <TrendingUp size={14} /> ACTIVO
              </div>
              {renderSection('Activo Corriente', 'ACTIVO_CORRIENTE')}
              {renderSection('Activo No Corriente', 'ACTIVO_NO_CORRIENTE')}
              
              <div className="flex justify-between items-center p-4 bg-blue-600/5 border-2 border-blue-600/20 rounded-xl mt-4">
                <span className="text-xs font-black uppercase text-app-text">Total Activo</span>
                <span className="text-sm font-mono font-black text-blue-600">S/ {totals.activo.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Columna Pasivo/Patrimonio */}
            <div>
              <div className="flex bg-app-text text-app-surface p-3 rounded-t-lg font-black text-[11px] uppercase items-center gap-2">
                <PiggyBank size={14} /> PASIVO Y PATRIMONIO
              </div>
              {renderSection('Pasivo Corriente', 'PASIVO_CORRIENTE')}
              {renderSection('Pasivo No Corriente', 'PASIVO_NO_CORRIENTE')}
              {renderSection('Patrimonio Neto', 'PATRIMONIO')}

              <div className="flex justify-between items-center p-4 bg-emerald-600/5 border-2 border-emerald-600/20 rounded-xl mt-4">
                <span className="text-xs font-black uppercase text-app-text">Total Pasivo y Pat.</span>
                <span className="text-sm font-mono font-black text-emerald-600">S/ {totals.pasivoPat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Información de la Empresa al Final */}
          <div className="mt-20 pt-8 border-t border-app-border grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-[10px] font-black text-app-muted uppercase mb-1">Ejercicio</p>
              <p className="text-xs font-bold text-app-text">{currentCompany?.period || '2026'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-app-muted uppercase mb-1">RUC</p>
              <p className="text-xs font-bold text-app-text">{currentCompany?.ruc || '---'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-app-muted uppercase mb-1">Empresa</p>
              <p className="text-xs font-bold text-app-text uppercase">{currentCompany?.name || '---'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
