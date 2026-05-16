import React from 'react';

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  accent?: boolean;
  children: React.ReactNode;
  className?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  required,
  hint,
  error,
  accent,
  children,
  className = '',
}) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <label
      htmlFor={htmlFor}
      className={`text-[11px] font-bold uppercase tracking-wide ${
        accent ? 'text-pld-blue' : 'text-app-muted'
      }`}
    >
      {label}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
    {hint && !error && (
      <p className="text-[10px] text-app-muted/70 italic">{hint}</p>
    )}
    {error && (
      <p className="text-[10px] text-red-500 font-medium">{error}</p>
    )}
  </div>
);

export default FormField;
