import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const base = 'inline-flex items-center justify-center gap-2 font-bold uppercase tracking-wider rounded-lg transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pld-blue whitespace-nowrap select-none';

  const variants: Record<string, string> = {
    primary: 'bg-pld-blue text-white hover:bg-blue-700 shadow-sm shadow-pld-blue/20 active:scale-[0.98]',
    secondary: 'bg-app-bg border border-app-border text-app-text hover:border-pld-blue hover:text-pld-blue',
    danger: 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white',
    ghost: 'text-app-muted hover:bg-app-hover hover:text-app-text',
    success: 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-500/20',
  };

  const sizes: Record<string, string> = {
    sm: 'h-8 px-3 text-[10px]',
    md: 'h-9 px-4 text-[11px]',
    lg: 'h-10 px-5 text-xs',
  };

  const classes = [
    base,
    variants[variant] || '',
    sizes[size] || '',
    (disabled || loading) ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};

export default Button;
