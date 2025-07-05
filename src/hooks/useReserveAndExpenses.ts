
import { useState, useEffect, useCallback } from 'react';

export interface EmergencyReserve {
  amount: number;
  months: 6 | 12;
  lastUpdated: string;
}

export interface FixedExpenseCategory {
  id: string;
  name: string;
  amount: number;
}

export interface FixedExpenses {
  categories: FixedExpenseCategory[];
  totalAmount: number;
  lastUpdated: string;
}

export const useReserveAndExpenses = () => {
  const [emergencyReserve, setEmergencyReserve] = useState<EmergencyReserve>({ 
    amount: 0, 
    months: 6,
    lastUpdated: '' 
  });
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpenses>({ 
    categories: [],
    totalAmount: 0,
    lastUpdated: '' 
  });

  // Load data from localStorage on mount
  useEffect(() => {
    const savedReserve = localStorage.getItem('emergencyReserve');
    const savedExpenses = localStorage.getItem('fixedExpenses');
    
    if (savedReserve) {
      try {
        setEmergencyReserve(JSON.parse(savedReserve));
      } catch (error) {
        console.error('Error loading emergency reserve:', error);
      }
    }
    
    if (savedExpenses) {
      try {
        setFixedExpenses(JSON.parse(savedExpenses));
      } catch (error) {
        console.error('Error loading fixed expenses:', error);
      }
    }
  }, []);

  // Save data to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('emergencyReserve', JSON.stringify(emergencyReserve));
  }, [emergencyReserve]);

  useEffect(() => {
    localStorage.setItem('fixedExpenses', JSON.stringify(fixedExpenses));
  }, [fixedExpenses]);

  const updateEmergencyReserve = useCallback((amount: number, months: 6 | 12 = 6): void => {
    setEmergencyReserve({
      amount,
      months,
      lastUpdated: new Date().toISOString()
    });
  }, []);

  const updateFixedExpenses = useCallback((categories: FixedExpenseCategory[]): void => {
    const totalAmount = categories.reduce((sum, cat) => sum + cat.amount, 0);
    setFixedExpenses({
      categories,
      totalAmount,
      lastUpdated: new Date().toISOString()
    });
  }, []);

  const getRecommendedEmergencyReserve = useCallback((): number => {
    return fixedExpenses.totalAmount * emergencyReserve.months;
  }, [fixedExpenses.totalAmount, emergencyReserve.months]);

  return {
    emergencyReserve,
    fixedExpenses,
    updateEmergencyReserve,
    updateFixedExpenses,
    getRecommendedEmergencyReserve
  };
};
