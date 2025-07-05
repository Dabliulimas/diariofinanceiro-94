
import { useCallback } from 'react';
import { FinancialData } from './useFinancialData';

export const useBalanceCalculations = () => {
  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  // CORRIGIDO: Obter saldo final de um ano específico
  const getYearEndBalance = useCallback((year: number, data: FinancialData): number => {
    console.log(`🔍 BANKING: Getting year end balance for ${year}`);
    
    if (!data[year]) {
      console.log(`📊 No data for year ${year}, balance = 0`);
      return 0;
    }
    
    // Procurar do último mês (dezembro) para o primeiro
    for (let month = 11; month >= 0; month--) {
      if (data[year][month]) {
        const daysInMonth = getDaysInMonth(year, month);
        // Procurar do último dia do mês para o primeiro
        for (let day = daysInMonth; day >= 1; day--) {
          if (data[year][month][day] && typeof data[year][month][day].balance === 'number') {
            const balance = data[year][month][day].balance;
            console.log(`💰 BANKING: Year ${year} end balance found: ${balance} (from ${year}-${month+1}-${day})`);
            return balance;
          }
        }
      }
    }
    
    console.log(`📊 BANKING: No balance data found for year ${year}, returning 0`);
    return 0;
  }, []);

  // CORRIGIDO: Obter saldo herdado do ano anterior
  const getInheritedBalance = useCallback((year: number, data: FinancialData): number => {
    const previousYear = year - 1;
    console.log(`🔍 BANKING: Getting inherited balance from year ${previousYear} for year ${year}`);
    
    const inheritedBalance = getYearEndBalance(previousYear, data);
    console.log(`💰 BANKING: Inherited balance: ${previousYear} (${inheritedBalance}) → ${year}`);
    
    return inheritedBalance;
  }, [getYearEndBalance]);

  const getPreviousYearBalance = useCallback((year: number, data: FinancialData): number => {
    return getInheritedBalance(year, data);
  }, [getInheritedBalance]);

  const recalculateBalances = useCallback((
    data: FinancialData, 
    startYear: number, 
    startMonth: number, 
    startDay: number,
    inheritedBalance?: number
  ): FinancialData => {
    console.log(`🧮 BANKING: Balance recalculation starting from ${startYear}-${startMonth+1}-${startDay}`);
    
    // Esta função não é mais usada - a lógica foi movida para useFinancialData
    // Mantendo para compatibilidade
    return data;
  }, []);

  return {
    getDaysInMonth,
    getPreviousYearBalance,
    recalculateBalances,
    getYearEndBalance,
    getInheritedBalance
  };
};
