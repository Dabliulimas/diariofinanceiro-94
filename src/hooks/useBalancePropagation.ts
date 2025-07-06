
import { useCallback } from 'react';
import { FinancialData } from './useFinancialData';
import { parseCurrency } from '../utils/currencyUtils';

export const useBalancePropagation = () => {
  // Função para obter o último saldo de dezembro de um ano
  const getLastDecemberBalance = useCallback((data: FinancialData, year: number): number => {
    if (!data[year] || !data[year][11]) return 0;

    const decemberDays = Object.keys(data[year][11]).map(Number).sort((a, b) => b - a);
    
    for (const day of decemberDays) {
      if (data[year][11][day] && typeof data[year][11][day].balance === 'number') {
        console.log(`📊 Last December balance for ${year}: ${data[year][11][day].balance} (day ${day})`);
        return data[year][11][day].balance;
      }
    }
    
    return 0;
  }, []);

  // Função para inicializar um ano se não existir
  const initializeYearIfNeeded = useCallback((data: FinancialData, year: number): FinancialData => {
    const newData = { ...data };
    
    if (!newData[year]) {
      newData[year] = {};
      console.log(`🏗️ Initialized year ${year}`);
    }
    
    if (!newData[year][0]) {
      newData[year][0] = {};
      console.log(`🏗️ Initialized January ${year}`);
    }
    
    if (!newData[year][0][1]) {
      newData[year][0][1] = {
        entrada: "R$ 0,00",
        saida: "R$ 0,00",
        diario: "R$ 0,00",
        balance: 0
      };
      console.log(`🏗️ Initialized January 1st ${year}`);
    }
    
    return newData;
  }, []);

  // Função principal de propagação automática entre anos
  const propagateBalancesBetweenYears = useCallback((data: FinancialData): FinancialData => {
    console.log('🔄 Starting automatic balance propagation between years');
    
    let newData = { ...data };
    const years = Object.keys(newData).map(Number).sort((a, b) => a - b);
    
    for (let i = 0; i < years.length; i++) {
      const currentYear = years[i];
      const nextYear = currentYear + 1;
      
      // Obter saldo final de dezembro do ano atual
      const decemberBalance = getLastDecemberBalance(newData, currentYear);
      
      // Se há saldo em dezembro OU se o próximo ano já existe nos dados
      if (decemberBalance !== 0 || newData[nextYear]) {
        console.log(`🔗 Propagating balance from ${currentYear} to ${nextYear}: ${decemberBalance}`);
        
        // Inicializar próximo ano se necessário
        newData = initializeYearIfNeeded(newData, nextYear);
        
        // Aplicar saldo de dezembro como saldo inicial do próximo ano
        newData[nextYear][0][1].balance = decemberBalance;
        
        // Adicionar o próximo ano à lista se não estiver lá
        if (!years.includes(nextYear)) {
          years.push(nextYear);
          years.sort((a, b) => a - b);
        }
      }
    }
    
    return newData;
  }, [getLastDecemberBalance, initializeYearIfNeeded]);

  // Função para recalcular saldos com propagação automática
  const recalculateWithPropagation = useCallback((
    data: FinancialData,
    startYear?: number,
    startMonth?: number,
    startDay?: number
  ): FinancialData => {
    console.log(`🧮 Recalculating balances with propagation from ${startYear || 'beginning'}`);
    
    let newData = { ...data };
    const years = Object.keys(newData).map(Number).sort();
    
    // Primeiro, recalcular todos os saldos normalmente
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
          
          // Obter saldo anterior
          const previousBalance = getPreviousBalance(newData, year, month, day);
          
          // Calcular novo saldo
          const newBalance = previousBalance + entrada - saida - diario;
          dayData.balance = newBalance;
          
          console.log(`💰 ${year}-${month+1}-${day}: ${previousBalance} + ${entrada} - ${saida} - ${diario} = ${newBalance}`);
        }
      }
    }
    
    // Depois, aplicar propagação automática entre anos
    newData = propagateBalancesBetweenYears(newData);
    
    return newData;
  }, [propagateBalancesBetweenYears]);

  // Função auxiliar para obter saldo anterior
  const getPreviousBalance = useCallback((data: FinancialData, year: number, month: number, day: number): number => {
    if (day === 1) {
      if (month === 0) {
        // Primeiro dia do ano - herdar do ano anterior
        const prevYear = year - 1;
        return getLastDecemberBalance(data, prevYear);
      } else {
        // Primeiro dia do mês - herdar do último dia do mês anterior
        const prevMonth = month - 1;
        if (data[year] && data[year][prevMonth]) {
          const daysInPrevMonth = new Date(year, month, 0).getDate();
          if (data[year][prevMonth][daysInPrevMonth]) {
            return data[year][prevMonth][daysInPrevMonth].balance;
          }
        }
        return 0;
      }
    } else {
      // Dia normal - herdar do dia anterior
      if (data[year] && data[year][month] && data[year][month][day - 1]) {
        return data[year][month][day - 1].balance;
      }
      return 0;
    }
  }, [getLastDecemberBalance]);

  return {
    propagateBalancesBetweenYears,
    recalculateWithPropagation,
    getLastDecemberBalance,
    initializeYearIfNeeded
  };
};
