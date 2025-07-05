
import { useCallback } from 'react';
import { useFinancialData } from './useFinancialData';
import { useTransactions, TransactionEntry } from './useTransactions';

export const useSyncedFinancialData = () => {
  const financialData = useFinancialData();
  const transactions = useTransactions();

  // MAIN SYNC FUNCTION: Add transaction and sync to financial data
  const addTransactionAndSync = useCallback((transaction: Omit<TransactionEntry, 'id' | 'createdAt'>): void => {
    console.log('🔄 Adding transaction and syncing:', transaction);
    
    // Add to transactions
    const newTransaction = transactions.addTransaction(transaction);
    
    // Parse date
    const date = new Date(transaction.date);
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    console.log(`📅 Syncing to financial data: ${year}-${month+1}-${day}`);
    
    // Initialize month if needed
    financialData.initializeMonth(year, month);
    
    // Add to financial data
    financialData.addToDay(year, month, day, transaction.type, transaction.amount);
    
    // Recalculate balances from this point forward
    financialData.recalculateBalances(year, month, day);
    
    console.log('✅ Transaction added and synced successfully');
  }, [transactions, financialData]);

  // UPDATE TRANSACTION AND SYNC
  const updateTransactionAndSync = useCallback((id: string, updates: Partial<TransactionEntry>): void => {
    console.log('🔄 Updating transaction and syncing:', id, updates);
    
    // Find the original transaction
    const originalTransaction = transactions.transactions.find(t => t.id === id);
    if (!originalTransaction) {
      console.error('❌ Transaction not found for update:', id);
      return;
    }
    
    // Remove old transaction from financial data
    const oldDate = new Date(originalTransaction.date);
    const oldYear = oldDate.getFullYear();
    const oldMonth = oldDate.getMonth();
    const oldDay = oldDate.getDate();
    
    // Initialize month if needed
    financialData.initializeMonth(oldYear, oldMonth);
    
    // Subtract old amount
    financialData.addToDay(oldYear, oldMonth, oldDay, originalTransaction.type, -originalTransaction.amount);
    
    // Update transaction
    transactions.updateTransaction(id, updates);
    
    // Add new amount if date/type/amount changed
    const newDate = new Date(updates.date || originalTransaction.date);
    const newYear = newDate.getFullYear();
    const newMonth = newDate.getMonth();
    const newDay = newDate.getDate();
    const newType = updates.type || originalTransaction.type;
    const newAmount = updates.amount || originalTransaction.amount;
    
    // Initialize month if needed
    financialData.initializeMonth(newYear, newMonth);
    
    // Add new amount
    financialData.addToDay(newYear, newMonth, newDay, newType, newAmount);
    
    // Recalculate balances from earliest affected date
    const earliestYear = Math.min(oldYear, newYear);
    const earliestMonth = oldYear === newYear ? Math.min(oldMonth, newMonth) : (oldYear < newYear ? oldMonth : newMonth);
    const earliestDay = oldYear === newYear && oldMonth === newMonth ? Math.min(oldDay, newDay) : (oldYear === newYear && oldMonth < newMonth ? oldDay : oldDay);
    
    financialData.recalculateBalances(earliestYear, earliestMonth, earliestDay);
    
    console.log('✅ Transaction updated and synced successfully');
  }, [transactions, financialData]);

  // DELETE TRANSACTION AND SYNC
  const deleteTransactionAndSync = useCallback((id: string): void => {
    console.log('🔄 Deleting transaction and syncing:', id);
    
    // Find the transaction to delete
    const transactionToDelete = transactions.transactions.find(t => t.id === id);
    if (!transactionToDelete) {
      console.error('❌ Transaction not found for deletion:', id);
      return;
    }
    
    // Remove from financial data
    const date = new Date(transactionToDelete.date);
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    // Initialize month if needed
    financialData.initializeMonth(year, month);
    
    // Subtract amount
    financialData.addToDay(year, month, day, transactionToDelete.type, -transactionToDelete.amount);
    
    // Delete transaction
    transactions.deleteTransaction(id);
    
    // Recalculate balances from this point forward
    financialData.recalculateBalances(year, month, day);
    
    console.log('✅ Transaction deleted and synced successfully');
  }, [transactions, financialData]);

  // FORCE FULL RECALCULATION
  const forceRecalculation = useCallback((): void => {
    console.log('🔄 Forcing full recalculation of all balances');
    financialData.recalculateBalances();
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
