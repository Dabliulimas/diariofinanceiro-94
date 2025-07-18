
import { useCallback, useRef, useMemo } from 'react';
import { useFinancialData } from './useFinancialData';
import { useTransactions, TransactionEntry } from './useTransactions';

export const useImprovedFinancialSync = () => {
  const financialData = useFinancialData();
  const transactions = useTransactions();
  
  // Enhanced control for preventing multiple processing
  const processingRef = useRef<boolean>(false);
  const lastProcessedHashRef = useRef<string>('');
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Create enhanced transaction hash with multiple validation layers
  const createEnhancedTransactionHash = useCallback((transaction: {
    date: string;
    type: string;
    description: string;
    amount: number;
  }): string => {
    const baseHash = `${transaction.date}|${transaction.type}|${transaction.description}|${transaction.amount}`;
    const timestamp = new Date().getTime();
    return `${baseHash}|${timestamp}`;
  }, []);

  // Create unique signature for duplicate detection
  const createTransactionSignature = useCallback((transaction: {
    date: string;
    type: string;
    description: string;
    amount: number;
  }): string => {
    return `${transaction.date}-${transaction.type}-${transaction.description.toLowerCase().trim()}-${transaction.amount.toFixed(2)}`;
  }, []);

  // Advanced duplicate checker with multiple validation methods
  const isDuplicateTransaction = useCallback((
    newTransaction: { date: string; type: string; description: string; amount: number },
    existingTransactions: TransactionEntry[]
  ): boolean => {
    const newSignature = createTransactionSignature(newTransaction);
    
    // For recurring transactions, check more strictly
    if (newTransaction.description.includes('🔄')) {
      const exactMatch = existingTransactions.some(t => 
        t.date === newTransaction.date &&
        t.type === newTransaction.type &&
        t.description === newTransaction.description &&
        Math.abs(t.amount - newTransaction.amount) < 0.01
      );
      
      if (exactMatch) {
        console.log(`🚫 RECURRING DUPLICATE BLOCKED: ${newTransaction.description} on ${newTransaction.date}`);
        return true;
      }
    }
    
    // Standard duplicate check
    const exactMatch = existingTransactions.some(t => 
      createTransactionSignature(t) === newSignature
    );
    
    return exactMatch;
  }, [createTransactionSignature]);

  // Optimized rebuild function with incremental updates
  const rebuildFinancialDataFromTransactions = useCallback((): void => {
    if (processingRef.current) {
      console.log('⏭️ Rebuild already in progress, skipping');
      return;
    }
    
    // Clear existing debounce
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Debounce the rebuild to prevent multiple rapid calls
    debounceTimeoutRef.current = setTimeout(() => {
      processingRef.current = true;
      console.log('🔄 Starting OPTIMIZED financial data rebuild');
      
      try {
        const allTransactions = transactions.transactions;
        const transactionsHash = JSON.stringify(allTransactions.map(t => t.id).sort());
        
        // Skip rebuild if transactions haven't changed
        if (transactionsHash === lastProcessedHashRef.current) {
          console.log('⏭️ Transactions unchanged, skipping rebuild');
          processingRef.current = false;
          return;
        }
        
        console.log(`📊 Processing ${allTransactions.length} transactions for rebuild`);
        
        // Group transactions by date for batch processing
        const transactionsByDate: { [date: string]: { entrada: number; saida: number; diario: number } } = {};
        
        allTransactions.forEach(transaction => {
          const dateKey = transaction.date;
          
          if (!transactionsByDate[dateKey]) {
            transactionsByDate[dateKey] = { entrada: 0, saida: 0, diario: 0 };
          }
          
          transactionsByDate[dateKey][transaction.type] += transaction.amount;
        });
        
        // Apply grouped values efficiently
        Object.entries(transactionsByDate).forEach(([dateKey, values]) => {
          const [year, month, day] = dateKey.split('-').map(Number);
          
          financialData.initializeMonth(year, month - 1);
          
          // Batch update all values for the day
          ['entrada', 'saida', 'diario'].forEach(type => {
            const value = values[type as keyof typeof values];
            if (value > 0) {
              const formattedValue = `R$ ${value.toFixed(2).replace('.', ',')}`;
              financialData.updateDayData(year, month - 1, day, type as 'entrada' | 'saida' | 'diario', formattedValue);
            }
          });
        });
        
        lastProcessedHashRef.current = transactionsHash;
        console.log('✅ Optimized financial data rebuild completed');
        
      } catch (error) {
        console.error('❌ Error in optimized rebuild:', error);
      } finally {
        processingRef.current = false;
      }
    }, 300); // Reduced debounce for better responsiveness
  }, [financialData, transactions]);

  // Enhanced transaction addition with strict duplicate prevention
  const addTransactionAndSync = useCallback((transaction: Omit<TransactionEntry, 'id' | 'createdAt'>): void => {
    console.log('🔄 Adding transaction with ENHANCED duplicate control:', transaction);
    
    // Strict duplicate check
    if (isDuplicateTransaction(transaction, transactions.transactions)) {
      console.log('🚫 TRANSACTION BLOCKED - Duplicate detected');
      return;
    }
    
    try {
      // Add transaction
      const newTransaction = transactions.addTransaction(transaction);
      
      // Apply to financial data immediately for better performance
      const [year, month, day] = transaction.date.split('-').map(Number);
      financialData.initializeMonth(year, month - 1);
      financialData.addToDay(year, month - 1, day, transaction.type, transaction.amount);
      
      console.log('✅ Transaction added successfully with enhanced control');
      
    } catch (error) {
      console.error('❌ Error adding transaction:', error);
    }
  }, [transactions, financialData, isDuplicateTransaction]);

  // Optimized update with controlled rebuild
  const updateTransactionAndSync = useCallback((id: string, updates: Partial<TransactionEntry>): void => {
    console.log('✏️ Updating transaction with optimized rebuild:', id);
    
    transactions.updateTransaction(id, updates);
    
    // Trigger optimized rebuild with debounce
    rebuildFinancialDataFromTransactions();
  }, [transactions, rebuildFinancialDataFromTransactions]);

  // Optimized delete with controlled rebuild
  const deleteTransactionAndSync = useCallback((id: string): void => {
    console.log('🗑️ Deleting transaction with optimized rebuild:', id);
    
    transactions.deleteTransaction(id);
    
    // Trigger optimized rebuild with debounce
    rebuildFinancialDataFromTransactions();
  }, [transactions, rebuildFinancialDataFromTransactions]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    processingRef.current = false;
  }, []);

  // Memoized return object for better performance
  const returnValue = useMemo(() => ({
    ...financialData,
    ...transactions,
    addTransactionAndSync,
    updateTransactionAndSync,
    deleteTransactionAndSync,
    forceRecalculation: rebuildFinancialDataFromTransactions,
    rebuildFinancialDataFromTransactions,
    cleanup
  }), [
    financialData,
    transactions,
    addTransactionAndSync,
    updateTransactionAndSync,  
    deleteTransactionAndSync,
    rebuildFinancialDataFromTransactions,
    cleanup
  ]);

  return returnValue;
};
