import { useState, useEffect, useCallback } from 'react';
import { formatCurrency, parseCurrency } from '../utils/currencyUtils';

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

  // Save data to localStorage whenever data changes - with immediate sync
  useEffect(() => {
    console.log('💾 Saving financial data to localStorage (immediate)');
    localStorage.setItem('financialData', JSON.stringify(data));
  }, [data]);

  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  // NEW: Get last December balance for year-end calculation
  const calcularUltimoSaldoDezembro = useCallback((data: FinancialData, year: number): number => {
    if (!data[year] || !data[year][11]) return 0;

    const diasDezembro = Object.keys(data[year][11]).map(Number).sort((a, b) => b - a);
    
    for (const dia of diasDezembro) {
      if (data[year][11][dia] && typeof data[year][11][dia].balance === 'number') {
        console.log(`📊 Last December balance for ${year}: ${data[year][11][dia].balance} (day ${dia})`);
        return data[year][11][dia].balance;
      }
    }
    
    return 0;
  }, []);

  // NEW: Global balance propagation across all years
  const propagarSaldosEntreAnos = useCallback((currentData: FinancialData): FinancialData => {
    console.log('🔄 Starting global balance propagation across all years');
    
    const newData = { ...currentData };
    const anos = Object.keys(newData).map(Number).sort((a, b) => a - b);
    
    for (let i = 0; i < anos.length - 1; i++) {
      const anoAtual = anos[i];
      const proximoAno = anos[i + 1];
      
      // Get December 31st balance of current year
      const saldoFinalDezembro = calcularUltimoSaldoDezembro(newData, anoAtual);
      
      if (saldoFinalDezembro !== 0 || Object.keys(newData[anoAtual]).length > 0) {
        console.log(`🔗 Propagating balance from ${anoAtual} to ${proximoAno}: ${saldoFinalDezembro}`);
        
        // Initialize next year structure if needed
        if (!newData[proximoAno]) newData[proximoAno] = {};
        if (!newData[proximoAno][0]) newData[proximoAno][0] = {};
        if (!newData[proximoAno][0][1]) {
          newData[proximoAno][0][1] = {
            entrada: "R$ 0,00",
            saida: "R$ 0,00",
            diario: "R$ 0,00",
            balance: saldoFinalDezembro
          };
        } else {
          // Update existing January 1st balance
          newData[proximoAno][0][1].balance = saldoFinalDezembro;
        }
      }
    }
    
    return newData;
  }, [calcularUltimoSaldoDezembro]);

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
      
      newData[year][month][day][field] = formattedValue;
      return newData;
    });
  }, []);

  const getYearEndBalance = useCallback((year: number, currentData: FinancialData): number => {
    console.log(`🔍 Getting year-end balance for ${year}`);
    
    if (!currentData[year]) {
      console.log(`📊 No data for year ${year}, balance = 0`);
      return 0;
    }
    
    // Find last month with data (December = 11, November = 10, etc.)
    for (let month = 11; month >= 0; month--) {
      if (currentData[year][month]) {
        const daysInMonth = getDaysInMonth(year, month);
        // Find last day with data in that month
        for (let day = daysInMonth; day >= 1; day--) {
          if (currentData[year][month][day] && typeof currentData[year][month][day].balance === 'number') {
            const balance = currentData[year][month][day].balance;
            console.log(`💰 Year ${year} end balance: ${balance} (from ${year}-${month+1}-${day})`);
            return balance;
          }
        }
      }
    }
    
    console.log(`📊 No balance data found for year ${year}, returning 0`);
    return 0;
  }, []);

  const getPreviousBalance = useCallback((year: number, month: number, day: number, currentData: FinancialData): number => {
    if (day === 1) {
      if (month === 0) {
        // First day of year - get from previous year's last balance with AUTOMATIC PROPAGATION
        const prevYear = year - 1;
        const inheritedBalance = getYearEndBalance(prevYear, currentData);
        console.log(`🔗 Year inheritance: ${prevYear} → ${year} balance = ${inheritedBalance}`);
        return inheritedBalance;
      } else {
        // First day of month - get from previous month's last day
        const prevMonth = month - 1;
        if (currentData[year] && currentData[year][prevMonth]) {
          const daysInPrevMonth = getDaysInMonth(year, prevMonth);
          if (currentData[year][prevMonth][daysInPrevMonth]) {
            console.log(`🔗 Month inheritance: ${year}-${prevMonth+1}-${daysInPrevMonth} balance = ${currentData[year][prevMonth][daysInPrevMonth].balance}`);
            return currentData[year][prevMonth][daysInPrevMonth].balance;
          }
        }
        return 0;
      }
    } else {
      // Regular day - get from previous day
      if (currentData[year] && currentData[year][month] && currentData[year][month][day - 1]) {
        return currentData[year][month][day - 1].balance;
      }
      return 0;
    }
  }, [getYearEndBalance]);

  const recalculateBalances = useCallback((startYear?: number, startMonth?: number, startDay?: number): void => {
    console.log(`🧮 IMMEDIATE balance recalculation with global propagation from ${startYear || 'beginning'}-${(startMonth || 0) + 1}-${startDay || 1}`);
    
    setData(prevData => {
      let newData = { ...prevData };
      const years = Object.keys(newData).map(Number).sort();
      
      for (const year of years) {
        if (startYear && year < startYear) continue;
        
        const months = Object.keys(newData[year]).map(Number).sort();
        
        for (const month of months) {
          if (startYear && year === startYear && startMonth !== undefined && month < startMonth) continue;
          
          const days = Object.keys(newData[year][month]).map(Number).sort();
          
          for (const day of days) {
            if (startYear && year === startYear && startMonth !== undefined && month === startMonth && startDay && day < startDay) continue;
            
            const dayData = newData[year][month][day];
            const entrada = parseCurrency(dayData.entrada);
            const saida = parseCurrency(dayData.saida);
            const diario = parseCurrency(dayData.diario);
            
            // Get previous balance with automatic year propagation
            const previousBalance = getPreviousBalance(year, month, day, newData);
            
            // Calculate new balance: Previous + Entrada - Saída - Diário
            const newBalance = previousBalance + entrada - saida - diario;
            dayData.balance = newBalance;
            
            console.log(`💰 ${year}-${month+1}-${day}: ${previousBalance} + ${entrada} - ${saida} - ${diario} = ${newBalance}`);
          }
        }
      }
      
      // Apply global year propagation after all calculations
      newData = propagarSaldosEntreAnos(newData);
      
      return newData;
    });
  }, [getPreviousBalance, propagarSaldosEntreAnos]);

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
      
      // Saldo final é sempre do último mês com dados
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
    recalculateBalances,
    getPreviousBalance,
    getYearEndBalance,
    propagarSaldosEntreAnos
  };
};
