import React from 'react';

interface DateInputProps {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
  onBlur?: () => void;
}

/**
 * Componente compartido para inputs de fecha con máscara automática DD/MM/YYYY.
 */
const DateInput: React.FC<DateInputProps> = ({
  value,
  onChange,
  className = '',
  placeholder = 'DD/MM/YYYY',
  required = false,
  onBlur
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    
    // Solo permitimos dígitos y limitamos a 8
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    
    // Aplicamos la máscara dinámicamente
    let formatted = digits;
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    } else if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    
    onChange(formatted);
  };

  return (
    <input
      type="text"
      className={className}
      value={value}
      onChange={handleChange}
      onBlur={onBlur}
      placeholder={placeholder}
      required={required}
      maxLength={10}
    />
  );
};

export default DateInput;
