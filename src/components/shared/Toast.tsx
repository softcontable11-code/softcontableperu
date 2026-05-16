import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastData {
  type: ToastType;
  message: string;
}

interface ToastProps extends ToastData {
  onClose: () => void;
  duration?: number;
}

const TOAST_STYLES: Record<ToastType, string> = {
  success: 'bg-emerald-50 dark:bg-emerald-900/90 border-emerald-200 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300',
  error: 'bg-red-50 dark:bg-red-900/90 border-red-200 dark:border-red-500/40 text-red-700 dark:text-red-300',
  info: 'bg-blue-50 dark:bg-blue-900/90 border-blue-200 dark:border-blue-500/40 text-blue-700 dark:text-blue-300',
  warning: 'bg-amber-50 dark:bg-amber-900/90 border-amber-200 dark:border-amber-500/40 text-amber-700 dark:text-amber-300',
};

const TOAST_ICONS: Record<ToastType, React.FC<{ size?: number }>> = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

/**
 * Toast notification — componente compartido
 */
const Toast: React.FC<ToastProps> = ({ type, message, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const Icon = TOAST_ICONS[type];

  return (
    <div className={`absolute top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg border animate-slide-up ${TOAST_STYLES[type]}`}>
      <Icon size={16} />
      <span className="text-[10px] font-bold uppercase tracking-wider">{message}</span>
    </div>
  );
};

export default Toast;
