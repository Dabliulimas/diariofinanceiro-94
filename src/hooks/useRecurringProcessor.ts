
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
      const currentMonthDate = new Date(year, month, 1);
      const startMonthDate = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), 1);
      
      // Skip if transaction hasn't started yet
      if (currentMonthDate < startMonthDate) {
        console.log(`⏭️ Skipping transaction ${id} - hasn't started yet`);
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
      
      // Check if fixed count has expired
      if (frequency === 'fixed-count' && remainingCount !== undefined && remainingCount <= 0) {
        updateRecurringTransaction(id, { isActive: false });
        console.log(`🔄 Deactivated recurring transaction ${id} - count expired`);
        return;
      }
      
      // Check if day exists in the current month
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const targetDay = Math.min(dayOfMonth, daysInMonth);
      
      console.log(`💰 Adding recurring ${type}: ${amount} on day ${targetDay} for ${year}-${month + 1}`);
      
      // Add to the appropriate day - use correct type (entrada/saida)
      addToDay(year, month, targetDay, type, amount);
      
      // Update counts only if we're processing the current month for the first time
      const currentDate = new Date();
      const isCurrentOrFutureMonth = year > currentDate.getFullYear() || 
        (year === currentDate.getFullYear() && month >= currentDate.getMonth());
      
      if (isCurrentOrFutureMonth) {
        if (frequency === 'fixed-count' && remainingCount !== undefined) {
          const newCount = Math.max(0, remainingCount - 1);
          const updates: Partial<RecurringTransaction> = { remainingCount: newCount };
          if (newCount <= 0) {
            updates.isActive = false;
          }
          updateRecurringTransaction(id, updates);
          console.log(`🔄 Updated remaining count for ${id}: ${newCount}`);
        } else if (frequency === 'monthly-duration' && remainingMonths !== undefined) {
          const newMonthsRemaining = Math.max(0, remainingMonths - 1);
          const updates: Partial<RecurringTransaction> = { remainingMonths: newMonthsRemaining };
          if (newMonthsRemaining <= 0) {
            updates.isActive = false;
          }
          updateRecurringTransaction(id, updates);
          console.log(`🔄 Updated remaining months for ${id}: ${newMonthsRemaining}`);
        }
      }
    });
  }, []);

  return { processRecurringTransactions };
};
