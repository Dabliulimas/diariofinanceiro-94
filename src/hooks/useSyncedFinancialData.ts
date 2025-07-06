
import { useCallback } from 'react';
import { useFinancialData } from './useFinancialData';
import { useTransactions, TransactionEntry } from './useTransactions';

export const useSyncedFinancialData = () => {
  const financialData = useFinancialData();
  const transactions = useTransactions();

  // MAIN SYNC FUNCTION with immediate recalculation and automatic propagation
  const addTransactionAndSync = useCallback((transaction: Omit<TransactionEntry, 'id' | 'createdAt'>): void => {
    console.log('🔄 Adding transaction and syncing with automatic propagation:', transaction);
    
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
    
    // IMMEDIATE recalculation with automatic propagation
    requestAnimationFrame(() => {
      financialData.recalculateBalances(year, actualMonth, day);
      console.log('✅ Transaction added and synced with automatic propagation');
    });
  }, [transactions, financialData]);

  // UPDATE with automatic propagation
  const updateTransactionAndSync = useCallback((id: string, updates: Partial<TransactionEntry>): void => {
    console.log('🔄 Updating transaction with automatic propagation:', id, updates);
    
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
    
    // Recalculate from earliest affected date with automatic propagation
    const earliestYear = Math.min(oldYear, newYear);
    const earliestMonth = oldYear === newYear ? Math.min(oldActualMonth, newActualMonth) : (oldYear < newYear ? oldActualMonth : newActualMonth);
    const earliestDay = oldYear === newYear && oldActualMonth === newActualMonth ? Math.min(oldDay, newDay) : oldDay;
    
    requestAnimationFrame(() => {
      financialData.recalculateBalances(earliestYear, earliestMonth, earliestDay);
      console.log('✅ Transaction updated with automatic propagation');
    });
  }, [transactions, financialData]);

  // DELETE with automatic propagation
  const deleteTransactionAndSync = useCallback((id: string): void => {
    console.log('🔄 Deleting transaction with automatic propagation:', id);
    
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
    
    requestAnimationFrame(() => {
      financialData.recalculateBalances(year, actualMonth, day);
      console.log('✅ Transaction deleted with automatic propagation');
    });
  }, [transactions, financialData]);

  // Force full recalculation with automatic propagation
  const forceRecalculation = useCallback((): void => {
    console.log('🔄 Forcing full recalculation with automatic propagation');
    requestAnimationFrame(() => {
      financialData.recalculateBalances();
    });
  }, [financialData]);

  return {
    ...financialData,
    ...transactions,
    addTransactionAndSync,
    updateTransactionAndSync,
    deleteTransactionAndSync,
    forceRecalculation
  };
};
