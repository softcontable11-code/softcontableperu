import React from 'react';
import { Landmark, Printer, FileDown } from 'lucide-react';
import { useStore } from '../store';
import { exportRawDataToXLSX } from '../utils/export';

const ReportLine: React.FC<{ label: string; value: number; indent?: boolean }> = ({ label, value, indent }) => (
  <div className={`flex justify-between text-[11px] py-0.5 border-b border-app-border/50 ${indent ? 'pl-4' : ''}`}>
    <span className={indent ? 'text-app-muted font-sans' : 'font-black uppercase tracking-wider'}>{label}</span>
    <span className="font-mono">{value !== 0 ? value.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}</span>
  </div>
);

const BalanceView: React.FC = () => {
  const { currentCompany } = useStore();
  const journal = useStore().journal.filter(entry => entry.cta.trim().toUpperCase() !== 'GLOSA');

  // Logic to derive balance amounts from journal
  const accountBalances = journal.reduce((acc, entry) => {
    acc[entry.cta] = (acc[entry.cta] || 0) + (entry.debe - entry.haber);
    return acc;
  }, {} as Record<string, number>);

  const getSum = (prefixes: string[]) => {
    return Object.entries(accountBalances).reduce((sum, [cta, bal]) => {
      if (prefixes.some(p => cta.startsWith(p))) return sum + bal;
      return sum;
    }, 0);
  };

  // Activo
  const efectivo = getSum(['10']);
  const ctasPorCobrar = getSum(['12', '13']);
  const otrasCtasPorCobrar = getSum(['14', '16', '17']);
  const existencias = getSum(['20', '21', '22', '23', '24', '25', '26', '27', '28', '29']);
  const activoFijoNeto = getSum(['33', '34', '35']) + getSum(['39']); // 39 is negative
  const otrosActivos = getSum(['11', '15', '18', '19', '31', '32', '37', '38']);
  
  const totalActivo = efectivo + ctasPorCobrar + otrasCtasPorCobrar + existencias + activoFijoNeto + otrosActivos;

  // Pasivo
  const tributos = -getSum(['40']);
  const remunPorPagar = -getSum(['41']);
  const ctasPorPagar = -getSum(['42', '43']);
  const obligacionesFinan = -getSum(['45']);
  const otrasCtasPorPagar = -getSum(['44', '46', '47', '48', '49']);
  
  const totalPasivo = tributos + remunPorPagar + ctasPorPagar + obligacionesFinan + otrasCtasPorPagar;

  // Patrimonio
  const capital = -getSum(['50', '51', '52']);
  const reservas = -getSum(['56', '57', '58']);
  const resultadosAcumulados = -getSum(['59']);
  
  // Utilidad = Assets - Liabilities - Equity already booked = remaining balance of classes 1-5
  // In our debit-positive convention: Sum(1-5) = Assets(+) + Liabilities(-) + Patrimonio(-) = CurrentUtilidad
  const utilidadEjercicio = totalActivo - totalPasivo - capital - reservas - resultadosAcumulados;

  const totalPatrimonio = capital + reservas + resultadosAcumulados + utilidadEjercicio;

  const handleExport = () => {
    exportRawDataToXLSX('Estado_de_Situacion_Financiera', [
      ['ESTADO DE SITUACION FINANCIERA CONSOLIDADO'],
      ['EMPRESA:', currentCompany.name],
      ['RUC:', currentCompany.ruc],
      [],
      ['ACTIVO', '', '', 'PASIVO Y PATRIMONIO', ''],
      ['ACTIVO CORRIENTE', '', '', 'PASIVO CORRIENTE', ''],
      ['Efectivo y Equivalentes de Efectivo', efectivo.toFixed(2), '', 'Tributos por Pagar', tributos.toFixed(2)],
      ['Ctas por Cobrar Comerciales - Terc', ctasPorCobrar.toFixed(2), '', 'Remuneraciones por Pagar', remunPorPagar.toFixed(2)],
      ['Otras Ctas por Cobrar', otrasCtasPorCobrar.toFixed(2), '', 'Ctas por Pagar Comerciales - Terc', ctasPorPagar.toFixed(2)],
      ['Existencias / Mercaderias', existencias.toFixed(2), '', 'Obligaciones Financieras', obligacionesFinan.toFixed(2)],
      ['Otros Activos Corrientes', (otrosActivos > 0 ? otrosActivos : 0).toFixed(2), '', 'Otras Ctas por Pagar', otrasCtasPorPagar.toFixed(2)],
      ['TOTAL ACTIVO CORRIENTE', (efectivo + ctasPorCobrar + otrasCtasPorCobrar + existencias + (otrosActivos > 0 ? otrosActivos : 0)).toFixed(2), '', 'TOTAL PASIVO CORRIENTE', totalPasivo.toFixed(2)],
      [],
      ['ACTIVO NO CORRIENTE', '', '', 'PATRIMONIO', ''],
      ['Inmuebles, Maquinaria y Equipo (Neto)', activoFijoNeto.toFixed(2), '', 'Capital Social', capital.toFixed(2)],
      ['Otros Activos no Corrientes', (otrosActivos < 0 ? -otrosActivos : 0).toFixed(2), '', 'Excedente de Revaluación/Reservas', reservas.toFixed(2)],
      ['', '', '', 'Resultados Acumulados', resultadosAcumulados.toFixed(2)],
      ['', '', '', 'Resultados del Ejercicio', utilidadEjercicio.toFixed(2)],
      ['TOTAL ACTIVO NO CORRIENTE', (activoFijoNeto + (otrosActivos < 0 ? -otrosActivos : 0)).toFixed(2), '', 'TOTAL PATRIMONIO', totalPatrimonio.toFixed(2)],
      [],
      ['TOTAL ACTIVO', totalActivo.toFixed(2), '', 'TOTAL PASIVO Y PATRIMONIO', (totalPasivo + totalPatrimonio).toFixed(2)],
    ]);
  };

  return (
    <div className="flex flex-col h-full bg-app-bg text-app-text animate-slide-up relative">

      {/* Header Toolbar */}
      <div className="h-12 px-5 bg-app-surface border-b border-app-border flex items-center justify-between shrink-0 toolbar">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pld-blue/10 rounded-lg">
            <Landmark size={16} className="text-pld-blue" />
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-app-text">Estado de Situación Consolidado</h2>
            <div className="flex gap-3 text-[9px] items-center text-app-muted">
               <span>AL 31 DE DICIEMBRE DEL {currentCompany.period || '2025'}</span>
               <span>(Nuevos Soles)</span>
               <span>RUC: {currentCompany.ruc}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={() => window.print()} className="h-8 px-3 bg-app-bg border border-app-border rounded-lg hover:text-pld-blue transition-colors flex items-center gap-1.5 text-[10px] font-bold text-app-muted" title="Imprimir"><Printer size={14} /> Imprimir</button>
           <button onClick={handleExport} className="h-8 px-3 bg-app-bg border border-app-border rounded-lg hover:text-pld-blue transition-colors flex items-center gap-1.5 text-[10px] font-bold text-app-muted" title="Excel"><FileDown size={14} /> Excel</button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto bg-app-surface border border-app-border shadow-2xl p-10 rounded-sm relative">
          
          <div className="grid grid-cols-2 gap-16">
            
            {/* LEFT COLUMN: ACTIVO */}
            <div className="space-y-6">
              <h3 className="text-sm font-black border-b-2 border-app-border pb-1 tracking-[0.3em] mb-4">A C T I V O</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] font-black text-pld-blue underline decoration-pld-blue/30 mb-2">ACTIVO CORRIENTE</h4>
                  <ReportLine label="Efectivo y Equivalentes de Efectivo" value={efectivo} indent />
                  <ReportLine label="Ctas por Cobrar Comerciales - Terc" value={ctasPorCobrar} indent />
                  <ReportLine label="Otras Ctas por Cobrar" value={otrasCtasPorCobrar} indent />
                  <ReportLine label="Existencias / Mercaderias" value={existencias} indent />
                  <ReportLine label="Otros Activos Corrientes" value={otrosActivos > 0 ? otrosActivos : 0} indent />
                  <div className="flex justify-end pt-1">
                    <span className="font-mono text-xs border-t border-app-border pt-1 w-32 text-right">
                      {(efectivo + ctasPorCobrar + otrasCtasPorCobrar + existencias + (otrosActivos > 0 ? otrosActivos : 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-pld-blue underline decoration-pld-blue/30 mb-2 mt-4">ACTIVO NO CORRIENTE</h4>
                  <ReportLine label="Inmuebles, Maquinaria y Equipo (Neto)" value={activoFijoNeto} indent />
                  <ReportLine label="Otros Activos no Corrientes" value={otrosActivos < 0 ? -otrosActivos : 0} indent />
                  <div className="flex justify-end pt-1">
                    <span className="font-mono text-xs border-t border-app-border pt-1 w-32 text-right">
                      {(activoFijoNeto + (otrosActivos < 0 ? -otrosActivos : 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-10 flex justify-between items-center border-t-2 border-app-border/80">
                <span className="text-xs font-black tracking-widest uppercase">TOTAL ACTIVO</span>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] text-app-muted">S/.</span>
                   <span className="text-lg font-mono font-bold text-pld-blue border-b-4 border-double border-pld-blue/40">
                    {totalActivo.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                   </span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: PASIVO Y PATRIMONIO */}
            <div className="space-y-6">
              <h3 className="text-sm font-black border-b-2 border-app-border pb-1 tracking-[0.3em] mb-4 text-right">P A S I V O</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] font-black text-red-500 underline decoration-red-500/30 mb-2">PASIVO CORRIENTE</h4>
                  <ReportLine label="Tributos por Pagar" value={tributos} indent />
                  <ReportLine label="Remuneraciones por Pagar" value={remunPorPagar} indent />
                  <ReportLine label="Ctas por Pagar Comerciales - Terc" value={ctasPorPagar} indent />
                  <ReportLine label="Obligaciones Financieras" value={obligacionesFinan} indent />
                  <ReportLine label="Otras Ctas por Pagar" value={otrasCtasPorPagar} indent />
                  <div className="flex justify-end pt-1">
                    <span className="font-mono text-xs border-t border-app-border pt-1 w-32 text-right">
                      {totalPasivo.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-pld-magenta underline decoration-pld-magenta/30 mb-4 mt-4 uppercase tracking-widest">Patrimonio</h4>
                  <ReportLine label="Capital Social" value={capital} indent />
                  <ReportLine label="Excedente de Revaluación/Reservas" value={reservas} indent />
                  <ReportLine label="Resultados Acumulados" value={resultadosAcumulados} indent />
                  <ReportLine label="Resultados del Ejercicio" value={utilidadEjercicio} indent />
                  <div className="flex justify-end pt-1">
                    <span className="font-mono text-xs border-t border-app-border pt-1 w-32 text-right">
                      {totalPatrimonio.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-10 flex justify-between items-center border-t-2 border-app-border/80">
                <span className="text-xs font-black tracking-widest uppercase">TOTAL PASIVO Y PATR.</span>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] text-app-muted">S/.</span>
                   <span className="text-lg font-mono font-bold text-app-text border-b-4 border-double border-app-text/40">
                    {(totalPasivo + totalPatrimonio).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                   </span>
                </div>
              </div>
            </div>

          </div>

          <div className="mt-12 pt-4 border-t border-app-border/50 text-right flex justify-between items-center bg-app-bg px-4 py-2 rounded">
             <span className="text-[9px] text-app-muted font-bold uppercase tracking-widest">Diferencia Balance Activo/Pasivo+Patr</span>
             <span className="font-mono text-sm text-app-muted">
              {Math.abs(totalActivo - (totalPasivo + totalPatrimonio)).toFixed(2)}
             </span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BalanceView;
