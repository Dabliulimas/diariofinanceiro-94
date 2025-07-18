import { useState, useEffect, useCallback, useRef } from 'react';
import { formatCurrency, parseCurrency } from '../utils/currencyUtils';
import { useBalancePropagation } from './useBalancePropagation';

export interface DayData {
  entrada: string;
  saida: string;
  diario: string;
  balance: number;
}

export interface FinancialData {
  [year: string]: {
    [month: string]: {
      [day: string]: DayData;
    };
  };
}

export const useFinancialData = () => {
  const [data, setData] = useState<FinancialData>({});
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  
  // CONTROLE CRÍTICO: Prevenir loops infinitos
  const isLoadingRef = useRef<boolean>(false);
  const isSavingRef = useRef<boolean>(false);
  const lastSavedDataRef = useRef<string>('');

  const { recalculateBalances } = useBalancePropagation();

  // Load data APENAS uma vez no mount
  useEffect(() => {
    if (isLoadingRef.current) return;
    
    isLoadingRef.current = true;
    const savedData = localStorage.getItem('financialData');
    
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        console.log('💾 Loading financial data from localStorage');
        setData(parsed || {});
        lastSavedDataRef.current = savedData;
      } catch (error) {
        console.error('❌ Error loading financial data:', error);
        setData({});
      }
    }
    
    isLoadingRef.current = false;
  }, []); // APENAS uma vez no mount

  // Save data CONTROLADO para evitar loops
  const saveDataToStorage = useCallback((dataToSave: FinancialData) => {
    if (isSavingRef.current) return;
    if (Object.keys(dataToSave).length === 0) return;
    
    const dataString = JSON.stringify(dataToSave);
    if (dataString === lastSavedDataRef.current) return; // Evita salvar dados idênticos
    
    isSavingRef.current = true;
    console.log('💾 Saving financial data to localStorage');
    
    try {
      localStorage.setItem('financialData', dataString);
      lastSavedDataRef.current = dataString;
    } catch (error) {
      console.error('❌ Error saving financial data:', error);
    } finally {
      isSavingRef.current = false;
    }
  }, []);

  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  const initializeMonth = useCallback((year: number, month: number): void => {
    console.log(`🏗️ Initializing month ${month + 1}/${year}`);
    
    setData(prevData => {
      const newData = { ...prevData };
      
      if (!newData[year]) {
        newData[year] = {};
      }
      
      if (!newData[year][month]) {
        newData[year][month] = {};
        const daysInMonth = getDaysInMonth(year, month);
        
        for (let day = 1; day <= daysInMonth; day++) {
          newData[year][month][day] = {
            entrada: "R$ 0,00",
            saida: "R$ 0,00",
            diario: "R$ 0,00",
            balance: 0
          };
        }
      }
      
      // Save after initialization
      saveDataToStorage(newData);
      return newData;
    });
  }, [saveDataToStorage]);

  const addToDay = useCallback((year: number, month: number, day: number, type: 'entrada' | 'saida' | 'diario', amount: number): void => {
    console.log(`💰 Adding ${amount} to ${type} on ${year}-${month+1}-${day}`);
    
    setData(prevData => {
      const newData = { ...prevData };
      
      // Initialize structures if needed
      if (!newData[year]) newData[year] = {};
      if (!newData[year][month]) newData[year][month] = {};
      if (!newData[year][month][day]) {
        newData[year][month][day] = {
          entrada: "R$ 0,00",
          saida: "R$ 0,00",
          diario: "R$ 0,00",
          balance: 0
        };
      }
      
      // Add to existing value
      const currentValue = parseCurrency(newData[year][month][day][type]);
      const newValue = currentValue + amount;
      newData[year][month][day][type] = formatCurrency(newValue);
      
      console.log(`✅ Updated ${type}: ${formatCurrency(currentValue)} + ${formatCurrency(amount)} = ${formatCurrency(newValue)}`);
      
      // Recalculate and save
      const recalculatedData = recalculateBalances(newData, year, month, day);
      saveDataToStorage(recalculatedData);
      
      return recalculatedData;
    });
  }, [recalculateBalances, saveDataToStorage]);

  const updateDayData = useCallback((year: number, month: number, day: number, field: keyof Omit<DayData, 'balance'>, value: string): void => {
    const numericValue = parseCurrency(value);
    const formattedValue = formatCurrency(numericValue);
    
    console.log(`📝 Manual update: ${year}-${month+1}-${day} ${field} = ${formattedValue}`);
    
    setData(prevData => {
      const newData = { ...prevData };
      
      if (!newData[year]) newData[year] = {};
      if (!newData[year][month]) newData[year][month] = {};
      if (!newData[year][month][day]) {
        newData[year][month][day] = {
          entrada: "R$ 0,00",
          saida: "R$ 0,00",
          diario: "R$ 0,00",
          balance: 0
        };
      }
      
      // Update value
      newData[year][month][day][field] = formattedValue;
      
      // Recalculate and save
      const recalculatedData = recalculateBalances(newData, year, month, day);
      saveDataToStorage(recalculatedData);
      
      return recalculatedData;
    });
  }, [recalculateBalances, saveDataToStorage]);

  const triggerCompleteRecalculation = useCallback((startYear?: number, startMonth?: number, startDay?: number): void => {
    console.log(`🧮 Manual trigger for complete recalculation`);
    
    setData(prevData => {
      const recalculatedData = recalculateBalances(prevData, startYear, startMonth, startDay);
      saveDataToStorage(recalculatedData);
      return recalculatedData;
    });
  }, [recalculateBalances, saveDataToStorage]);

  const getMonthlyTotals = useCallback((year: number, month: number) => {
    if (!data[year] || !data[year][month]) {
      return {
        totalEntradas: 0,
        totalSaidas: 0,
        totalDiario: 0,
        saldoFinal: 0
      };
    }
    
    const monthData = data[year][month];
    let totalEntradas = 0;
    let totalSaidas = 0;
    let totalDiario = 0;
    let saldoFinal = 0;
    
    const days = Object.keys(monthData).map(Number).sort();
    
    for (const day of days) {
      const dayData = monthData[day];
      totalEntradas += parseCurrency(dayData.entrada);
      totalSaidas += parseCurrency(dayData.saida);
      totalDiario += parseCurrency(dayData.diario);
      saldoFinal = dayData.balance;
    }
    
    return {
      totalEntradas,
      totalSaidas,
      totalDiario,
      saldoFinal
    };
  }, [data]);

  const getYearlyTotals = useCallback((year: number) => {
    if (!data[year]) {
      return {
        totalEntradas: 0,
        totalSaidas: 0,
        totalDiario: 0,
        saldoFinal: 0
      };
    }
    
    let totalEntradas = 0;
    let totalSaidas = 0;
    let totalDiario = 0;
    let saldoFinal = 0;
    
    for (let month = 0; month < 12; month++) {
      const monthlyTotals = getMonthlyTotals(year, month);
      totalEntradas += monthlyTotals.totalEntradas;
      totalSaidas += monthlyTotals.totalSaidas;
      totalDiario += monthlyTotals.totalDiario;
      
      if (data[year][month]) {
        saldoFinal = monthlyTotals.saldoFinal;
      }
    }
    
    return {
      totalEntradas,
      totalSaidas,
      totalDiario,
      saldoFinal
    };
  }, [getMonthlyTotals, data]);

  return {
    data,
    selectedYear,
    selectedMonth,
    setSelectedYear,
    setSelectedMonth,
    updateDayData,
    addToDay,
    initializeMonth,
    getMonthlyTotals,
    getYearlyTotals,
    getDaysInMonth,
    formatCurrency,
    recalculateBalances: triggerCompleteRecalculation
  };
};
