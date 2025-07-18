
import { useCallback } from 'react';

export const useDataCleanup = () => {
  const clearAllData = useCallback((): void => {
    console.log('🧹 Starting complete data cleanup...');
    
    // Clear all localStorage data
    localStorage.removeItem('financialData');
    localStorage.removeItem('transactions');
    localStorage.removeItem('recurringTransactions');
    localStorage.removeItem('emergencyReserve');
    localStorage.removeItem('fixedExpenses');
    
    console.log('✅ All data cleared from localStorage');
    
    // Force page reload to reset all state
    window.location.reload();
  }, []);

  const clearTransactionsOnly = useCallback((): void => {
    console.log('🧹 Clearing transactions only...');
    localStorage.removeItem('transactions');
    localStorage.removeItem('financialData');
    console.log('✅ Transactions and financial data cleared');
  }, []);

  return {
    clearAllData,
    clearTransactionsOnly
  };
};
