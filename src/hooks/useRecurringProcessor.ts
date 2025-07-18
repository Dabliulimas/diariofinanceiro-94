
import { useCallback } from 'react';
import { RecurringTransaction } from './useRecurringTransactions';

export const useRecurringProcessor = () => {
  // Create unique hash for recurring transaction
  const createRecurringHash = useCallback((
    transaction: RecurringTransaction,
    date: string
  ): string => {
    return `recurring-${transaction.id}-${date}-${transaction.type}-${transaction.amount}`;
  }, []);

  const processRecurringTransactions = useCallback((
    recurringTransactions: RecurringTransaction[],
    year: number,
    month: number,
    addTransactionAndSync: (transaction: {
      type: 'entrada' | 'saida';
      amount: number;
      description: string;
      date: string;
    }) => void,
    updateRecurringTransaction: (id: string, updates: Partial<RecurringTransaction>) => void,
    existingTransactions: any[] = []
  ) => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const targetDate = new Date(year, month, 1);
    
    // Only process current or future months
    if (targetDate < new Date(currentYear, currentMonth, 1)) {
      console.log(`⏭️ Skipping processing for past month: ${year}-${month + 1}`);
      return;
    }

    const activeTransactions = recurringTransactions.filter(t => t.isActive);
    
    if (activeTransactions.length === 0) {
      console.log(`⏭️ No active recurring transactions for ${year}-${month + 1}`);
      return;
    }
    
    console.log(`🔄 Processing ${activeTransactions.length} recurring transactions for ${year}-${month + 1} with STRICT controls`);
    
    activeTransactions.forEach(transaction => {
      const { dayOfMonth, type, amount, frequency, remainingCount, monthsDuration, remainingMonths, startDate, id, description } = transaction;
      
      // Check if transaction should be processed for this month
      const startDateObj = new Date(startDate);
      const targetMonthDate = new Date(year, month, 1);
      const startMonthDate = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), 1);
      
      // Skip if transaction hasn't started yet
      if (targetMonthDate < startMonthDate) {
        console.log(`⏭️ Transaction ${id} hasn't started yet for ${year}-${month + 1}`);
        return;
      }
      
      // Check if monthly duration expired
      if (frequency === 'monthly-duration' && monthsDuration && remainingMonths !== undefined) {
        if (remainingMonths <= 0) {
          updateRecurringTransaction(id, { isActive: false });
          console.log(`🔄 Deactivated transaction ${id} - monthly duration expired`);
          return;
        }
      }
      
      // Check if fixed count expired
      if (frequency === 'fixed-count' && remainingCount !== undefined && remainingCount <= 0) {
        updateRecurringTransaction(id, { isActive: false });
        console.log(`🔄 Deactivated transaction ${id} - count expired`);
        return;
      }
      
      // Calculate valid day of month
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const targetDay = Math.min(dayOfMonth, daysInMonth);
      
      // Format date as YYYY-MM-DD
      const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
      
      // CRITICAL VERIFICATION: Strict duplicate check with multiple methods
      const recurringDescription = `🔄 ${description}`;
      const transactionHash = createRecurringHash(transaction, formattedDate);
      
      // Method 1: Check by exact match
      const existingByExactMatch = existingTransactions.find(t => 
        t.date === formattedDate && 
        t.type === type && 
        t.description === recurringDescription &&
        Math.abs(t.amount - amount) < 0.01 // Float comparison
      );
      
      // Method 2: Check by hash (if we had a hash field)
      const existingByPattern = existingTransactions.find(t =>
        t.date === formattedDate &&
        t.description.includes(`🔄 ${description}`) &&
        t.type === type
      );
      
      if (existingByExactMatch || existingByPattern) {
        console.log(`⏭️ STRICT DUPLICATE CHECK - Recurring transaction already exists for ${formattedDate}: ${description}`);
        return;
      }
      
      // Check if it's a valid date for processing
      const today = new Date();
      const targetDayDate = new Date(year, month, targetDay);
      
      // For future months, always process
      // For current month, only process if day hasn't passed
      const isValidForProcessing = year > currentYear || 
        month > currentMonth || 
        (year === currentYear && month === currentMonth && targetDay >= today.getDate());
      
      if (!isValidForProcessing) {
        console.log(`⏭️ Skipping past date: ${year}-${month + 1}-${targetDay}`);
        return;
      }
      
      console.log(`💰 Adding CONTROLLED recurring ${type}: ${amount} on ${formattedDate} - ${description}`);
      
      // Add recurring transaction with additional verification
      try {
        addTransactionAndSync({
          type,
          amount,
          description: recurringDescription,
          date: formattedDate
        });
        
        // Update counters ONLY after successful addition
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
      } catch (error) {
        console.error(`❌ Error adding recurring transaction ${id}:`, error);
      }
    });
  }, [createRecurringHash]);

  return { processRecurringTransactions };
};
