
import { useCallback } from 'react';
import { FinancialData } from './useFinancialData';
import { parseCurrency } from '../utils/currencyUtils';

export const useBalancePropagation = () => {
  // Função para obter o saldo do último dia disponível de dezembro
  const getLastDecemberBalance = useCallback((data: FinancialData, year: number): number => {
    if (!data[year] || !data[year][11]) return 0;
    
    // Procura o último dia disponível em dezembro (pode não ser 31)
    const decemberDays = Object.keys(data[year][11]).map(Number).sort((a, b) => b - a);
    for (const day of decemberDays) {
      if (data[year][11][day] && typeof data[year][11][day].balance === 'number') {
        console.log(`📊 Last December balance for ${year}: ${data[year][11][day].balance} (day ${day})`);
        return data[year][11][day].balance;
      }
    }
    return 0;
  }, []);

  // Função para obter saldo anterior de qualquer dia
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
      // Dia normal - herdar do dia anterior
      if (data[year] && data[year][month] && data[year][month][day - 1]) {
        return data[year][month][day - 1].balance;
      }
      return 0;
    }
  }, [getLastDecemberBalance]);

  // Função para inicializar um ano/mês/dia se não existir
  const initializeDataStructure = useCallback((data: FinancialData, year: number, month?: number, day?: number): void => {
    if (!data[year]) {
      data[year] = {};
      console.log(`🏗️ Initialized year ${year}`);
    }
    
    if (month !== undefined) {
      if (!data[year][month]) {
        data[year][month] = {};
        console.log(`🏗️ Initialized month ${month + 1}/${year}`);
      }
      
      if (day !== undefined && !data[year][month][day]) {
        data[year][month][day] = {
          entrada: "R$ 0,00",
          saida: "R$ 0,00",
          diario: "R$ 0,00",
          balance: 0
        };
        console.log(`🏗️ Initialized day ${day}/${month + 1}/${year}`);
      }
    }
  }, []);

  // Função principal de recálculo COMPLETO e AUTOMÁTICO
  const recalculateWithFullPropagation = useCallback((
    data: FinancialData,
    startYear?: number,
    startMonth?: number,
    startDay?: number
  ): FinancialData => {
    console.log(`🧮 Starting COMPLETE balance recalculation from ${startYear || 'beginning'}-${(startMonth || 0) + 1}-${startDay || 1}`);
    
    const newData = { ...data };
    const years = Object.keys(newData).map(Number).sort();
    const currentYear = new Date().getFullYear();
    const maxYear = Math.max(...years, currentYear + 10); // Propaga até 10 anos à frente
    
    // Define ponto de início
    const firstYear = startYear || (years.length > 0 ? Math.min(...years) : currentYear);
    const firstMonth = startMonth || 0;
    const firstDay = startDay || 1;
    
    console.log(`🎯 Recalculation range: ${firstYear}-${firstMonth + 1}-${firstDay} to ${maxYear}-12-31`);
    
    // Recalcula TODOS os saldos a partir do ponto especificado
    for (let year = firstYear; year <= maxYear; year++) {
      const startMonthForYear = (year === firstYear) ? firstMonth : 0;
      
      for (let month = startMonthForYear; month < 12; month++) {
        if (!newData[year] || !newData[year][month]) continue;
        
        const startDayForMonth = (year === firstYear && month === firstMonth) ? firstDay : 1;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Percorre todos os dias do mês
        for (let day = startDayForMonth; day <= daysInMonth; day++) {
          if (!newData[year][month][day]) continue;
          
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
      
      // Após terminar o ano, propagar para o próximo ano
      const decemberBalance = getLastDecemberBalance(newData, year);
      if (decemberBalance !== 0 && year < maxYear) {
        console.log(`🔗 Propagating balance from ${year} to ${year + 1}: ${decemberBalance}`);
        
        // Inicializar próximo ano se necessário
        initializeDataStructure(newData, year + 1, 0, 1);
        
        // Aplicar saldo de dezembro como saldo inicial do próximo ano
        newData[year + 1][0][1].balance = decemberBalance;
      }
    }
    
    console.log('✅ Complete balance recalculation finished with full propagation');
    return newData;
  }, [getPreviousBalance, getLastDecemberBalance, initializeDataStructure]);

  // Função simplificada para uso externo
  const recalculateBalances = useCallback((
    data: FinancialData,
    startYear?: number,
    startMonth?: number,
    startDay?: number
  ): FinancialData => {
    return recalculateWithFullPropagation(data, startYear, startMonth, startDay);
  }, [recalculateWithFullPropagation]);

  return {
    recalculateBalances,
    recalculateWithFullPropagation,
    getLastDecemberBalance,
    initializeDataStructure
  };
};
