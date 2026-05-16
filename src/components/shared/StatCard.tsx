import React from 'react';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  trend?: { label: string; positive: boolean };
  accentColor?: string; // tailwind color like 'emerald' | 'blue' | 'orange' | 'rose'
  onClick?: () => void;
  actionLabel?: string;
}

const colorMap: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'hover:border-emerald-500/40', badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  blue:    { bg: 'bg-pld-blue/10',     text: 'text-pld-blue',    border: 'hover:border-pld-blue/40',    badge: 'bg-pld-blue/10 text-pld-blue' },
  orange:  { bg: 'bg-orange-500/10',   text: 'text-orange-500',  border: 'hover:border-orange-500/40',  badge: 'bg-orange-500/10 text-orange-500' },
  rose:    { bg: 'bg-rose-500/10',     text: 'text-rose-500',    border: 'hover:border-rose-500/40',    badge: 'bg-rose-500/10 text-rose-500' },
  violet:  { bg: 'bg-violet-500/10',   text: 'text-violet-500',  border: 'hover:border-violet-500/40',  badge: 'bg-violet-500/10 text-violet-500' },
  amber:   { bg: 'bg-amber-500/10',    text: 'text-amber-500',   border: 'hover:border-amber-500/40',   badge: 'bg-amber-500/10 text-amber-500' },
};

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, subtitle, trend, accentColor = 'blue', onClick, actionLabel }) => {
  const c = colorMap[accentColor] || colorMap.blue;

  return (
    <div className={`glass rounded-2xl p-5 shadow-lg border border-app-border ${c.border} transition-all group`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-xl ${c.bg} ${c.text}`}>
          {icon}
        </div>
        <span className="text-[10px] font-bold tracking-widest text-app-muted uppercase">{label}</span>
      </div>
      <div className="flex flex-col">
        <h3 className="text-2xl font-black tracking-tighter">{value}</h3>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {trend && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${trend.positive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
              {trend.label}
            </span>
          )}
          {subtitle && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.badge}`}>
              {subtitle}
            </span>
          )}
          {onClick && actionLabel && (
            <button onClick={onClick} className={`text-[10px] text-app-muted hover:${c.text} underline group-hover:${c.text} transition-colors ml-auto`}>
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
