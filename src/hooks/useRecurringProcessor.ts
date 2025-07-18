
import { useCallback } from 'react';
import { RecurringTransaction } from './useRecurringTransactions';

export const useRecurringProcessor = () => {
  // Enhanced unique hash creation with multiple layers of validation
  const createEnhancedRecurringHash = useCallback((
    transaction: RecurringTransaction,
    date: string
  ): string => {
    const baseHash = `recurring-${transaction.id}-${date}-${transaction.type}-${transaction.amount}-${transaction.description}`;
    const normalizedDescription = transaction.description.toLowerCase().trim();
    return `${baseHash}-${normalizedDescription}`;
  }, []);

  // Multi-layer duplicate detection system
  const isRecurringDuplicate = useCallback((
    transaction: RecurringTransaction,
    date: string,
    existingTransactions: any[]
  ): boolean => {
    const recurringDescription = `🔄 ${transaction.description}`;
    
    // Layer 1: Exact match detection
    const exactMatch = existingTransactions.find(t => 
      t.date === date && 
      t.type === transaction.type && 
      t.description === recurringDescription &&
      Math.abs(t.amount - transaction.amount) < 0.01
    );
    
    // Layer 2: Pattern-based detection (more flexible)
    const patternMatch = existingTransactions.find(t =>
      t.date === date &&
      t.type === transaction.type &&
      t.description.includes(transaction.description) &&
      Math.abs(t.amount - transaction.amount) < 0.01
    );
    
    // Layer 3: Similar transaction detection (for edge cases)
    const similarMatch = existingTransactions.find(t =>
      t.date === date &&
      t.type === transaction.type &&
      Math.abs(t.amount - transaction.amount) < 0.01 &&
      (t.description.includes(transaction.description.substring(0, 10)) ||
       transaction.description.includes(t.description.substring(2))) // Skip emoji
    );
    
    const isDuplicate = !!(exactMatch || patternMatch || similarMatch);
    
    if (isDuplicate) {
      console.log(`🚫 ENHANCED DUPLICATE DETECTION - Blocked recurring transaction:`, {
        transaction: transaction.description,
        date,
        exactMatch: !!exactMatch,
        patternMatch: !!patternMatch,
        similarMatch: !!similarMatch
      });
    }
    
    return isDuplicate;
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
      console.log(`⏭️ Skipping past month: ${year}-${month + 1}`);
      return;
    }

    const activeTransactions = recurringTransactions.filter(t => t.isActive);
    
    if (activeTransactions.length === 0) {
      console.log(`⏭️ No active recurring transactions for ${year}-${month + 1}`);
      return;
    }
    
    console.log(`🔄 ENHANCED processing ${activeTransactions.length} recurring transactions for ${year}-${month + 1}`);
    
    let processedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    
    activeTransactions.forEach(transaction => {
      const { dayOfMonth, type, amount, frequency, remainingCount, monthsDuration, remainingMonths, startDate, id, description } = transaction;
      
      try {
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
        
        // ENHANCED DUPLICATE CHECK with multi-layer validation
        if (isRecurringDuplicate(transaction, formattedDate, existingTransactions)) {
          duplicateCount++;
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
        
        console.log(`💰 Adding ENHANCED recurring ${type}: ${amount} on ${formattedDate} - ${description}`);
        
        // Add recurring transaction with enhanced validation
        addTransactionAndSync({
          type,
          amount,
          description: `🔄 ${description}`,
          date: formattedDate
        });
        
        processedCount++;
        
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
        console.error(`❌ Error processing recurring transaction ${id}:`, error);
        errorCount++;
      }
    });
    
    console.log(`✅ ENHANCED processing summary for ${year}-${month + 1}: ${processedCount} processed, ${duplicateCount} duplicates blocked, ${errorCount} errors`);
  }, [isRecurringDuplicate]);

  return { processRecurringTransactions };
};
