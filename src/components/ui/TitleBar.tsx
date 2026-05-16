import React, { useState, useEffect } from 'react';
import { Minus, Square, X, Copy } from 'lucide-react';

const TitleBar: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const checkMaximized = async () => {
      try {
        if ((window as any).electronAPI?.winIsMaximized) {
          const res = await (window as any).electronAPI.winIsMaximized();
          setIsMaximized(res);
        }
      } catch (e) {
        console.warn("Error checking window state:", e);
      }
    };
    
    checkMaximized();
    window.addEventListener('resize', checkMaximized);
    return () => window.removeEventListener('resize', checkMaximized);
  }, []);

  const handleMinimize = () => (window as any).electronAPI?.winMinimize();
  const handleMaximize = () => (window as any).electronAPI?.winMaximize();
  const handleClose = () => (window as any).electronAPI?.winClose();

  return (
    <div className="h-8 bg-app-surface border-b border-app-border flex items-center justify-between select-none drag-region shrink-0 z-[999] relative">
      {/* Left side empty - Area de arrastre */}
      <div className="flex-1 h-full drag-region" />

      {/* Decorative center element */}
      <div className="hidden md:flex items-center gap-1 opacity-10">
        <div className="w-0.5 h-0.5 rounded-full bg-app-text" />
        <div className="w-0.5 h-0.5 rounded-full bg-app-text" />
        <div className="w-0.5 h-0.5 rounded-full bg-app-text" />
      </div>

      <div className="flex-1 h-full flex justify-end">
        {/* Window Controls */}
        <div className="flex items-center h-full no-drag">
          {/* Minimize */}
          <button
            onClick={handleMinimize}
            className="w-10 h-full flex items-center justify-center text-app-muted hover:bg-app-hover hover:text-app-text transition-all no-drag"
            title="Minimizar"
          >
            <Minus size={14} strokeWidth={2} />
          </button>

          {/* Maximize / Restore */}
          <button
            onClick={handleMaximize}
            className="w-10 h-full flex items-center justify-center text-app-muted hover:bg-app-hover hover:text-app-text transition-all no-drag"
            title={isMaximized ? "Restaurar" : "Maximizar"}
          >
            {isMaximized ? <Copy size={13} strokeWidth={2} /> : <Square size={13} strokeWidth={2} />}
          </button>

          {/* Close */}
          <button
            onClick={handleClose}
            className="w-10 h-full flex items-center justify-center text-app-muted hover:bg-red-600 hover:text-white transition-all no-drag group"
            title="Cerrar"
          >
            <X size={17} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TitleBar;
