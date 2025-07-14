
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
      const { dayOfMonth, type, amount, frequency, remainingCount, monthsDuration, remainingMonths, startDate, id } = transaction;
      
      // Check if this transaction should be processed for this month
      const startDateObj = new Date(startDate);
      const currentDate = new Date(year, month);
      
      // Skip if transaction hasn't started yet
      if (currentDate < new Date(startDateObj.getFullYear(), startDateObj.getMonth())) {
        return;
      }
      
      // Check if monthly duration has expired
      if (frequency === 'monthly-duration' && monthsDuration && remainingMonths !== undefined) {
        if (remainingMonths <= 0) {
          updateRecurringTransaction(id, { isActive: false });
          console.log(`🔄 Deactivated recurring transaction ${id} - monthly duration expired`);
          return;
        }
      }
      
      // Check if day exists in the current month
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const targetDay = Math.min(dayOfMonth, daysInMonth);
      
      console.log(`💰 Adding recurring ${type}: ${amount} on day ${targetDay}`);
      
      // Add to the appropriate day using the correct type (entrada/saida, not diario)
      addToDay(year, month, targetDay, type, amount);
      
      // Update counts based on frequency type
      if (frequency === 'fixed-count' && remainingCount !== undefined) {
        const newCount = remainingCount - 1;
        if (newCount <= 0) {
          updateRecurringTransaction(id, { isActive: false, remainingCount: 0 });
          console.log(`🔄 Deactivated recurring transaction ${id} - count reached zero`);
        } else {
          updateRecurringTransaction(id, { remainingCount: newCount });
          console.log(`🔄 Updated remaining count for ${id}: ${newCount}`);
        }
      } else if (frequency === 'monthly-duration' && remainingMonths !== undefined) {
        const newMonthsRemaining = remainingMonths - 1;
        updateRecurringTransaction(id, { remainingMonths: newMonthsRemaining });
        console.log(`🔄 Updated remaining months for ${id}: ${newMonthsRemaining}`);
      }
    });
  }, []);

  return { processRecurringTransactions };
};
