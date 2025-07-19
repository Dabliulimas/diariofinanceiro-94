
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

  // Função CORRIGIDA para obter o último saldo válido de dezembro
  const getLastDecemberBalance = useCallback((data: FinancialData, year: number): number => {
    console.log(`🔍 Getting last December balance for year ${year}`);
    
    // Verificar se o ano existe
    if (!data[year]) {
      console.log(`❌ Year ${year} not found, returning 0`);
      return 0;
    }
    
    // Verificar se dezembro existe
    if (!data[year][11]) {
      console.log(`❌ December ${year} not found, returning 0`);
      return 0;
    }
    
    // Procurar o último dia válido de dezembro (31, 30, 29...)
    const decemberData = data[year][11];
    const daysInDecember = getDaysInMonth(year, 11);
    
    for (let day = daysInDecember; day >= 1; day--) {
      if (decemberData[day] && typeof decemberData[day].balance === 'number') {
        const balance = decemberData[day].balance;
        console.log(`✅ Found December ${day}, ${year} balance: ${balance}`);
        return balance;
      }
    }
    
    console.log(`❌ No valid December balance found for year ${year}, returning 0`);
    return 0;
  }, [getDaysInMonth]);

  // Função CORRIGIDA para obter o saldo inicial correto para qualquer mês
  const getInitialBalanceForMonth = useCallback((data: FinancialData, year: number, month: number): number => {
    if (month === 0) {
      // Janeiro - herdar de dezembro do ano anterior
      const previousYearBalance = getLastDecemberBalance(data, year - 1);
      console.log(`🎯 Initial balance for Jan ${year}: ${previousYearBalance} (from Dec ${year - 1})`);
      return previousYearBalance;
    } else {
      // Outros meses - herdar do último dia do mês anterior
      const prevMonth = month - 1;
      const daysInPrevMonth = getDaysInMonth(year, prevMonth);
      
      if (data[year] && data[year][prevMonth]) {
        const prevMonthData = data[year][prevMonth];
        for (let day = daysInPrevMonth; day >= 1; day--) {
          if (prevMonthData[day] && typeof prevMonthData[day].balance === 'number') {
            const balance = prevMonthData[day].balance;
            console.log(`🎯 Initial balance for ${month + 1}/${year}: ${balance} (from ${prevMonth + 1}/${day}/${year})`);
            return balance;
          }
        }
      }
      
      console.log(`🎯 No previous balance found for ${month + 1}/${year}, using 0`);
      return 0;
    }
  }, [getLastDecemberBalance, getDaysInMonth]);

  // Função CORRIGIDA de recálculo em cascata com propagação FORÇADA entre anos
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
          const entrada = dayData.entrada ? parseCurrency(dayData.entrada) : 0;
          const saida = dayData.saida ? parseCurrency(dayData.saida) : 0;
          const diario = dayData.diario ? parseCurrency(dayData.diario) : 0;
          
          // Obter saldo anterior CORRETO
          let previousBalance = 0;
          
          if (day === 1) {
            // Primeiro dia do mês
            previousBalance = getInitialBalanceForMonth(newData, year, month);
          } else {
            // Dia normal - herdar do dia anterior no mesmo mês
            if (newData[year][month][day - 1] && typeof newData[year][month][day - 1].balance === 'number') {
              previousBalance = newData[year][month][day - 1].balance;
            }
          }
          
          // FÓRMULA FUNDAMENTAL: Saldo Atual = Saldo Anterior + Entrada - Saída - Diário
          const newBalance = previousBalance + entrada - saida - diario;
          
          // Atualizar o saldo calculado
          dayData.balance = newBalance;
          
          console.log(`💰 ${year}-${month+1}-${day}: ${previousBalance} + ${entrada} - ${saida} - ${diario} = ${newBalance}`);
          
          // PROPAGAÇÃO FORÇADA: Se é 31 de dezembro, forçar criação de janeiro do próximo ano
          if (month === 11 && day === 31) {
            const nextYear = year + 1;
            console.log(`🔄 Year-end transfer: ${newBalance} from Dec ${year} to Jan ${nextYear}`);
            
            // Criar próximo ano se não existir
            if (!newData[nextYear]) {
              newData[nextYear] = {};
            }
            if (!newData[nextYear][0]) {
              newData[nextYear][0] = {};
              // Inicializar todos os dias de janeiro do próximo ano
              for (let janDay = 1; janDay <= getDaysInMonth(nextYear, 0); janDay++) {
                newData[nextYear][0][janDay] = {
                  entrada: "R$ 0,00",
                  saida: "R$ 0,00",
                  diario: "R$ 0,00",
                  balance: janDay === 1 ? newBalance : 0
                };
              }
            }
            
            // Garantir que 1º de janeiro do próximo ano tenha o saldo correto
            if (newData[nextYear][0][1]) {
              newData[nextYear][0][1].balance = newBalance;
              console.log(`✅ Forced Jan 1, ${nextYear} balance to: ${newBalance}`);
            }
          }
        }
      }
    }
    
    console.log('✅ CASCADE recalculation completed with FORCED year-end propagation');
    return newData;
  }, [getDaysInMonth, getInitialBalanceForMonth]);

  return {
    recalculateBalances,
    getLastDecemberBalance,
    getInitialBalanceForMonth,
    getDaysInMonth,
    isLeapYear
  };
};
