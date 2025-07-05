
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

  // Save data to localStorage whenever data changes
  useEffect(() => {
    console.log('💾 Saving financial data to localStorage');
    localStorage.setItem('financialData', JSON.stringify(data));
  }, [data]);

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

  // CORE FUNCTION: Add transaction values to specific day
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

  // CORE FUNCTION: Set day values directly (for manual input)
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

  // CORE FUNCTION: Get previous day's balance for calculations
  const getPreviousBalance = useCallback((year: number, month: number, day: number): number => {
    if (day === 1) {
      if (month === 0) {
        // First day of year - get from previous year's last day
        const prevYear = year - 1;
        if (data[prevYear]) {
          // Find last month with data in previous year
          for (let m = 11; m >= 0; m--) {
            if (data[prevYear][m]) {
              const daysInPrevMonth = getDaysInMonth(prevYear, m);
              for (let d = daysInPrevMonth; d >= 1; d--) {
                if (data[prevYear][m][d]) {
                  console.log(`🔗 Year inheritance: ${prevYear}-${m+1}-${d} balance = ${data[prevYear][m][d].balance}`);
                  return data[prevYear][m][d].balance;
                }
              }
            }
          }
        }
        console.log(`🔗 No previous year data, starting balance = 0`);
        return 0;
      } else {
        // First day of month - get from previous month's last day
        const prevMonth = month - 1;
        if (data[year] && data[year][prevMonth]) {
          const daysInPrevMonth = getDaysInMonth(year, prevMonth);
          if (data[year][prevMonth][daysInPrevMonth]) {
            console.log(`🔗 Month inheritance: ${year}-${prevMonth+1}-${daysInPrevMonth} balance = ${data[year][prevMonth][daysInPrevMonth].balance}`);
            return data[year][prevMonth][daysInPrevMonth].balance;
          }
        }
        return 0;
      }
    } else {
      // Regular day - get from previous day
      if (data[year] && data[year][month] && data[year][month][day - 1]) {
        return data[year][month][day - 1].balance;
      }
      return 0;
    }
  }, [data]);

  // CORE FUNCTION: Recalculate all balances starting from a specific point
  const recalculateBalances = useCallback((startYear?: number, startMonth?: number, startDay?: number): void => {
    console.log(`🧮 Recalculating balances from ${startYear || 'beginning'}-${(startMonth || 0) + 1}-${startDay || 1}`);
    
    setData(prevData => {
      const newData = { ...prevData };
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
            
            // Get previous balance using the data state at this point
            let previousBalance = 0;
            if (day === 1) {
              if (month === 0) {
                // First day of year - get from previous year
                const prevYear = year - 1;
                if (newData[prevYear]) {
                  for (let m = 11; m >= 0; m--) {
                    if (newData[prevYear][m]) {
                      const daysInPrevMonth = getDaysInMonth(prevYear, m);
                      if (newData[prevYear][m][daysInPrevMonth]) {
                        previousBalance = newData[prevYear][m][daysInPrevMonth].balance;
                        break;
                      }
                    }
                  }
                }
              } else {
                // First day of month - get from previous month
                const prevMonth = month - 1;
                if (newData[year][prevMonth]) {
                  const daysInPrevMonth = getDaysInMonth(year, prevMonth);
                  if (newData[year][prevMonth][daysInPrevMonth]) {
                    previousBalance = newData[year][prevMonth][daysInPrevMonth].balance;
                  }
                }
              }
            } else {
              // Regular day - get from previous day
              if (newData[year][month][day - 1]) {
                previousBalance = newData[year][month][day - 1].balance;
              }
            }
            
            // Calculate new balance: Previous + Entrada - Saída - Diário
            const newBalance = previousBalance + entrada - saida - diario;
            dayData.balance = newBalance;
            
            console.log(`💰 ${year}-${month+1}-${day}: ${previousBalance} + ${entrada} - ${saida} - ${diario} = ${newBalance}`);
          }
        }
      }
      
      return newData;
    });
  }, []);

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
    getPreviousBalance
  };
};
