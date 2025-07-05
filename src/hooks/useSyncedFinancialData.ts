
import { useCallback } from 'react';
import { useFinancialData } from './useFinancialData';
import { useTransactions, TransactionEntry } from './useTransactions';

export const useSyncedFinancialData = () => {
  const financialData = useFinancialData();
  const transactions = useTransactions();

  // MAIN SYNC FUNCTION: Add transaction and sync to financial data with immediate recalculation
  const addTransactionAndSync = useCallback((transaction: Omit<TransactionEntry, 'id' | 'createdAt'>): void => {
    console.log('🔄 Adding transaction and syncing (IMMEDIATE):', transaction);
    
    // Add to transactions
    const newTransaction = transactions.addTransaction(transaction);
    
    // Parse date correctly to avoid timezone issues
    const [year, month, day] = transaction.date.split('-').map(Number);
    const actualMonth = month - 1; // Convert to 0-based month index
    
    console.log(`📅 Syncing to financial data: ${year}-${month}-${day} (month index: ${actualMonth})`);
    
    // Initialize month if needed
    financialData.initializeMonth(year, actualMonth);
    
    // Add to financial data
    financialData.addToDay(year, actualMonth, day, transaction.type, transaction.amount);
    
    // IMMEDIATE recalculation without setTimeout for better performance
    requestAnimationFrame(() => {
      financialData.recalculateBalances(year, actualMonth, day);
      console.log('✅ Transaction added and synced successfully (IMMEDIATE)');
    });
  }, [transactions, financialData]);

  // UPDATE TRANSACTION AND SYNC with improved date handling
  const updateTransactionAndSync = useCallback((id: string, updates: Partial<TransactionEntry>): void => {
    console.log('🔄 Updating transaction and syncing (IMMEDIATE):', id, updates);
    
    // Find the original transaction
    const originalTransaction = transactions.transactions.find(t => t.id === id);
    if (!originalTransaction) {
      console.error('❌ Transaction not found for update:', id);
      return;
    }
    
    // Parse original date correctly
    const [oldYear, oldMonth, oldDay] = originalTransaction.date.split('-').map(Number);
    const oldActualMonth = oldMonth - 1;
    
    // Initialize month if needed
    financialData.initializeMonth(oldYear, oldActualMonth);
    
    // Subtract old amount
    financialData.addToDay(oldYear, oldActualMonth, oldDay, originalTransaction.type, -originalTransaction.amount);
    
    // Update transaction
    transactions.updateTransaction(id, updates);
    
    // Parse new date correctly
    const newDateStr = updates.date || originalTransaction.date;
    const [newYear, newMonth, newDay] = newDateStr.split('-').map(Number);
    const newActualMonth = newMonth - 1;
    const newType = updates.type || originalTransaction.type;
    const newAmount = updates.amount || originalTransaction.amount;
    
    // Initialize month if needed
    financialData.initializeMonth(newYear, newActualMonth);
    
    // Add new amount
    financialData.addToDay(newYear, newActualMonth, newDay, newType, newAmount);
    
    // IMMEDIATE recalculation from earliest affected date
    const earliestYear = Math.min(oldYear, newYear);
    const earliestMonth = oldYear === newYear ? Math.min(oldActualMonth, newActualMonth) : (oldYear < newYear ? oldActualMonth : newActualMonth);
    const earliestDay = oldYear === newYear && oldActualMonth === newActualMonth ? Math.min(oldDay, newDay) : (oldYear === newYear && oldActualMonth < newActualMonth ? oldDay : oldDay);
    
    requestAnimationFrame(() => {
      financialData.recalculateBalances(earliestYear, earliestMonth, earliestDay);
      console.log('✅ Transaction updated and synced successfully (IMMEDIATE)');
    });
  }, [transactions, financialData]);

  // DELETE TRANSACTION AND SYNC with improved date handling
  const deleteTransactionAndSync = useCallback((id: string): void => {
    console.log('🔄 Deleting transaction and syncing (IMMEDIATE):', id);
    
    // Find the transaction to delete
    const transactionToDelete = transactions.transactions.find(t => t.id === id);
    if (!transactionToDelete) {
      console.error('❌ Transaction not found for deletion:', id);
      return;
    }
    
    // Parse date correctly
    const [year, month, day] = transactionToDelete.date.split('-').map(Number);
    const actualMonth = month - 1;
    
    // Initialize month if needed
    financialData.initializeMonth(year, actualMonth);
    
    // Subtract amount
    financialData.addToDay(year, actualMonth, day, transactionToDelete.type, -transactionToDelete.amount);
    
    // Delete transaction
    transactions.deleteTransaction(id);
    
    // IMMEDIATE recalculation
    requestAnimationFrame(() => {
      financialData.recalculateBalances(year, actualMonth, day);
      console.log('✅ Transaction deleted and synced successfully (IMMEDIATE)');
    });
  }, [transactions, financialData]);

  // FORCE FULL RECALCULATION with immediate response
  const forceRecalculation = useCallback((): void => {
    console.log('🔄 Forcing full recalculation of all balances (IMMEDIATE)');
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
