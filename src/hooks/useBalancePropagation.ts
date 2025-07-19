
import { useCallback } from 'react';
import { FinancialData } from './useFinancialData';
import { parseCurrency } from '../utils/currencyUtils';

export const useBalancePropagation = () => {
  // Função para verificar se um ano é bissexto
  const isLeapYear = useCallback((year: number): boolean => {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }, []);

  // Função para obter o número de dias em um mês
  const getDaysInMonth = useCallback((year: number, month: number): number => {
    const daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (month === 1 && isLeapYear(year)) { // Fevereiro em ano bissexto
      return 29;
    }
    return daysPerMonth[month];
  }, [isLeapYear]);

  // Função para obter o último saldo válido de dezembro
  const getLastDecemberBalance = useCallback((data: FinancialData, year: number): number => {
    console.log(`🔍 Getting last December balance for year ${year}`);
    
    if (!data[year] || !data[year][11]) {
      console.log(`❌ No December data found for year ${year}, returning 0`);
      return 0;
    }
    
    // Procura o último dia disponível em dezembro (31, 30, 29...)
    for (let day = 31; day >= 1; day--) {
      if (data[year][11][day] && typeof data[year][11][day].balance === 'number') {
        const balance = data[year][11][day].balance;
        console.log(`✅ Found December ${day}, ${year} balance: ${balance}`);
        return balance;
      }
    }
    
    console.log(`❌ No valid December balance found for year ${year}, returning 0`);
    return 0;
  }, []);

  // Função para obter o último saldo válido do mês anterior
  const getLastMonthBalance = useCallback((data: FinancialData, year: number, month: number): number => {
    const prevMonth = month - 1;
    const daysInPrevMonth = getDaysInMonth(year, prevMonth);
    
    console.log(`🔍 Getting last balance from month ${prevMonth + 1}/${year}`);
    
    if (!data[year] || !data[year][prevMonth]) {
      console.log(`❌ No data found for month ${prevMonth + 1}/${year}, returning 0`);
      return 0;
    }
    
    // Procura o último dia disponível do mês anterior
    for (let day = daysInPrevMonth; day >= 1; day--) {
      if (data[year][prevMonth][day] && typeof data[year][prevMonth][day].balance === 'number') {
        const balance = data[year][prevMonth][day].balance;
        console.log(`✅ Found ${prevMonth + 1}/${day}/${year} balance: ${balance}`);
        return balance;
      }
    }
    
    console.log(`❌ No valid balance found for month ${prevMonth + 1}/${year}, returning 0`);
    return 0;
  }, [getDaysInMonth]);

  // Função para obter saldo anterior CORRETO seguindo as regras da especificação
  const getPreviousBalance = useCallback((data: FinancialData, year: number, month: number, day: number): number => {
    if (day === 1) {
      if (month === 0) {
        // 1º de Janeiro - herdar saldo de 31 de dezembro do ano anterior
        const previousYearBalance = getLastDecemberBalance(data, year - 1);
        console.log(`🎯 Jan 1, ${year}: inheriting from Dec 31, ${year - 1} = ${previousYearBalance}`);
        return previousYearBalance;
      } else {
        // 1º do mês (não Janeiro) - herdar saldo do último dia do mês anterior
        const prevMonthBalance = getLastMonthBalance(data, year, month);
        console.log(`🎯 ${month + 1}/1/${year}: inheriting from previous month = ${prevMonthBalance}`);
        return prevMonthBalance;
      }
    } else {
      // Dia normal - herdar do dia anterior no mesmo mês
      if (data[year] && data[year][month] && data[year][month][day - 1] &&
          typeof data[year][month][day - 1].balance === 'number') {
        const balance = data[year][month][day - 1].balance;
        console.log(`🎯 ${month + 1}/${day}/${year}: inheriting from previous day = ${balance}`);
        return balance;
      }
      console.log(`❌ No previous day balance found for ${month + 1}/${day}/${year}, returning 0`);
      return 0;
    }
  }, [getLastDecemberBalance, getLastMonthBalance]);

  // Função de recálculo em cascata CORRETA seguindo a especificação
  const recalculateBalances = useCallback((
    data: FinancialData,
    startYear?: number,
    startMonth?: number,
    startDay?: number
  ): FinancialData => {
    console.log(`🧮 Starting CASCADE recalculation from ${startYear}-${(startMonth || 0) + 1}-${startDay}`);
    
    const newData = JSON.parse(JSON.stringify(data)); // Deep clone
    const years = Object.keys(newData).map(Number).sort();
    
    if (years.length === 0) return newData;
    
    // Define ponto de início do recálculo
    const firstYear = startYear || Math.min(...years);
    const firstMonth = startMonth !== undefined ? startMonth : 0;
    const firstDay = startDay || 1;
    
    console.log(`🔄 Recalculating from ${firstYear}-${firstMonth + 1}-${firstDay}`);
    
    // ITERAÇÃO CRONOLÓGICA SEQUENCIAL incluindo TODOS os anos
    for (const year of years.filter(y => y >= firstYear)) {
      const startMonthForYear = (year === firstYear) ? firstMonth : 0;
      const endMonthForYear = 11; // Dezembro
      
      console.log(`📅 Processing year ${year} from month ${startMonthForYear + 1} to 12`);
      
      for (let month = startMonthForYear; month <= endMonthForYear; month++) {
        if (!newData[year] || !newData[year][month]) continue;
        
        const startDayForMonth = (year === firstYear && month === firstMonth) ? firstDay : 1;
        const endDayForMonth = getDaysInMonth(year, month);
        
        console.log(`📅 Processing ${year}-${month + 1} from day ${startDayForMonth} to ${endDayForMonth}`);
        
        // Recalcula todos os dias do mês em ordem cronológica
        for (let day = startDayForMonth; day <= endDayForMonth; day++) {
          if (!newData[year][month][day]) continue;
          
          const dayData = newData[year][month][day];
          
          // Parse dos valores do dia atual
          const entrada = parseCurrency(dayData.entrada);
          const saida = parseCurrency(dayData.saida);
          const diario = parseCurrency(dayData.diario);
          
          // Obter saldo anterior seguindo as regras da especificação
          const previousBalance = getPreviousBalance(newData, year, month, day);
          
          // FÓRMULA FUNDAMENTAL da especificação:
          // Saldo Atual = Saldo Anterior + Entrada - Saída - Diário
          const newBalance = previousBalance + entrada - saida - diario;
          
          // Atualizar o saldo calculado
          dayData.balance = newBalance;
          
          console.log(`💰 ${year}-${month+1}-${day}: ${previousBalance} + ${entrada} - ${saida} - ${diario} = ${newBalance}`);
        }
      }
    }
    
    console.log('✅ CASCADE recalculation completed following specification');
    return newData;
  }, [getPreviousBalance, getDaysInMonth]);

  return {
    recalculateBalances,
    getLastDecemberBalance,
    getDaysInMonth,
    isLeapYear
  };
};
