
import { useCallback } from 'react';
import { RecurringTransaction } from './useRecurringTransactions';

export const useRecurringProcessor = () => {
  const processRecurringTransactions = useCallback((
    recurringTransactions: RecurringTransaction[],
    year: number,
    month: number,
    addToDay: (year: number, month: number, day: number, type: 'entrada' | 'saida' | 'diario', amount: number) => void,
    updateRecurringTransaction: (id: string, updates: Partial<RecurringTransaction>) => void
  ) => {
    const activeTransactions = recurringTransactions.filter(t => t.isActive);
    
    console.log(`🔄 Processing ${activeTransactions.length} recurring transactions for ${year}-${month + 1}`);
    
    activeTransactions.forEach(transaction => {
      const { dayOfMonth, type, amount, frequency, remainingCount, id } = transaction;
      
      // Check if day exists in the current month
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const targetDay = Math.min(dayOfMonth, daysInMonth);
      
      console.log(`💰 Adding recurring ${type}: ${amount} on day ${targetDay}`);
      
      // Add to the appropriate day (entrada goes to entrada, saida goes to saida)
      addToDay(year, month, targetDay, type, amount);
      
      // Update remaining count for fixed-count transactions
      if (frequency === 'fixed-count' && remainingCount !== undefined) {
        const newCount = remainingCount - 1;
        if (newCount <= 0) {
          // Deactivate when count reaches zero
          updateRecurringTransaction(id, { isActive: false, remainingCount: 0 });
          console.log(`🔄 Deactivated recurring transaction ${id} - count reached zero`);
        } else {
          updateRecurringTransaction(id, { remainingCount: newCount });
          console.log(`🔄 Updated remaining count for ${id}: ${newCount}`);
        }
      }
    });
  }, []);

  return { processRecurringTransactions };
};
