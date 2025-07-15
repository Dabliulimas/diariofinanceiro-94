
import { useCallback } from 'react';
import { useFinancialData } from './useFinancialData';
import { useTransactions, TransactionEntry } from './useTransactions';

export const useSyncedFinancialData = () => {
  const financialData = useFinancialData();
  const transactions = useTransactions();

  // Função para reconstruir completamente os dados financeiros a partir das transações
  const rebuildFinancialDataFromTransactions = useCallback((): void => {
    console.log('🔄 Rebuilding financial data from transactions');
    
    // Limpar todos os dados financeiros primeiro
    const allTransactions = transactions.transactions;
    
    // Reconstruir dados financeiros do zero
    allTransactions.forEach(transaction => {
      const [year, month, day] = transaction.date.split('-').map(Number);
      const actualMonth = month - 1;
      
      financialData.initializeMonth(year, actualMonth);
      financialData.addToDay(year, actualMonth, day, transaction.type, transaction.amount);
    });
    
    // Recálculo completo dos saldos
    requestAnimationFrame(() => {
      financialData.recalculateBalances();
      console.log('✅ Complete data rebuild finished');
    });
  }, [financialData, transactions]);

  // MAIN SYNC FUNCTION with COMPLETE recalculation
  const addTransactionAndSync = useCallback((transaction: Omit<TransactionEntry, 'id' | 'createdAt'>): void => {
    console.log('🔄 Adding transaction with COMPLETE sync:', transaction);
    
    // Add to transactions
    const newTransaction = transactions.addTransaction(transaction);
    
    // Rebuild financial data completely to ensure accuracy
    rebuildFinancialDataFromTransactions();
    
    console.log('✅ Transaction added with COMPLETE rebuild');
  }, [transactions, rebuildFinancialDataFromTransactions]);

  // UPDATE with COMPLETE rebuild
  const updateTransactionAndSync = useCallback((id: string, updates: Partial<TransactionEntry>): void => {
    console.log('🔄 Updating transaction with COMPLETE rebuild:', id, updates);
    
    // Update transaction
    transactions.updateTransaction(id, updates);
    
    // Rebuild financial data completely
    rebuildFinancialDataFromTransactions();
    
    console.log('✅ Transaction updated with COMPLETE rebuild');
  }, [transactions, rebuildFinancialDataFromTransactions]);

  // DELETE with COMPLETE rebuild
  const deleteTransactionAndSync = useCallback((id: string): void => {
    console.log('🔄 Deleting transaction with COMPLETE rebuild:', id);
    
    // Delete transaction
    transactions.deleteTransaction(id);
    
    // Rebuild financial data completely
    rebuildFinancialDataFromTransactions();
    
    console.log('✅ Transaction deleted with COMPLETE rebuild');
  }, [transactions, rebuildFinancialDataFromTransactions]);

  // Force COMPLETE recalculation
  const forceCompleteRecalculation = useCallback((): void => {
    console.log('🔄 Forcing COMPLETE recalculation');
    rebuildFinancialDataFromTransactions();
  }, [rebuildFinancialDataFromTransactions]);

  return {
    ...financialData,
    ...transactions,
    addTransactionAndSync,
    updateTransactionAndSync,
    deleteTransactionAndSync,
    forceRecalculation: forceCompleteRecalculation,
    rebuildFinancialDataFromTransactions
  };
};
