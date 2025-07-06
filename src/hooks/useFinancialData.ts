
import { useState, useEffect, useCallback } from 'react';
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

  const { recalculateBalances } = useBalancePropagation();

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('financialData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        console.log('💾 Loading financial data from localStorage');
        setData(parsed || {});
      } catch (error) {
        console.error('❌ Error loading financial data:', error);
        setData({});
      }
    }
  }, []);

  // Save data to localStorage with IMMEDIATE and COMPLETE recalculation
  useEffect(() => {
    if (Object.keys(data).length === 0) return;
    
    console.log('💾 Saving financial data with COMPLETE automatic recalculation');
    
    // Aplica recálculo completo imediatamente
    const recalculatedData = recalculateBalances(data);
    
    // Só atualiza estado se houver mudanças reais
    if (JSON.stringify(recalculatedData) !== JSON.stringify(data)) {
      setData(recalculatedData);
    }
    
    localStorage.setItem('financialData', JSON.stringify(recalculatedData));
  }, [data, recalculateBalances]);

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
      
      return newData;
    });
  }, []);

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
      
      return newData;
    });
  }, []);

  // FUNÇÃO CRÍTICA: updateDayData com recálculo AUTOMÁTICO e IMEDIATO
  const updateDayData = useCallback((year: number, month: number, day: number, field: keyof Omit<DayData, 'balance'>, value: string): void => {
    const numericValue = parseCurrency(value);
    const formattedValue = formatCurrency(numericValue);
    
    console.log(`📝 Manual update with IMMEDIATE recalculation: ${year}-${month+1}-${day} ${field} = ${formattedValue}`);
    
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
      
      // Atualiza o valor
      newData[year][month][day][field] = formattedValue;
      
      // RECÁLCULO IMEDIATO E COMPLETO a partir deste ponto
      console.log(`🔄 Triggering COMPLETE recalculation from ${year}-${month+1}-${day}`);
      const recalculatedData = recalculateBalances(newData, year, month, day);
      
      return recalculatedData;
    });
  }, [recalculateBalances]);

  // Função principal de recálculo manual (se necessário)
  const triggerCompleteRecalculation = useCallback((startYear?: number, startMonth?: number, startDay?: number): void => {
    console.log(`🧮 Manual trigger for complete recalculation`);
    
    setData(prevData => {
      const recalculatedData = recalculateBalances(prevData, startYear, startMonth, startDay);
      return recalculatedData;
    });
  }, [recalculateBalances]);

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
      saldoFinal = dayData.balance; // Last day balance
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
