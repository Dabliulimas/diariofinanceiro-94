
import React, { useState, useRef, useEffect } from 'react';
import { formatCurrency, parseCurrency, formatNumberForEditing } from '../utils/currencyUtils';

interface FluidNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: (value: string) => void;
  placeholder?: string;
  className?: string;
  color: 'green' | 'red' | 'blue';
}

const FluidNumberInput: React.FC<FluidNumberInputProps> = ({
  value,
  onChange,
  onBlur,
  placeholder = "0,00",
  className = "",
  color
}) => {
  const [localValue, setLocalValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isFocused) {
      setLocalValue(value);
    }
  }, [value, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    // Convert currency back to plain number for editing
    const numericValue = parseCurrency(value);
    const displayValue = numericValue === 0 ? "" : formatNumberForEditing(numericValue);
    setLocalValue(displayValue);
    setTimeout(() => {
      inputRef.current?.select();
    }, 0);
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur(localValue);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow numbers, comma, and dot
    if (/^\d*[,.]?\d*$/.test(inputValue)) {
      setLocalValue(inputValue);
      onChange(inputValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow navigation and editing keys
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight',
      'ArrowUp', 'ArrowDown', 'Home', 'End'
    ];
    
    if (allowedKeys.includes(e.key)) {
      return;
    }
    
    // Allow Ctrl+A, Ctrl+C, Ctrl+V
    if (e.ctrlKey && ['a', 'c', 'v'].includes(e.key.toLowerCase())) {
      return;
    }
    
    // Allow numbers, comma and dot
    if (!/[\d,.]/.test(e.key)) {
      e.preventDefault();
    }
    
    // Prevent multiple decimal separators
    if ((e.key === ',' || e.key === '.') && (localValue.includes(',') || localValue.includes('.'))) {
      e.preventDefault();
    }
  };

  const colorClasses = {
    green: 'border-green-300 focus:ring-green-500 focus:border-green-500',
    red: 'border-red-300 focus:ring-red-500 focus:border-red-500',
    blue: 'border-blue-300 focus:ring-blue-500 focus:border-blue-500'
  };

  const displayValue = isFocused ? localValue : value;

  return (
    <input
      ref={inputRef}
      type="text"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={`px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-opacity-50 transition-colors ${colorClasses[color]} ${className}`}
    />
  );
};

export { FluidNumberInput };
