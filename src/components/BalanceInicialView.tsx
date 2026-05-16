import React, { useState, useMemo, useEffect } from 'react';
import { BookOpen, Save, Plus, Trash2, CheckCircle2, Search, X, AlertCircle, Calculator, Printer, FileDown } from 'lucide-react';
import { useStore, type BalanceInicialItem } from '../store';
import { toast } from 'react-hot-toast';
import { exportRawDataToXLSX } from '../utils/export';
import ConfirmModal from './shared/ConfirmModal';

type SectionType = 'activo_corriente' | 'activo_no_corriente' | 'pasivo_corriente' | 'pasivo_no_corriente' | 'patrimonio' | 'otros';

interface LineData extends BalanceInicialItem {
  section: SectionType;
}

const FormattedNumberInput = ({
  initialValue,
  onUpdate,
  className,
  placeholder
}: {
  initialValue: number | string;
  onUpdate: (value: number) => void;
  className?: string;
  placeholder?: string;
}) => {
  const [val, setVal] = useState(() => {
    const num = Number(initialValue);
    if (!num) return '';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/[^0-9.]/g, '');
    
    // Prevent multiple dots
    const dots = input.match(/\./g);
    if (dots && dots.length > 1) {
      input = input.substring(0, input.lastIndexOf('.'));
    }

    if (input === '') {
      setVal('');
      return;
    }

    const split = input.split('.');
    let intPart = split[0];
    const decPart = split.length > 1 ? '.' + split[1].substring(0, 2) : '';

    if (intPart !== '') {
      intPart = parseInt(intPart, 10).toLocaleString('en-US');
    } else if (input.startsWith('.')) {
      intPart = '0';
    }

    setVal(intPart + decPart);
  };

  const handleBlur = () => {
    const num = parseFloat(val.replace(/,/g, ''));
    if (!isNaN(num) && num !== 0) {
      setVal(num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      onUpdate(num);
    } else {
      setVal('');
      onUpdate(0);
    }
  };

  return (
    <input
      type="text"
      value={val}
      onChange={handleChange}
      onFocus={(e) => e.target.select()}
      onMouseDown={(e) => {
        e.preventDefault();
        e.currentTarget.focus({ preventScroll: true });
      }}
      onBlur={handleBlur}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
      }}
      className={className}
      placeholder={placeholder}
    />
  );
};

const DescriptionInput = ({ initialValue, onUpdate, className }: { initialValue: string, onUpdate: (val: string) => void, className?: string }) => {
  const [val, setVal] = useState(initialValue);

  useEffect(() => {
    setVal(initialValue);
  }, [initialValue]);

  return (
    <input
      type="text"
      value={val}
      onChange={(e) => setVal(e.target.value.toUpperCase())}
      onFocus={(e) => e.target.select()}
      onMouseDown={(e) => {
        e.preventDefault();
        e.currentTarget.focus({ preventScroll: true });
      }}
      onBlur={() => onUpdate(val)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
      }}
      className={className}
      placeholder="Descripción..."
    />
  );
};

const DEFAULT_STRUCTURE: Omit<LineData, 'id' | 'workspace_id' | 'debe' | 'haber'>[] = [
  // ACTIVO CORRIENTE
  { desc: 'Caja y Bancos', section: 'activo_corriente', cta: '101' },
  { desc: 'Valores Negociables', section: 'activo_corriente', cta: '111' },
  { desc: 'Cuentas por Cobrar Comerciales', section: 'activo_corriente', cta: '121' },
  { desc: 'Cuentas por Cobrar a Vinculadas', section: 'activo_corriente', cta: '131' },
  { desc: 'Otras Cuentas por Cobrar', section: 'activo_corriente', cta: '141' },
  { desc: 'Existencias', section: 'activo_corriente', cta: '201' },
  { desc: 'Gastos Pagados por Anticipado', section: 'activo_corriente', cta: '181' },
  
  // ACTIVO NO CORRIENTE
  { desc: 'Inmuebles, Maquinaria y Equipo', section: 'activo_no_corriente', cta: '331' },
  { desc: 'Activos Intangibles', section: 'activo_no_corriente', cta: '341' },

  // PASIVO CORRIENTE
  { desc: 'Sobregiros y Pagarés Bancarios', section: 'pasivo_corriente', cta: '451' },
  { desc: 'Cuentas por Pagar Comerciales', section: 'pasivo_corriente', cta: '421' },
  { desc: 'Cuentas por Pagar a Vinculadas', section: 'pasivo_corriente', cta: '431' },
  { desc: 'Otras Cuentas por Pagar', section: 'pasivo_corriente', cta: '461' },

  // PATRIMONIO
  { desc: 'Capital', section: 'patrimonio', cta: '501' },
  { desc: 'Resultados Acumulados', section: 'patrimonio', cta: '591' },
];

const BalanceInicialView: React.FC = () => {
  const { currentCompany, plan, balanceInicial, saveBalanceInicialItem, deleteBalanceInicialItem, setDraftAsiento, setActiveTab, addAccount } = useStore();
  
  const [showAccountModal, setShowAccountModal] = useState<string | null>(null);
  const [searchAccount, setSearchAccount] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Combine default structure with saved data
  const items = useMemo(() => {
    // If we have data in the DB, show ONLY that data
    // This allows rows to be truly deleted once the balance is initialized.
    if (balanceInicial.length > 0) {
      const data: LineData[] = balanceInicial.map(item => {
        let section: SectionType = 'otros';
        const cta = item.cta || '';
        if (cta.startsWith('1') || cta.startsWith('2') || cta.startsWith('3')) {
          section = cta.startsWith('3') ? 'activo_no_corriente' : 'activo_corriente';
        } else if (cta.startsWith('4')) {
          section = (cta.startsWith('45') || cta.startsWith('46')) ? 'pasivo_no_corriente' : 'pasivo_corriente';
        } else if (cta.startsWith('5')) {
          section = 'patrimonio';
        }
        return { ...item, section };
      });
      return data.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
    }

    // If DB is empty, show the default structure
    return DEFAULT_STRUCTURE.map((d, i) => ({
      id: `fixed-${i}`,
      cta: d.cta,
      desc: d.desc,
      debe: 0,
      haber: 0,
      section: d.section as SectionType
    })).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  }, [balanceInicial]);

  const handleUpdateItem = async (id: string, updates: Partial<LineData>) => {
    // If DB is empty, initialize the structure first to prevent others from disappearing
    if (balanceInicial.length === 0) {
      await handleInitialize();
    }

    const item = items.find(i => i.id === id);
    if (!item) return;

    const updated = { 
        id, 
        cta: item.cta || '', 
        desc: item.desc || '', 
        debe: item.debe || 0, 
        haber: item.haber || 0,
        ...updates 
    };
    
    await saveBalanceInicialItem(updated);
  };

  const handleSafeDelete = async (id: string) => {
    // Auto-initialize if empty before deleting to keep the rest of the structure
    if (balanceInicial.length === 0) {
      await handleInitialize();
    }
    setConfirmDelete(id);
  };

  const executeDelete = async () => {
    if (confirmDelete) {
      await deleteBalanceInicialItem(confirmDelete);
      setConfirmDelete(null);
      toast.success('Fila eliminada correctamente');
    }
  };

  const handleInitialize = async () => {
    setIsInitializing(true);
    try {
      for (let i = 0; i < DEFAULT_STRUCTURE.length; i++) {
        const d = DEFAULT_STRUCTURE[i];
        await saveBalanceInicialItem({
          id: `fixed-${i}`,
          cta: d.cta,
          desc: d.desc,
          debe: 0,
          haber: 0
        });
      }
      toast.success('Formato inicializado correctamente');
    } catch (error) {
      toast.error('Error al inicializar formato');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleAddRow = async (section: SectionType) => {
    // Auto-initialize if empty to prevent data loss
    if (balanceInicial.length === 0) {
      await handleInitialize();
    }

    const id = `custom-${Date.now()}`;
    let defaultCta = '10';
    if (section === 'activo_no_corriente') defaultCta = '33';
    else if (section === 'pasivo_corriente') defaultCta = '40';
    else if (section === 'pasivo_no_corriente') defaultCta = '45';
    else if (section === 'patrimonio') defaultCta = '50';

    const newItem: BalanceInicialItem = {
      id,
      cta: defaultCta,
      desc: 'NUEVA CUENTA',
      debe: 0,
      haber: 0
    };
    await saveBalanceInicialItem(newItem);
    setShowAccountModal(id);
  };

  const calculateTotal = (section?: SectionType | 'activo' | 'pasivo_patrimonio') => {
    return items.reduce((sum, i) => {
      if (section === 'activo' && i.section.startsWith('activo')) return sum + i.debe;
      if (section === 'pasivo_patrimonio' && (i.section.startsWith('pasivo') || i.section === 'patrimonio' || i.section === 'otros')) return sum + i.haber;
      if (i.section === section) return sum + (i.debe || i.haber);
      return sum;
    }, 0);
  };

  const totalActivo = calculateTotal('activo');
  const totalPasivoPatrimonio = calculateTotal('pasivo_patrimonio');
  const diff = Math.abs(totalActivo - totalPasivoPatrimonio);

  const getFilteredAccounts = () => {
    const activeItem = items.find(i => i.id === showAccountModal);
    if (!activeItem) return plan;

    let prefixes: string[] = [];
    if (activeItem.section === 'activo_corriente') prefixes = ['1', '2'];
    else if (activeItem.section === 'activo_no_corriente') prefixes = ['3'];
    else if (activeItem.section.startsWith('pasivo')) prefixes = ['4'];
    else if (activeItem.section === 'patrimonio') prefixes = ['5'];

    return plan.filter(a => {
        const matchesSearch = a.cta.includes(searchAccount) || a.description.toLowerCase().includes(searchAccount.toLowerCase());
        const matchesPrefix = prefixes.length === 0 || prefixes.some(p => a.cta.startsWith(p));
        return matchesSearch && (searchAccount ? true : matchesPrefix);
    });
  };

  const handleExportExcel = () => {
    const rows: (string | number | undefined)[][] = [
      ['LIBRO DE INVENTARIOS Y BALANCES - BALANCE GENERAL'],
      ['EJERCICIO:', currentCompany?.period],
      ['RUC:', currentCompany?.ruc],
      ['RAZÓN SOCIAL:', currentCompany?.name],
      [],
      ['ACTIVO', 'SALDO', '', 'PASIVO Y PATRIMONIO', 'SALDO'],
    ];

    // Build side-by-side rows
    const activoRows = items.filter(i => i.section.startsWith('activo'));
    const pasivoRows = items.filter(i => !i.section.startsWith('activo'));
    const maxRows = Math.max(activoRows.length, pasivoRows.length);

    for (let i = 0; i < maxRows; i++) {
        const act = activoRows[i];
        const pas = pasivoRows[i];
        rows.push([
            act ? act.desc : '', act ? act.debe : '',
            '',
            pas ? pas.desc : '', pas ? pas.haber : ''
        ]);
    }
    
    rows.push(['TOTAL ACTIVO', totalActivo, '', 'TOTAL PASIVO Y PATR.', totalPasivoPatrimonio]);

    exportRawDataToXLSX(`Balance_Inicial_${currentCompany?.ruc || '0'}`, rows as any);
  };

  const renderSection = (title: string, type: SectionType, isRight: boolean = false) => {
    const sectionItems = items.filter(i => i.section === type);
    return (
      <div className="mb-4">
        <div className="flex justify-between items-center bg-slate-50 border-b border-slate-300 px-2 py-1">
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{title}</span>
          <button onClick={() => handleAddRow(type)} className="p-1 hover:text-blue-600 transition-colors" title="Agregar fila">
            <Plus size={12} />
          </button>
        </div>
        {sectionItems.map(item => (
          <div key={item.id} className="flex h-9 border-b border-slate-200 group hover:bg-blue-50/30">
            <div className="flex-1 border-r border-slate-200 flex items-center">
              <DescriptionInput 
                initialValue={item.desc}
                onUpdate={(val) => handleUpdateItem(item.id, { desc: val })}
                className="w-full bg-transparent outline-none text-[11px] font-medium uppercase px-2"
              />
            </div>
            <div className="w-20 border-r border-slate-200 flex items-center justify-center">
              <button 
                onClick={() => setShowAccountModal(item.id)}
                className={`text-[9px] font-black px-2 py-0.5 rounded transition-colors ${item.cta ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-rose-500 text-white animate-pulse hover:bg-rose-600'}`}
                title="Asociar cuenta"
              >
                {item.cta || '??'}
              </button>
            </div>
            <div className="w-32 relative flex items-center">
              <FormattedNumberInput
                initialValue={isRight ? (item.haber || '') : (item.debe || '')}
                onUpdate={(val) => handleUpdateItem(item.id, isRight ? { haber: val, debe: 0 } : { debe: val, haber: 0 })}
                className="w-full bg-transparent outline-none text-right font-mono text-[11px] font-bold pr-2"
                placeholder="0.00"
              />
              <button 
                onClick={() => handleSafeDelete(item.id)} 
                className="absolute -left-6 opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 p-1 transition-opacity"
                title="Eliminar fila"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 overflow-hidden">
      {/* Header Toolbar */}
      <div className="h-14 px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-sm z-30">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <Calculator size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-tighter">Balance Inicial Inteligente</h1>
            <p className={`text-[9px] font-bold uppercase ${diff < 0.01 ? 'text-emerald-600' : 'text-rose-500'}`}>
               {diff < 0.01 ? '✓ Balance Cuadrado' : `⚠ Descuadre: S/ ${diff.toFixed(2)}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} className="h-9 px-4 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase flex items-center gap-2">
            <Printer size={15} /> Imprimir
          </button>
          <button onClick={handleExportExcel} className="h-9 px-4 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase flex items-center gap-2">
            <FileDown size={15} /> Excel
          </button>
          <div className="flex gap-4">
            <button 
              onClick={() => {
                const journalLines = items
                  .filter(i => i.debe > 0 || i.haber > 0)
                  .map((i, index) => {
                    let finalDebe = i.debe || 0;
                    let finalHaber = i.haber || 0;

                    // Lógica automática para cuentas de valuación (19, 29, 39)
                    // Si el usuario las ingresó en el Activo (Debe), se trasladan al Haber para el asiento.
                    if (i.cta.startsWith('19') || i.cta.startsWith('29') || i.cta.startsWith('39')) {
                      if (finalDebe > 0) {
                        finalHaber = finalDebe;
                        finalDebe = 0;
                      }
                    }

                    return {
                      id: index + 1,
                      cuenta: i.cta,
                      detalle: i.desc,
                      debe: finalDebe,
                      haber: finalHaber
                    };
                  });

                setDraftAsiento({
                  header: {
                    asiento: '', 
                    fecEmi: `${currentCompany?.period}-01-01`,
                    glosa: `ASIENTO DE APERTURA - ${currentCompany?.period}`,
                    anio: String(currentCompany?.period),
                    mes: '00'
                  },
                  lines: journalLines,
                  editingId: null
                } as any);
                setActiveTab('ASIENTOS');
              }}
              className="h-10 px-6 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg flex items-center gap-2"
            >
              <CheckCircle2 size={16} /> Generar Asiento
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar overscroll-contain">
        <div className="max-w-7xl mx-auto my-10 bg-white shadow-2xl p-12 border border-slate-200 rounded-sm min-h-[1200px] print:p-0 print:shadow-none print:border-none">
          
          {/* Header Info */}
          <div className="mb-8 border-b border-slate-800 pb-4">
            <h2 className="text-sm font-black uppercase mb-4 tracking-tighter">FORMATO 3.1 : "LIBRO DE INVENTARIOS Y BALANCES - BALANCE GENERAL"</h2>
            <div className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-1 text-[11px] font-bold">
              <span className="text-slate-500 uppercase">EJERCICIO:</span>
              <span className="text-slate-900">{currentCompany?.period}</span>
              <span className="text-slate-500 uppercase">RUC:</span>
              <span className="text-slate-900">{currentCompany?.ruc}</span>
              <span className="text-slate-500 uppercase">RAZÓN SOCIAL:</span>
              <span className="text-slate-900 uppercase">{currentCompany?.name}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10">
            {/* LEFT: ACTIVO */}
            <div className="border border-slate-300">
               <div className="flex bg-slate-900 text-white font-black text-[10px] uppercase">
                  <div className="flex-1 border-r border-slate-700 p-2">ACTIVO</div>
                  <div className="w-32 p-2 text-center">EJERCICIO O PERIODO</div>
               </div>
               {renderSection("Activo Corriente", "activo_corriente")}
               {renderSection("Activo No Corriente", "activo_no_corriente")}
               <div className="flex bg-slate-100 border-t-2 border-slate-800 font-black p-2">
                  <div className="flex-1 text-[11px] uppercase">TOTAL ACTIVO</div>
                  <div className="w-32 text-right font-mono text-xs">{totalActivo.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
               </div>
            </div>

            {/* RIGHT: PASIVO/PATRIMONIO */}
            <div className="border border-slate-300">
               <div className="flex bg-slate-900 text-white font-black text-[10px] uppercase">
                  <div className="flex-1 border-r border-slate-700 p-2">PASIVO Y PATRIMONIO</div>
                  <div className="w-32 p-2 text-center">EJERCICIO O PERIODO</div>
               </div>
               {renderSection("Pasivo Corriente", "pasivo_corriente", true)}
               {renderSection("Pasivo No Corriente", "pasivo_no_corriente", true)}
               {renderSection("Patrimonio Neto", "patrimonio", true)}
               <div className="flex bg-slate-100 border-t-2 border-slate-800 font-black p-2">
                  <div className="flex-1 text-[11px] uppercase">TOTAL PASIVO Y PATRIMONIO</div>
                  <div className="w-32 text-right font-mono text-xs">{totalPasivoPatrimonio.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
               </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={!!confirmDelete}
        title="¿Eliminar Fila?"
        message="¿Estás seguro de que deseas eliminar esta cuenta del balance? Esta acción no se puede deshacer."
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* Account Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
               <h3 className="text-xs font-black uppercase tracking-widest">Asociar Cuenta Contable</h3>
               <button onClick={() => setShowAccountModal(null)}><X size={20} /></button>
            </div>
            <div className="p-6">
              <input 
                type="text" autoFocus placeholder="Buscar cuenta..." value={searchAccount}
                onChange={e => setSearchAccount(e.target.value)}
                className="w-full h-12 px-4 bg-slate-100 rounded-xl text-xs font-bold mb-4 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="max-h-80 overflow-auto space-y-1">
                {getFilteredAccounts().map(acc => (
                  <button
                    key={acc.cta}
                    onClick={() => {
                      handleUpdateItem(showAccountModal, { cta: acc.cta, desc: acc.description.toUpperCase() });
                      setShowAccountModal(null);
                      setSearchAccount('');
                    }}
                    className="w-full flex items-center gap-4 p-3 hover:bg-blue-50 rounded-lg text-left group"
                  >
                    <span className="font-mono text-xs font-black text-blue-600 bg-blue-50 px-2 rounded">{acc.cta}</span>
                    <span className="text-[10px] font-bold uppercase text-slate-700">{acc.description}</span>
                  </button>
                ))}

                {getFilteredAccounts().length === 0 && searchAccount.length >= 2 && (
                  <div className="p-4 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-3 italic">La cuenta {searchAccount} no existe</p>
                    <button 
                      onClick={async () => {
                        const activeItem = items.find(i => i.id === showAccountModal);
                        const newAccount = {
                          cta: searchAccount,
                          description: (activeItem?.desc || 'NUEVA CUENTA').toUpperCase(),
                          type: 'Balance' as const
                        };
                        await addAccount(newAccount);
                        await handleUpdateItem(showAccountModal, { cta: newAccount.cta, desc: newAccount.description });
                        setShowAccountModal(null);
                        setSearchAccount('');
                      }}
                      className="w-full h-10 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-md"
                    >
                      <Plus size={14} /> Crear y Asociar Cuenta
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalanceInicialView;
