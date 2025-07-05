
import { useState, useEffect, useCallback } from 'react';

export interface TransactionEntry {
  id: string;
  date: string;
  type: 'entrada' | 'saida' | 'diario';
  amount: number;
  description: string;
  createdAt: string;
}

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<TransactionEntry[]>([]);

  // Load transactions from localStorage on mount
  useEffect(() => {
    const savedTransactions = localStorage.getItem('transactions');
    if (savedTransactions) {
      try {
        const parsed = JSON.parse(savedTransactions);
        const validTransactions = Array.isArray(parsed) ? parsed : [];
        setTransactions(validTransactions);
        console.log('💾 Loaded transactions from localStorage:', validTransactions.length);
      } catch (error) {
        console.error('Error loading transactions:', error);
        setTransactions([]);
      }
    }
  }, []);

  // Save transactions to localStorage whenever they change
  useEffect(() => {
    console.log('💾 Saving transactions to localStorage:', transactions.length);
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  const addTransaction = useCallback((transaction: Omit<TransactionEntry, 'id' | 'createdAt'>): TransactionEntry => {
    const newTransaction: TransactionEntry = {
      ...transaction,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    
    console.log('➕ Adding transaction:', newTransaction);
    setTransactions(prev => {
      const updated = [...prev, newTransaction];
      console.log('📊 Total transactions after add:', updated.length);
      return updated;
    });
    
    return newTransaction;
  }, []);

  const updateTransaction = useCallback((id: string, updates: Partial<TransactionEntry>): void => {
    console.log('✏️ Updating transaction:', id, updates);
    setTransactions(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, ...updates } : t);
      console.log('📊 Total transactions after update:', updated.length);
      return updated;
    });
  }, []);

  const deleteTransaction = useCallback((id: string): void => {
    console.log('🗑️ Deleting transaction:', id);
    setTransactions(prev => {
      const updated = prev.filter(t => t.id !== id);
      console.log('📊 Total transactions after delete:', updated.length);
      return updated;
    });
  }, []);

  const getTransactionsByDate = useCallback((date: string): TransactionEntry[] => {
    const result = transactions.filter(t => t.date === date);
    console.log('📅 Getting transactions for date:', date, 'Found:', result.length);
    return result;
  }, [transactions]);

  return {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionsByDate
  };
};
