import React from 'react';

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  accentColor?: string;
  children?: React.ReactNode; // right-side actions
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ icon, title, subtitle, accentColor = 'text-pld-blue', children }) => (
  <div className="h-14 px-6 bg-app-surface border-b border-app-border flex items-center justify-between shrink-0 glass z-10">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${accentColor.replace('text-', 'bg-').replace('pld-blue', 'pld-blue/10').replace('pld-magenta', 'pld-magenta/10')}`}>
        <span className={accentColor}>{icon}</span>
      </div>
      <div>
        <h2 className="font-black text-sm uppercase tracking-widest text-app-text">{title}</h2>
        {subtitle && <p className="text-[9px] text-app-muted uppercase tracking-wider">{subtitle}</p>}
      </div>
    </div>
    {children && <div className="flex items-center gap-2">{children}</div>}
  </div>
);

export default SectionHeader;
