import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    <div className="p-4 bg-app-hover rounded-2xl text-app-muted mb-4">
      {icon || <Inbox size={36} strokeWidth={1.5} />}
    </div>
    <h3 className="text-sm font-black uppercase tracking-widest text-app-text mb-1">{title}</h3>
    {description && (
      <p className="text-xs text-app-muted max-w-sm leading-relaxed">{description}</p>
    )}
    {action && (
      <button 
        onClick={action.onClick}
        className="mt-4 h-10 px-6 bg-pld-blue hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-pld-blue/20"
      >
        {action.label}
      </button>
    )}
  </div>
);

export default EmptyState;
