
import { useCallback } from 'react';
import { RecurringTransaction } from './useRecurringTransactions';

export const useRecurringProcessor = () => {
  const processRecurringTransactions = useCallback((
    recurringTransactions: RecurringTransaction[],
    year: number,
    month: number,
    addToDay: (year: number, month: number, day: number, type: 'entrada' | 'saida' | 'diario', amount: number) => void,
    updateRecurringTransaction: (id: string, updates: Partial<RecurringTransaction>) => void
  ) => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const targetDate = new Date(year, month, 1);
    
    // Só processa se for mês atual ou futuro
    if (targetDate < new Date(currentYear, currentMonth, 1)) {
      console.log(`⏭️ Skipping processing for past month: ${year}-${month + 1}`);
      return;
    }

    const activeTransactions = recurringTransactions.filter(t => t.isActive);
    
    console.log(`🔄 Processing ${activeTransactions.length} recurring transactions for ${year}-${month + 1}`);
    
    activeTransactions.forEach(transaction => {
      const { dayOfMonth, type, amount, frequency, remainingCount, monthsDuration, remainingMonths, startDate, id } = transaction;
      
      // Verificar se a transação deve ser processada para este mês
      const startDateObj = new Date(startDate);
      const targetMonthDate = new Date(year, month, 1);
      const startMonthDate = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), 1);
      
      // Pular se a transação ainda não começou
      if (targetMonthDate < startMonthDate) {
        console.log(`⏭️ Transaction ${id} hasn't started yet for ${year}-${month + 1}`);
        return;
      }
      
      // Verificar se a duração mensal expirou
      if (frequency === 'monthly-duration' && monthsDuration && remainingMonths !== undefined) {
        if (remainingMonths <= 0) {
          updateRecurringTransaction(id, { isActive: false });
          console.log(`🔄 Deactivated transaction ${id} - monthly duration expired`);
          return;
        }
      }
      
      // Verificar se a contagem fixa expirou
      if (frequency === 'fixed-count' && remainingCount !== undefined && remainingCount <= 0) {
        updateRecurringTransaction(id, { isActive: false });
        console.log(`🔄 Deactivated transaction ${id} - count expired`);
        return;
      }
      
      // Calcular o dia válido do mês
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const targetDay = Math.min(dayOfMonth, daysInMonth);
      
      // Verificar se é um mês futuro ou se é o mês atual mas o dia ainda não passou
      const today = new Date();
      const targetDayDate = new Date(year, month, targetDay);
      const isValidForProcessing = targetDayDate >= today || 
        (year === currentYear && month === currentMonth && targetDay >= today.getDate());
      
      if (!isValidForProcessing) {
        console.log(`⏭️ Skipping past date: ${year}-${month + 1}-${targetDay}`);
        return;
      }
      
      console.log(`💰 Adding recurring ${type}: ${amount} on day ${targetDay} for ${year}-${month + 1}`);
      
      // Adicionar ao dia apropriado
      addToDay(year, month, targetDay, type, amount);
      
      // Atualizar contadores apenas se estamos processando o mês atual ou futuro
      // e apenas uma vez por processamento
      if (frequency === 'fixed-count' && remainingCount !== undefined) {
        const newCount = Math.max(0, remainingCount - 1);
        const updates: Partial<RecurringTransaction> = { remainingCount: newCount };
        if (newCount <= 0) {
          updates.isActive = false;
        }
        updateRecurringTransaction(id, updates);
        console.log(`🔄 Updated remaining count for ${id}: ${newCount}`);
      } else if (frequency === 'monthly-duration' && remainingMonths !== undefined) {
        const newMonthsRemaining = Math.max(0, remainingMonths - 1);
        const updates: Partial<RecurringTransaction> = { remainingMonths: newMonthsRemaining };
        if (newMonthsRemaining <= 0) {
          updates.isActive = false;
        }
        updateRecurringTransaction(id, updates);
        console.log(`🔄 Updated remaining months for ${id}: ${newMonthsRemaining}`);
      }
    });
  }, []);

  return { processRecurringTransactions };
};
