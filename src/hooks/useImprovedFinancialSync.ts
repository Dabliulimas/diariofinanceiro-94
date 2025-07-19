
import { useCallback, useRef, useMemo } from 'react';
import { useFinancialData } from './useFinancialData';
import { useTransactions, TransactionEntry } from './useTransactions';

export const useImprovedFinancialSync = () => {
  const financialData = useFinancialData();
  const transactions = useTransactions();
  
  // CONTROLE RIGOROSO para prevenir múltiplos processamentos
  const processingRef = useRef<boolean>(false);
  const lastProcessedHashRef = useRef<string>('');
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hash melhorado para transações
  const createTransactionHash = useCallback((transaction: {
    date: string;
    type: string;
    description: string;
    amount: number;
  }): string => {
    return `${transaction.date}|${transaction.type}|${transaction.description.toLowerCase().trim()}|${transaction.amount.toFixed(2)}`;
  }, []);

  // Verificação rigorosa de duplicatas
  const isDuplicateTransaction = useCallback((
    newTransaction: { date: string; type: string; description: string; amount: number },
    existingTransactions: TransactionEntry[]
  ): boolean => {
    const newSignature = createTransactionHash(newTransaction);
    
    const duplicate = existingTransactions.some(t => 
      createTransactionHash(t) === newSignature
    );
    
    if (duplicate) {
      console.log(`🚫 DUPLICATE BLOCKED: ${newTransaction.description} on ${newTransaction.date}`);
    }
    
    return duplicate;
  }, [createTransactionHash]);

  // Rebuild OTIMIZADO seguindo a lógica financeira correta
  const rebuildFinancialDataFromTransactions = useCallback((): void => {
    if (processingRef.current) {
      console.log('⏭️ Rebuild already in progress, skipping');
      return;
    }
    
    // Clear existing debounce
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Debounce the rebuild
    debounceTimeoutRef.current = setTimeout(() => {
      processingRef.current = true;
      console.log('🔄 Starting CONTROLLED financial data rebuild following specification');
      
      try {
        const allTransactions = transactions.transactions;
        const transactionsHash = JSON.stringify(allTransactions.map(t => `${t.id}-${t.date}-${t.amount}`).sort());
        
        // Skip rebuild if transactions haven't changed
        if (transactionsHash === lastProcessedHashRef.current) {
          console.log('⏭️ Transactions unchanged, skipping rebuild');
          processingRef.current = false;
          return;
        }
        
        console.log(`📊 Processing ${allTransactions.length} transactions for CORRECT rebuild`);
        
        // Group transactions by date for batch processing
        const transactionsByDate: { [date: string]: { entrada: number; saida: number; diario: number } } = {};
        
        allTransactions.forEach(transaction => {
          const dateKey = transaction.date;
          
          if (!transactionsByDate[dateKey]) {
            transactionsByDate[dateKey] = { entrada: 0, saida: 0, diario: 0 };
          }
          
          transactionsByDate[dateKey][transaction.type] += transaction.amount;
        });
        
        // Apply grouped values to financial data and trigger CASCADE recalculation
        let earliestYear: number | undefined;
        let earliestMonth: number | undefined;
        let earliestDay: number | undefined;
        
        Object.entries(transactionsByDate).forEach(([dateKey, values]) => {
          const [year, month, day] = dateKey.split('-').map(Number);
          
          // Track earliest change for cascade recalculation
          if (!earliestYear || year < earliestYear || 
              (year === earliestYear && month - 1 < (earliestMonth || 0)) ||
              (year === earliestYear && month - 1 === (earliestMonth || 0) && day < (earliestDay || 0))) {
            earliestYear = year;
            earliestMonth = month - 1;
            earliestDay = day;
          }
          
          financialData.initializeMonth(year, month - 1);
          
          // Update values efficiently following specification format
          if (values.entrada > 0) {
            const formattedValue = `R$ ${values.entrada.toFixed(2).replace('.', ',')}`;
            financialData.updateDayData(year, month - 1, day, 'entrada', formattedValue);
          }
          if (values.saida > 0) {
            const formattedValue = `R$ ${values.saida.toFixed(2).replace('.', ',')}`;
            financialData.updateDayData(year, month - 1, day, 'saida', formattedValue);
          }
          if (values.diario > 0) {
            const formattedValue = `R$ ${values.diario.toFixed(2).replace('.', ',')}`;
            financialData.updateDayData(year, month - 1, day, 'diario', formattedValue);
          }
        });
        
        // Trigger CASCADE recalculation from earliest change following specification
        if (earliestYear && earliestMonth !== undefined && earliestDay) {
          console.log(`🧮 Triggering CASCADE recalculation from ${earliestYear}-${earliestMonth + 1}-${earliestDay}`);
          financialData.recalculateBalances(earliestYear, earliestMonth, earliestDay);
        }
        
        lastProcessedHashRef.current = transactionsHash;
        console.log('✅ CONTROLLED financial data rebuild completed following specification');
        
      } catch (error) {
        console.error('❌ Error in controlled rebuild:', error);
      } finally {
        processingRef.current = false;
      }
    }, 300); // Reduced debounce for faster response
  }, [financialData, transactions]);

  // Add transaction with STRICT duplicate control
  const addTransactionAndSync = useCallback((transaction: Omit<TransactionEntry, 'id' | 'createdAt'>): void => {
    console.log('🔄 Adding transaction with STRICT control following specification:', transaction);
    
    // Strict duplicate check
    if (isDuplicateTransaction(transaction, transactions.transactions)) {
      console.log('🚫 TRANSACTION BLOCKED - Duplicate detected');
      return;
    }
    
    try {
      // Add transaction
      transactions.addTransaction(transaction);
      
      // Apply to financial data immediately following specification
      const [year, month, day] = transaction.date.split('-').map(Number);
      financialData.initializeMonth(year, month - 1);
      financialData.addToDay(year, month - 1, day, transaction.type, transaction.amount);
      
      // Trigger CASCADE recalculation from this point following specification
      financialData.recalculateBalances(year, month - 1, day);
      
      console.log('✅ Transaction added with CASCADE recalculation following specification');
      
    } catch (error) {
      console.error('❌ Error adding transaction:', error);
    }
  }, [transactions, financialData, isDuplicateTransaction]);

  // Update with controlled rebuild
  const updateTransactionAndSync = useCallback((id: string, updates: Partial<TransactionEntry>): void => {
    console.log('✏️ Updating transaction with controlled rebuild following specification:', id);
    
    transactions.updateTransaction(id, updates);
    rebuildFinancialDataFromTransactions();
  }, [transactions, rebuildFinancialDataFromTransactions]);

  // Delete with controlled rebuild
  const deleteTransactionAndSync = useCallback((id: string): void => {
    console.log('🗑️ Deleting transaction with controlled rebuild following specification:', id);
    
    transactions.deleteTransaction(id);
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
