import React, { useState, useEffect } from 'react';

interface DecimalInputProps {
  value: number;
  onChange: (v: number) => void;
  className?: string;
  placeholder?: string;
  readOnly?: boolean;
  min?: number;
  max?: number;
}

/**
 * Componente compartido para inputs numéricos decimales.
 * Maneja correctamente el estado local del string mientras
 * el valor externo sigue siendo numérico.
 */
const DecimalInput: React.FC<DecimalInputProps> = ({
  value,
  onChange,
  className = '',
  placeholder,
  readOnly = false,
  min,
  max,
}) => {
  const [local, setLocal] = useState(value === 0 ? '' : value.toString());

  useEffect(() => {
    if (value === 0 && local !== '' && local !== '0' && local !== '0.') {
      setLocal('');
    } else if (
      value !== 0 &&
      parseFloat(local) !== value &&
      local !== value.toString() &&
      local !== value.toString() + '.'
    ) {
      setLocal(value.toString());
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocal(raw);
    let parsed = parseFloat(raw) || 0;
    if (min !== undefined && parsed < min) parsed = min;
    if (max !== undefined && parsed > max) parsed = max;
    onChange(parsed);
  };

  return (
    <input
      type="number"
      step="any"
      className={className}
      value={local}
      onChange={handleChange}
      placeholder={placeholder}
      readOnly={readOnly}
      min={min}
      max={max}
    />
  );
};

export default DecimalInput;
