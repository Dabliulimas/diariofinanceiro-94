
import { useCallback } from 'react';
import { FinancialData } from './useFinancialData';
import { parseCurrency } from '../utils/currencyUtils';

export const useBalancePropagation = () => {
  // Função para obter o saldo do último dia de dezembro
  const getLastDecemberBalance = useCallback((data: FinancialData, year: number): number => {
    if (!data[year] || !data[year][11] || !data[year][11][31]) {
      // Se não há 31/12, procura o último dia disponível em dezembro
      if (data[year] && data[year][11]) {
        const decemberDays = Object.keys(data[year][11]).map(Number).sort((a, b) => b - a);
        for (const day of decemberDays) {
          if (data[year][11][day] && typeof data[year][11][day].balance === 'number') {
            console.log(`📊 Last December balance for ${year}: ${data[year][11][day].balance} (day ${day})`);
            return data[year][11][day].balance;
          }
        }
      }
      return 0;
    }
    
    console.log(`📊 December 31st balance for ${year}: ${data[year][11][31].balance}`);
    return data[year][11][31].balance;
  }, []);

  // Função para inicializar um ano se não existir
  const initializeYearIfNeeded = useCallback((data: FinancialData, year: number): void => {
    if (!data[year]) {
      data[year] = {};
      console.log(`🏗️ Initialized year ${year}`);
    }
    
    if (!data[year][0]) {
      data[year][0] = {};
      console.log(`🏗️ Initialized January ${year}`);
    }
    
    if (!data[year][0][1]) {
      data[year][0][1] = {
        entrada: "R$ 0,00",
        saida: "R$ 0,00",
        diario: "R$ 0,00",
        balance: 0
      };
      console.log(`🏗️ Initialized January 1st ${year}`);
    }
  }, []);

  // Função principal de propagação recursiva entre anos
  const propagateBalancesBetweenYears = useCallback((data: FinancialData, startYear?: number): FinancialData => {
    console.log('🔄 Starting recursive balance propagation between years');
    
    const newData = { ...data };
    const years = Object.keys(newData).map(Number).sort((a, b) => a - b);
    const currentYear = new Date().getFullYear();
    const maxYear = Math.max(...years, currentYear + 10); // Propaga até 10 anos à frente
    
    // Se especificou um ano inicial, começar dele
    const firstYear = startYear || Math.min(...years, currentYear);
    
    for (let year = firstYear; year <= maxYear; year++) {
      // Só propaga se o ano atual existe nos dados ou se há necessidade de continuidade
      if (!newData[year] && year < currentYear + 5) continue;
      
      const decemberBalance = getLastDecemberBalance(newData, year);
      
      // Se há saldo em dezembro OU se há dados no próximo ano, propaga
      if (decemberBalance !== 0 || newData[year + 1]) {
        console.log(`🔗 Propagating balance from ${year} to ${year + 1}: ${decemberBalance}`);
        
        // Inicializar próximo ano se necessário
        initializeYearIfNeeded(newData, year + 1);
        
        // Aplicar saldo de dezembro como saldo inicial do próximo ano
        newData[year + 1][0][1].balance = decemberBalance;
        
        // Se o próximo ano já tem outros dados, recalcular todos os saldos
        if (newData[year + 1] && Object.keys(newData[year + 1]).length > 1) {
          console.log(`🧮 Recalculating ${year + 1} after propagation`);
          const recalculatedData = recalculateYearBalances(newData, year + 1);
          Object.assign(newData, recalculatedData);
        }
      }
    }
    
    return newData;
  }, [getLastDecemberBalance, initializeYearIfNeeded]);

  // Função para recalcular saldos de um ano específico
  const recalculateYearBalances = useCallback((data: FinancialData, year: number): FinancialData => {
    const newData = { ...data };
    
    if (!newData[year]) return newData;
    
    console.log(`🧮 Recalculating all balances for year ${year}`);
    
    for (let month = 0; month < 12; month++) {
      if (!newData[year][month]) continue;
      
      const days = Object.keys(newData[year][month]).map(Number).sort((a, b) => a - b);
      
      for (const day of days) {
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
    
    return newData;
  }, []);

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
          for (let d = daysInPrevMonth; d >= 1; d--) {
            if (data[year][prevMonth][d] && typeof data[year][prevMonth][d].balance === 'number') {
              return data[year][prevMonth][d].balance;
            }
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

  // Função principal de recálculo com propagação automática
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
      
      newData = recalculateYearBalances(newData, year);
    }
    
    // Depois, aplicar propagação automática entre anos
    const propagationStartYear = startYear || Math.min(...years);
    newData = propagateBalancesBetweenYears(newData, propagationStartYear);
    
    return newData;
  }, [recalculateYearBalances, propagateBalancesBetweenYears]);

  return {
    propagateBalancesBetweenYears,
    recalculateWithPropagation,
    recalculateYearBalances,
    getLastDecemberBalance,
    initializeYearIfNeeded
  };
};
