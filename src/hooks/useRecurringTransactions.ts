
import { useState, useEffect, useCallback } from 'react';

export interface RecurringTransaction {
  id: string;
  type: 'entrada' | 'saida';
  amount: number;
  description: string;
  dayOfMonth: number;
  frequency: 'until-cancelled' | 'fixed-count';
  remainingCount?: number;
  isActive: boolean;
  createdAt: string;
}

export const useRecurringTransactions = () => {
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('recurringTransactions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRecurringTransactions(Array.isArray(parsed) ? parsed : []);
        console.log('💾 Loaded recurring transactions:', parsed.length);
      } catch (error) {
        console.error('Error loading recurring transactions:', error);
        setRecurringTransactions([]);
      }
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    console.log('💾 Saving recurring transactions:', recurringTransactions.length);
    localStorage.setItem('recurringTransactions', JSON.stringify(recurringTransactions));
  }, [recurringTransactions]);

  const addRecurringTransaction = useCallback((transaction: Omit<RecurringTransaction, 'id' | 'createdAt'>): RecurringTransaction => {
    const newTransaction: RecurringTransaction = {
      ...transaction,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    
    console.log('➕ Adding recurring transaction:', newTransaction);
    setRecurringTransactions(prev => [...prev, newTransaction]);
    
    return newTransaction;
  }, []);

  const updateRecurringTransaction = useCallback((id: string, updates: Partial<RecurringTransaction>): void => {
    console.log('✏️ Updating recurring transaction:', id, updates);
    setRecurringTransactions(prev =>
      prev.map(t => t.id === id ? { ...t, ...updates } : t)
    );
  }, []);

  const deleteRecurringTransaction = useCallback((id: string): void => {
    console.log('🗑️ Deleting recurring transaction:', id);
    setRecurringTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  const getActiveRecurringTransactions = useCallback((): RecurringTransaction[] => {
    return recurringTransactions.filter(t => t.isActive);
  }, [recurringTransactions]);

  return {
    recurringTransactions,
    addRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    getActiveRecurringTransactions
  };
};
