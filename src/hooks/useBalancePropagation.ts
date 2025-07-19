
import { useCallback } from 'react';
import { FinancialData } from './useFinancialData';
import { parseCurrency } from '../utils/currencyUtils';

export const useBalancePropagation = () => {
  // Função para obter o saldo do último dia disponível de dezembro
  const getLastDecemberBalance = useCallback((data: FinancialData, year: number): number => {
    if (!data[year] || !data[year][11]) return 0;
    
    // Procura o último dia disponível em dezembro
    const decemberDays = Object.keys(data[year][11]).map(Number).sort((a, b) => b - a);
    for (const day of decemberDays) {
      if (data[year][11][day] && typeof data[year][11][day].balance === 'number') {
        return data[year][11][day].balance;
      }
    }
    return 0;
  }, []);

  // Função para obter saldo anterior CORRETO
  const getPreviousBalance = useCallback((data: FinancialData, year: number, month: number, day: number): number => {
    if (day === 1) {
      if (month === 0) {
        // Primeiro dia do ano - herdar do ano anterior
        return getLastDecemberBalance(data, year - 1);
      } else {
        // Primeiro dia do mês - herdar do último dia do mês anterior
        const prevMonth = month - 1;
        if (data[year] && data[year][prevMonth]) {
          const daysInPrevMonth = new Date(year, month, 0).getDate();
          for (let d = daysInPrevMonth; d >= 1; d--) {
            if (data[year][prevMonth][d] && typeof data[year][prevMonth][d].balance === 'number') {
              return data[year][prevMonth][d].balance;
            }
          }
        }
        return 0;
      }
    } else {
      // Dia normal - herdar do dia anterior no mesmo mês
      if (data[year] && data[year][month] && data[year][month][day - 1]) {
        return data[year][month][day - 1].balance;
      }
      return 0;
    }
  }, [getLastDecemberBalance]);

  // Função de recálculo SIMPLIFICADA e CORRETA
  const recalculateBalances = useCallback((
    data: FinancialData,
    startYear?: number,
    startMonth?: number,
    startDay?: number
  ): FinancialData => {
    const newData = { ...data };
    const years = Object.keys(newData).map(Number).sort();
    
    if (years.length === 0) return newData;
    
    // Define ponto de início
    const firstYear = startYear || Math.min(...years);
    const firstMonth = startMonth || 0;
    const firstDay = startDay || 1;
    
    console.log(`🧮 Recalculating balances from ${firstYear}-${firstMonth + 1}-${firstDay}`);
    
    // Recalcula apenas os anos que existem nos dados
    for (const year of years.filter(y => y >= firstYear)) {
      const startMonthForYear = (year === firstYear) ? firstMonth : 0;
      
      for (let month = startMonthForYear; month < 12; month++) {
        if (!newData[year] || !newData[year][month]) continue;
        
        const startDayForMonth = (year === firstYear && month === firstMonth) ? firstDay : 1;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Recalcula todos os dias do mês
        for (let day = startDayForMonth; day <= daysInMonth; day++) {
          if (!newData[year][month][day]) continue;
          
          const dayData = newData[year][month][day];
          const entrada = parseCurrency(dayData.entrada);
          const saida = parseCurrency(dayData.saida);
          const diario = parseCurrency(dayData.diario);
          
          // Obter saldo anterior CORRETO
          const previousBalance = getPreviousBalance(newData, year, month, day);
          
          // Calcular novo saldo
          const newBalance = previousBalance + entrada - saida - diario;
          dayData.balance = newBalance;
          
          console.log(`💰 ${year}-${month+1}-${day}: ${previousBalance} + ${entrada} - ${saida} - ${diario} = ${newBalance}`);
        }
      }
    }
    
    console.log('✅ Balance recalculation completed');
    return newData;
  }, [getPreviousBalance]);

  return {
    recalculateBalances,
    getLastDecemberBalance
  };
};
