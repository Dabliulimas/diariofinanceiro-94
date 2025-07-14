
import { useState, useEffect, useCallback } from 'react';

export interface RecurringTransaction {
  id: string;
  type: 'entrada' | 'saida';
  amount: number;
  description: string;
  dayOfMonth: number;
  frequency: 'until-cancelled' | 'fixed-count' | 'monthly-duration';
  remainingCount?: number;
  monthsDuration?: number;
  remainingMonths?: number;
  startDate: string; // ISO date string
  isActive: boolean;
  createdAt: string;
}

const STORAGE_KEY = 'recurringTransactions';

export const useRecurringTransactions = () => {
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setRecurringTransactions(parsed);
          console.log('💾 Loaded recurring transactions:', parsed.length);
        }
      } catch (error) {
        console.error('❌ Error loading recurring transactions:', error);
        setRecurringTransactions([]);
      }
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (recurringTransactions.length > 0) {
      console.log('💾 Saving recurring transactions:', recurringTransactions.length);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recurringTransactions));
    }
  }, [recurringTransactions]);

  const addRecurringTransaction = useCallback((
    transaction: Omit<RecurringTransaction, 'id' | 'createdAt' | 'startDate'>
  ): RecurringTransaction => {
    const newTransaction: RecurringTransaction = {
      ...transaction,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      startDate: new Date().toISOString()
    };
    
    console.log('➕ Adding recurring transaction:', newTransaction);
    setRecurringTransactions(prev => [...prev, newTransaction]);
    
    return newTransaction;
  }, []);

  const updateRecurringTransaction = useCallback((
    id: string, 
    updates: Partial<RecurringTransaction>
  ): void => {
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
