import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, title, message, onConfirm, onCancel, 
  confirmLabel = 'Confirmar', cancelLabel = 'Cancelar',
  type = 'danger' 
}) => {
  if (!isOpen) return null;
  
  const isDanger = type === 'danger';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          <div className={`w-16 h-16 ${isDanger ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <AlertCircle size={32} />
          </div>
          <h3 className="text-lg font-black text-slate-900 mb-2 uppercase">{title}</h3>
          <p className="text-sm text-slate-600 font-medium mb-6">{message}</p>
          <div className="flex gap-3">
            <button 
              onClick={onCancel}
              className="flex-1 h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase transition-colors"
            >
              {cancelLabel}
            </button>
            <button 
              onClick={onConfirm}
              className={`flex-1 h-12 ${isDanger ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'} text-white rounded-xl text-xs font-black uppercase transition-all shadow-lg active:scale-95`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
