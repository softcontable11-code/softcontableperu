import React from 'react';
import { Plus, Settings, Zap } from 'lucide-react';

const XtraView: React.FC = () => {
  return (
    <div className="p-12 max-w-4xl mx-auto text-center space-y-8">
      <div className="inline-flex p-4 bg-pld-blue/20 rounded-full text-pld-blue">
        <Zap size={48} />
      </div>
      <h2 className="text-4xl font-black italic tracking-tighter">MÓDULOS ADICIONALES</h2>
      <p className="text-app-muted leading-relaxed">
        Este espacio está reservado para extensiones personalizadas, integraciones de API
        y configuraciones avanzadas del sistema.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-app-surface p-6 rounded-2xl border border-app-border hover:border-pld-blue/50 transition-all cursor-pointer group text-left">
            <Settings className="mb-4 text-pld-blue group-hover:rotate-90 transition-transform" />
            <h3 className="font-bold">Configuración</h3>
            <p className="text-xs text-app-muted">Preferencias del sistema y backups.</p>
        </div>
        <div className="bg-app-surface p-6 rounded-2xl border border-app-border hover:border-pld-blue/50 transition-all cursor-pointer group text-left">
            <Plus className="mb-4 text-pld-blue group-hover:scale-125 transition-transform" />
            <h3 className="font-bold">Solicitar Módulo</h3>
            <p className="text-xs text-app-muted">Desarrollo de nuevas funcionalidades.</p>
        </div>
      </div>
    </div>
  );
};

export default XtraView;
