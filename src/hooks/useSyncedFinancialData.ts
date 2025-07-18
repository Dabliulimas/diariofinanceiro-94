
import { useCallback, useRef } from 'react';
import { useFinancialData } from './useFinancialData';
import { useTransactions, TransactionEntry } from './useTransactions';

export const useSyncedFinancialData = () => {
  const financialData = useFinancialData();
  const transactions = useTransactions();
  
  // CONTROLE CRÍTICO: Prevenir processamento múltiplo
  const isProcessingRef = useRef<boolean>(false);

  // Função para criar hash único da transação
  const createTransactionHash = useCallback((transaction: {
    date: string;
    type: string;
    description: string;
    amount: number;
  }): string => {
    return `${transaction.date}-${transaction.type}-${transaction.description}-${transaction.amount}`;
  }, []);

  // Função para reconstruir dados financeiros - SEM loops
  const rebuildFinancialDataFromTransactions = useCallback((): void => {
    if (isProcessingRef.current) {
      console.log('⏭️ Already processing, skipping rebuild');
      return;
    }
    
    isProcessingRef.current = true;
    console.log('🔄 Rebuilding financial data from transactions - CONTROLLED');
    
    try {
      const allTransactions = transactions.transactions;
      console.log(`📊 Processing ${allTransactions.length} transactions`);
      
      // Group transactions by date for batch processing
      const transactionsByDate: { [date: string]: { entrada: number; saida: number; diario: number } } = {};
      
      allTransactions.forEach(transaction => {
        const dateKey = transaction.date;
        
        if (!transactionsByDate[dateKey]) {
          transactionsByDate[dateKey] = { entrada: 0, saida: 0, diario: 0 };
        }
        
        transactionsByDate[dateKey][transaction.type] += transaction.amount;
      });
      
      // Apply grouped values to financial data
      Object.entries(transactionsByDate).forEach(([dateKey, values]) => {
        const [year, month, day] = dateKey.split('-').map(Number);
        
        // Initialize month
        financialData.initializeMonth(year, month - 1);
        
        // Update day data in batch
        if (values.entrada > 0) {
          financialData.updateDayData(year, month - 1, day, 'entrada', `R$ ${values.entrada.toFixed(2).replace('.', ',')}`);
        }
        if (values.saida > 0) {
          financialData.updateDayData(year, month - 1, day, 'saida', `R$ ${values.saida.toFixed(2).replace('.', ',')}`);
        }
        if (values.diario > 0) {
          financialData.updateDayData(year, month - 1, day, 'diario', `R$ ${values.diario.toFixed(2).replace('.', ',')}`);
        }
      });
      
      console.log('✅ Financial data rebuild completed - CONTROLLED');
    } catch (error) {
      console.error('❌ Error in rebuild:', error);
    } finally {
      isProcessingRef.current = false;
    }
  }, [financialData, transactions]);

  // MAIN SYNC FUNCTION - com controle rigoroso de duplicatas
  const addTransactionAndSync = useCallback((transaction: Omit<TransactionEntry, 'id' | 'createdAt'>): void => {
    console.log('🔄 Adding transaction with STRICT duplicate control:', transaction);
    
    // Create unique hash for duplicate check
    const transactionHash = createTransactionHash(transaction);
    
    // Check for existing transaction with same hash
    const existingTransaction = transactions.transactions.find(t => 
      createTransactionHash(t) === transactionHash
    );
    
    if (existingTransaction) {
      console.log('⏭️ DUPLICATE DETECTED - Transaction already exists:', transaction);
      return;
    }
    
    // Add transaction
    const newTransaction = transactions.addTransaction(transaction);
    
    // Apply to financial data immediately
    const [year, month, day] = transaction.date.split('-').map(Number);
    financialData.initializeMonth(year, month - 1);
    financialData.addToDay(year, month - 1, day, transaction.type, transaction.amount);
    
    console.log('✅ Transaction added and synced - NO DUPLICATES');
  }, [transactions, financialData, createTransactionHash]);

  // UPDATE with controlled rebuild
  const updateTransactionAndSync = useCallback((id: string, updates: Partial<TransactionEntry>): void => {
    console.log('🔄 Updating transaction with controlled rebuild:', id);
    
    transactions.updateTransaction(id, updates);
    
    // Controlled rebuild with delay
    setTimeout(() => {
      rebuildFinancialDataFromTransactions();
    }, 200);
  }, [transactions, rebuildFinancialDataFromTransactions]);

  // DELETE with controlled rebuild
  const deleteTransactionAndSync = useCallback((id: string): void => {
    console.log('🔄 Deleting transaction with controlled rebuild:', id);
    
    transactions.deleteTransaction(id);
    
    // Controlled rebuild with delay
    setTimeout(() => {
      rebuildFinancialDataFromTransactions();
    }, 200);
  }, [transactions, rebuildFinancialDataFromTransactions]);

  return {
    ...financialData,
    ...transactions,
    addTransactionAndSync,
    updateTransactionAndSync,
    deleteTransactionAndSync,
    forceRecalculation: rebuildFinancialDataFromTransactions,
    rebuildFinancialDataFromTransactions
  };
};
