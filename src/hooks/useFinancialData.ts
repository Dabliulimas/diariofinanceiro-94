
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
  
  // CONTROLES RIGOROSOS para evitar loops e processamentos múltiplos
  const isLoadingRef = useRef<boolean>(false);
  const isSavingRef = useRef<boolean>(false);
  const isRecalculatingRef = useRef<boolean>(false);
  const isUpdatingRef = useRef<boolean>(false);
  const lastSavedDataRef = useRef<string>('');
  const initializationRef = useRef<Set<string>>(new Set());

  const { recalculateBalances, getDaysInMonth, getInitialBalanceForMonth } = useBalancePropagation();

  // Load data APENAS uma vez no mount - SEM LOOPS
  useEffect(() => {
    if (isLoadingRef.current) return;
    
    isLoadingRef.current = true;
    console.log('💾 Loading financial data from localStorage - ONE TIME ONLY');
    
    const savedData = localStorage.getItem('financialData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setData(parsed || {});
        lastSavedDataRef.current = savedData;
        console.log('✅ Financial data loaded successfully');
      } catch (error) {
        console.error('❌ Error loading financial data:', error);
        setData({});
      }
    }
    
    isLoadingRef.current = false;
  }, []); // Array vazio - executa APENAS no mount

  // Save data CONTROLADO sem loops
  const saveDataToStorage = useCallback((dataToSave: FinancialData) => {
    if (isSavingRef.current) return;
    if (Object.keys(dataToSave).length === 0) return;
    
    const dataString = JSON.stringify(dataToSave);
    if (dataString === lastSavedDataRef.current) return; // Evita salvamento duplicado
    
    isSavingRef.current = true;
    
    try {
      localStorage.setItem('financialData', dataString);
      lastSavedDataRef.current = dataString;
      console.log('💾 Data saved to localStorage');
    } catch (error) {
      console.error('❌ Error saving financial data:', error);
    } finally {
      isSavingRef.current = false;
    }
  }, []);

  // Inicialização CONTROLADA de mês sem loops
  const initializeMonth = useCallback((year: number, month: number): void => {
    const monthKey = `${year}-${month}`;
    
    // Evita inicialização múltipla
    if (initializationRef.current.has(monthKey)) {
      return;
    }
    
    console.log(`🏗️ Initializing month ${month + 1}/${year} - CONTROLLED`);
    
    setData(prevData => {
      const newData = { ...prevData };
      
      if (!newData[year]) {
        newData[year] = {};
      }
      
      if (!newData[year][month]) {
        newData[year][month] = {};
        const daysInMonth = getDaysInMonth(year, month);
        
        // Obter saldo inicial correto para este mês
        const initialBalance = getInitialBalanceForMonth(newData, year, month);
        
        // Inicializar todos os dias do mês
        for (let day = 1; day <= daysInMonth; day++) {
          newData[year][month][day] = {
            entrada: "R$ 0,00",
            saida: "R$ 0,00",
            diario: "R$ 0,00",
            balance: day === 1 ? initialBalance : 0 // Apenas o primeiro dia herda o saldo inicial
          };
        }
        
        // Se há saldo inicial, recalcular saldos para este mês
        if (initialBalance !== 0) {
          console.log(`🧮 Recalculating balances for ${month + 1}/${year} with initial balance ${initialBalance}`);
          const recalculatedData = recalculateBalances(newData, year, month, 1);
          Object.assign(newData, recalculatedData);
        }
        
        // Marcar como inicializado
        initializationRef.current.add(monthKey);
        
        // Salvar após inicialização
        setTimeout(() => saveDataToStorage(newData), 100);
      }
      
      return newData;
    });
  }, [saveDataToStorage, getDaysInMonth, getInitialBalanceForMonth, recalculateBalances]);

  // Adicionar valor a um dia específico (sem recálculo automático)
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
      
      return newData;
    });
  }, []);

  // Update CORRIGIDO com validação de valores vazios e recálculo em cascata
  const updateDayData = useCallback((year: number, month: number, day: number, field: keyof Omit<DayData, 'balance'>, value: string): void => {
    if (isRecalculatingRef.current || isUpdatingRef.current) return; // Evita loops de recálculo
    
    isUpdatingRef.current = true;
    
    // CORRIGIDO: Tratar valores vazios como zero
    let numericValue = 0;
    let formattedValue = "R$ 0,00";
    
    if (value && value.trim() !== '') {
      const trimmedValue = value.trim();
      // Se o valor é apenas "R$" ou similar, tratar como zero
      if (trimmedValue === 'R$' || trimmedValue === 'R$ ' || trimmedValue === 'R$ 0' || trimmedValue === 'R$ 0,00') {
        numericValue = 0;
        formattedValue = "R$ 0,00";
      } else {
        numericValue = parseCurrency(trimmedValue);
        formattedValue = formatCurrency(numericValue);
      }
    }
    
    console.log(`📝 Manual update: ${year}-${month+1}-${day} ${field} = ${formattedValue} (from: "${value}") - TRIGGERS CASCADE`);
    
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
      
      // Update field with formatted value
      newData[year][month][day][field] = formattedValue;
      
      // RECÁLCULO EM CASCATA a partir do ponto alterado (conforme especificação)
      isRecalculatingRef.current = true;
      const recalculatedData = recalculateBalances(newData, year, month, day);
      isRecalculatingRef.current = false;
      
      // Save after recalculation
      setTimeout(() => saveDataToStorage(recalculatedData), 100);
      
      isUpdatingRef.current = false;
      return recalculatedData;
    });
  }, [recalculateBalances, saveDataToStorage]);

  // Trigger manual recalculation (para casos específicos)
  const triggerCompleteRecalculation = useCallback((startYear?: number, startMonth?: number, startDay?: number): void => {
    if (isRecalculatingRef.current) return;
    
    console.log(`🧮 Manual complete recalculation triggered from ${startYear}-${startMonth}-${startDay}`);
    
    setData(prevData => {
      isRecalculatingRef.current = true;
      const recalculatedData = recalculateBalances(prevData, startYear, startMonth, startDay);
      isRecalculatingRef.current = false;
      
      setTimeout(() => saveDataToStorage(recalculatedData), 100);
      return recalculatedData;
    });
  }, [recalculateBalances, saveDataToStorage]);

  // Cálculos de totais mensais
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
      saldoFinal = dayData.balance; // Último saldo calculado
    }
    
    return {
      totalEntradas,
      totalSaidas,
      totalDiario,
      saldoFinal
    };
  }, [data]);

  // Cálculos de totais anuais
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
      
      // O saldo final é sempre o último saldo válido do ano
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
