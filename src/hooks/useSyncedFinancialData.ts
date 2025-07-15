
import { useCallback } from 'react';
import { useFinancialData } from './useFinancialData';
import { useTransactions, TransactionEntry } from './useTransactions';

export const useSyncedFinancialData = () => {
  const financialData = useFinancialData();
  const transactions = useTransactions();

  // MAIN SYNC FUNCTION with IMMEDIATE and COMPLETE recalculation
  const addTransactionAndSync = useCallback((transaction: Omit<TransactionEntry, 'id' | 'createdAt'>): void => {
    console.log('🔄 Adding transaction with IMMEDIATE COMPLETE sync:', transaction);
    
    // Add to transactions
    const newTransaction = transactions.addTransaction(transaction);
    
    // Parse date correctly
    const [year, month, day] = transaction.date.split('-').map(Number);
    const actualMonth = month - 1;
    
    console.log(`📅 Syncing to financial data: ${year}-${month}-${day} (month index: ${actualMonth})`);
    
    // Initialize month if needed
    financialData.initializeMonth(year, actualMonth);
    
    // Add to financial data
    financialData.addToDay(year, actualMonth, day, transaction.type, transaction.amount);
    
    // IMMEDIATE and COMPLETE recalculation
    requestAnimationFrame(() => {
      financialData.recalculateBalances();
      console.log('✅ Transaction added with COMPLETE sync and propagation');
    });
  }, [transactions, financialData]);

  // UPDATE with COMPLETE recalculation
  const updateTransactionAndSync = useCallback((id: string, updates: Partial<TransactionEntry>): void => {
    console.log('🔄 Updating transaction with COMPLETE recalculation:', id, updates);
    
    const originalTransaction = transactions.transactions.find(t => t.id === id);
    if (!originalTransaction) {
      console.error('❌ Transaction not found for update:', id);
      return;
    }
    
    // Parse dates
    const [oldYear, oldMonth, oldDay] = originalTransaction.date.split('-').map(Number);
    const oldActualMonth = oldMonth - 1;
    
    // Subtract old amount
    financialData.initializeMonth(oldYear, oldActualMonth);
    financialData.addToDay(oldYear, oldActualMonth, oldDay, originalTransaction.type, -originalTransaction.amount);
    
    // Update transaction
    transactions.updateTransaction(id, updates);
    
    // Add new amount
    const newDateStr = updates.date || originalTransaction.date;
    const [newYear, newMonth, newDay] = newDateStr.split('-').map(Number);
    const newActualMonth = newMonth - 1;
    const newType = updates.type || originalTransaction.type;
    const newAmount = updates.amount || originalTransaction.amount;
    
    financialData.initializeMonth(newYear, newActualMonth);
    financialData.addToDay(newYear, newActualMonth, newDay, newType, newAmount);
    
    // COMPLETE recalculation from beginning
    requestAnimationFrame(() => {
      financialData.recalculateBalances();
      console.log('✅ Transaction updated with COMPLETE recalculation and propagation');
    });
  }, [transactions, financialData]);

  // DELETE with COMPLETE recalculation
  const deleteTransactionAndSync = useCallback((id: string): void => {
    console.log('🔄 Deleting transaction with COMPLETE recalculation:', id);
    
    const transactionToDelete = transactions.transactions.find(t => t.id === id);
    if (!transactionToDelete) {
      console.error('❌ Transaction not found for deletion:', id);
      return;
    }
    
    const [year, month, day] = transactionToDelete.date.split('-').map(Number);
    const actualMonth = month - 1;
    
    financialData.initializeMonth(year, actualMonth);
    financialData.addToDay(year, actualMonth, day, transactionToDelete.type, -transactionToDelete.amount);
    
    transactions.deleteTransaction(id);
    
    // COMPLETE recalculation from beginning
    requestAnimationFrame(() => {
      financialData.recalculateBalances();
      console.log('✅ Transaction deleted with COMPLETE recalculation and propagation');
    });
  }, [transactions, financialData]);

  // Force COMPLETE recalculation - rebuilds everything from transactions
  const forceCompleteRecalculation = useCallback((): void => {
    console.log('🔄 Forcing COMPLETE recalculation with full data rebuild');
    
    // Clear all financial data first
    const allTransactions = transactions.transactions;
    
    // Rebuild financial data from scratch
    allTransactions.forEach(transaction => {
      const [year, month, day] = transaction.date.split('-').map(Number);
      const actualMonth = month - 1;
      
      financialData.initializeMonth(year, actualMonth);
      financialData.addToDay(year, actualMonth, day, transaction.type, transaction.amount);
    });
    
    // Full recalculation
    requestAnimationFrame(() => {
      financialData.recalculateBalances();
      console.log('✅ Complete data rebuild and recalculation finished');
    });
  }, [financialData, transactions]);

  return {
    ...financialData,
    ...transactions,
    addTransactionAndSync,
    updateTransactionAndSync,
    deleteTransactionAndSync,
    forceRecalculation: forceCompleteRecalculation
  };
};
