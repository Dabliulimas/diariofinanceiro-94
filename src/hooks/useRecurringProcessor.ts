
import { useCallback } from 'react';
import { RecurringTransaction } from './useRecurringTransactions';

export const useRecurringProcessor = () => {
  const processRecurringTransactions = useCallback((
    recurringTransactions: RecurringTransaction[],
    year: number,
    month: number,
    addTransactionAndSync: (transaction: {
      type: 'entrada' | 'saida';
      amount: number;
      description: string;
      date: string;
    }) => void,
    updateRecurringTransaction: (id: string, updates: Partial<RecurringTransaction>) => void,
    existingTransactions: any[] = []
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
    
    if (activeTransactions.length === 0) {
      console.log(`⏭️ No active recurring transactions for ${year}-${month + 1}`);
      return;
    }
    
    console.log(`🔄 Processing ${activeTransactions.length} recurring transactions for ${year}-${month + 1}`);
    
    activeTransactions.forEach(transaction => {
      const { dayOfMonth, type, amount, frequency, remainingCount, monthsDuration, remainingMonths, startDate, id, description } = transaction;
      
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
      
      // Formatar data no padrão YYYY-MM-DD
      const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
      
      // VERIFICAÇÃO CRÍTICA: Evitar duplicatas usando verificação mais rigorosa
      const recurringDescription = `🔄 ${description}`;
      const existingRecurring = existingTransactions.find(t => 
        t.date === formattedDate && 
        t.type === type && 
        t.description === recurringDescription &&
        t.amount === amount
      );
      
      if (existingRecurring) {
        console.log(`⏭️ Recurring transaction already exists for ${formattedDate}: ${description}`);
        return;
      }
      
      // Verificar se é uma data válida para processamento
      const today = new Date();
      const targetDayDate = new Date(year, month, targetDay);
      
      // Para meses futuros, sempre processar
      // Para mês atual, só processar se o dia ainda não passou
      const isValidForProcessing = year > currentYear || 
        month > currentMonth || 
        (year === currentYear && month === currentMonth && targetDay >= today.getDate());
      
      if (!isValidForProcessing) {
        console.log(`⏭️ Skipping past date: ${year}-${month + 1}-${targetDay}`);
        return;
      }
      
      console.log(`💰 Adding recurring ${type}: ${amount} on ${formattedDate} - ${description}`);
      
      // Adicionar transação recorrente com verificação adicional
      try {
        addTransactionAndSync({
          type,
          amount,
          description: recurringDescription,
          date: formattedDate
        });
        
        // Atualizar contadores APENAS após adição bem-sucedida
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
      } catch (error) {
        console.error(`❌ Error adding recurring transaction ${id}:`, error);
      }
    });
  }, []);

  return { processRecurringTransactions };
};
