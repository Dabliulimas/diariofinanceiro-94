
import { useCallback } from 'react';
import { RecurringTransaction } from './useRecurringTransactions';

export const useRecurringProcessor = () => {
  // Create enhanced hash for recurring transactions
  const createRecurringHash = useCallback((
    transaction: RecurringTransaction,
    date: string
  ): string => {
    return `recurring-${transaction.id}-${date}-${transaction.type}-${transaction.amount}`;
  }, []);

  // Check if recurring transaction already exists for specific date
  const isRecurringDuplicate = useCallback((
    transaction: RecurringTransaction,
    date: string,
    existingTransactions: any[]
  ): boolean => {
    const recurringDescription = `🔄 ${transaction.description}`;
    
    const duplicate = existingTransactions.find(t => 
      t.date === date && 
      t.type === transaction.type && 
      t.description === recurringDescription &&
      Math.abs(t.amount - transaction.amount) < 0.01
    );
    
    if (duplicate) {
      console.log(`🚫 Duplicate recurring transaction blocked for ${date}`);
    }
    
    return !!duplicate;
  }, []);

  // Process ALL future months for recurring transactions
  const processAllFutureMonths = useCallback((
    recurringTransactions: RecurringTransaction[],
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
    
    console.log(`🔄 Processing ALL future months for ${recurringTransactions.length} recurring transactions`);
    
    let totalProcessed = 0;
    let totalDuplicates = 0;
    
    recurringTransactions.forEach(transaction => {
      if (!transaction.isActive) return;
      
      const { dayOfMonth, type, amount, frequency, remainingCount, monthsDuration, startDate, id, description } = transaction;
      
      // Calculate how many months to process
      let monthsToProcess = 24; // Default 2 years ahead
      
      if (frequency === 'fixed-count' && remainingCount) {
        monthsToProcess = Math.min(remainingCount, 24);
      } else if (frequency === 'monthly-duration' && monthsDuration) {
        monthsToProcess = Math.min(monthsDuration, 24);
      }
      
      // Process each future month
      for (let monthOffset = 0; monthOffset < monthsToProcess; monthOffset++) {
        const targetDate = new Date(currentYear, currentMonth + monthOffset, 1);
        const targetYear = targetDate.getFullYear();
        const targetMonth = targetDate.getMonth();
        
        // Skip if before start date
        const startDateObj = new Date(startDate);
        if (targetDate < new Date(startDateObj.getFullYear(), startDateObj.getMonth(), 1)) {
          continue;
        }
        
        // Calculate valid day of month
        const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
        const targetDay = Math.min(dayOfMonth, daysInMonth);
        
        const formattedDate = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
        
        // Check for duplicates
        if (isRecurringDuplicate(transaction, formattedDate, existingTransactions)) {
          totalDuplicates++;
          continue;
        }
        
        console.log(`💰 Adding recurring ${type}: ${amount} on ${formattedDate} - ${description}`);
        
        addTransactionAndSync({
          type,
          amount,
          description: `🔄 ${description}`,
          date: formattedDate
        });
        
        totalProcessed++;
      }
      
      // Update remaining counts after processing
      if (frequency === 'fixed-count' && remainingCount !== undefined) {
        const newCount = Math.max(0, remainingCount - monthsToProcess);
        const updates: Partial<RecurringTransaction> = { remainingCount: newCount };
        if (newCount <= 0) {
          updates.isActive = false;
        }
        updateRecurringTransaction(id, updates);
      } else if (frequency === 'monthly-duration' && monthsDuration !== undefined) {
        const newMonthsRemaining = Math.max(0, monthsDuration - monthsToProcess);
        const updates: Partial<RecurringTransaction> = { remainingMonths: newMonthsRemaining };
        if (newMonthsRemaining <= 0) {
          updates.isActive = false;
        }
        updateRecurringTransaction(id, updates);
      }
    });
    
    console.log(`✅ Future months processing: ${totalProcessed} added, ${totalDuplicates} duplicates blocked`);
  }, [isRecurringDuplicate]);

  // Remove all recurring transactions for a specific recurring ID
  const removeAllRecurringTransactions = useCallback((
    recurringId: string,
    deleteTransactionAndSync: (id: string) => void,
    existingTransactions: any[]
  ) => {
    console.log(`🗑️ Removing ALL recurring transactions for ID: ${recurringId}`);
    
    const recurringTransactions = existingTransactions.filter(t => 
      t.description.includes('🔄') && t.description.includes(recurringId)
    );
    
    let deletedCount = 0;
    
    recurringTransactions.forEach(transaction => {
      deleteTransactionAndSync(transaction.id);
      deletedCount++;
    });
    
    console.log(`✅ Removed ${deletedCount} recurring transactions`);
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
    // For current/future months, process ALL future occurrences
    const currentDate = new Date();
    const targetDate = new Date(year, month, 1);
    
    if (targetDate >= new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)) {
      const activeTransactions = recurringTransactions.filter(t => t.isActive);
      
      if (activeTransactions.length > 0) {
        processAllFutureMonths(
          activeTransactions,
          addTransactionAndSync,
          updateRecurringTransaction,
          existingTransactions
        );
      }
    }
  }, [processAllFutureMonths]);

  return { 
    processRecurringTransactions,
    processAllFutureMonths,
    removeAllRecurringTransactions
  };
};
