
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amount);
};

export const parseCurrency = (value: string): number => {
  if (!value || value === "" || value === "R$ 0,00") return 0;
  
  console.log('Parsing currency value:', value);
  
  // Remove currency symbols, spaces and R$
  let cleaned = value.toString().replace(/[R$\s]/g, '');
  
  // Handle negative values
  const isNegative = cleaned.includes('-');
  cleaned = cleaned.replace('-', '');
  
  // Replace comma with dot for parsing - handle both decimal separators
  if (cleaned.includes(',')) {
    // If there's both comma and dot, assume comma is decimal separator
    const parts = cleaned.split(',');
    if (parts.length === 2) {
      // Remove any dots that might be thousand separators
      parts[0] = parts[0].replace(/\./g, '');
      cleaned = parts[0] + '.' + parts[1];
    }
  }
  
  const parsed = parseFloat(cleaned);
  const result = isNaN(parsed) ? 0 : parsed;
  
  console.log('Parsed result:', result, 'isNegative:', isNegative);
  
  return isNegative ? -result : result;
};

export const formatNumberForEditing = (value: number): string => {
  return Math.abs(value).toString().replace('.', ',');
};
