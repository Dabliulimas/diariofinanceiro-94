
import { useCallback } from 'react';
import { useFinancialData } from './useFinancialData';
import { useTransactions, TransactionEntry } from './useTransactions';

export const useSyncedFinancialData = () => {
  const financialData = useFinancialData();
  const transactions = useTransactions();

  // Função para reconstruir completamente os dados financeiros a partir das transações
  const rebuildFinancialDataFromTransactions = useCallback((): void => {
    console.log('🔄 Rebuilding financial data from transactions');
    
    // Aguardar um frame para garantir que as transações estão atualizadas
    requestAnimationFrame(() => {
      const allTransactions = transactions.transactions;
      
      // Limpar dados financeiros primeiro
      // Não podemos limpar diretamente, então vamos reconstruir do zero
      const transactionsByDate: { [date: string]: { entrada: number; saida: number; diario: number } } = {};
      
      // Agrupar transações por data
      allTransactions.forEach(transaction => {
        const [year, month, day] = transaction.date.split('-').map(Number);
        const dateKey = transaction.date;
        
        if (!transactionsByDate[dateKey]) {
          transactionsByDate[dateKey] = { entrada: 0, saida: 0, diario: 0 };
        }
        
        transactionsByDate[dateKey][transaction.type] += transaction.amount;
        
        // Inicializar mês se necessário
        financialData.initializeMonth(year, month - 1);
      });
      
      // Aplicar os valores agrupados
      Object.entries(transactionsByDate).forEach(([dateKey, values]) => {
        const [year, month, day] = dateKey.split('-').map(Number);
        
        // Atualizar cada tipo de transação
        if (values.entrada > 0) {
          financialData.updateDayData(year, month - 1, day, 'entrada', `R$ ${values.entrada.toFixed(2).replace('.', ',')}`);
        }
        if (values.saida > 0) {
          financialData.updateDayData(year, month - 1, day, 'saida', `R$ ${values.saida.toFixed(2).replace('.', ',')}`);
        }
        if (values.diario > 0) {
          financialData.updateDayData(year, month - 1, day, 'diario', `R$ ${values.diario.toFixed(2).replace('.', ',')}`);
        }
      });
      
      console.log('✅ Financial data rebuild completed');
    });
  }, [financialData, transactions]);

  // MAIN SYNC FUNCTION - simplificada para evitar loops
  const addTransactionAndSync = useCallback((transaction: Omit<TransactionEntry, 'id' | 'createdAt'>): void => {
    console.log('🔄 Adding transaction with sync:', transaction);
    
    // Verificar se já existe uma transação idêntica
    const existingTransaction = transactions.transactions.find(t => 
      t.date === transaction.date && 
      t.type === transaction.type && 
      t.description === transaction.description &&
      t.amount === transaction.amount
    );
    
    if (existingTransaction) {
      console.log('⏭️ Transaction already exists, skipping:', transaction);
      return;
    }
    
    // Adicionar transação
    const newTransaction = transactions.addTransaction(transaction);
    
    // Aplicar ao dados financeiros
    const [year, month, day] = transaction.date.split('-').map(Number);
    financialData.initializeMonth(year, month - 1);
    financialData.addToDay(year, month - 1, day, transaction.type, transaction.amount);
    
    console.log('✅ Transaction added and synced');
  }, [transactions, financialData]);

  // UPDATE with targeted rebuild
  const updateTransactionAndSync = useCallback((id: string, updates: Partial<TransactionEntry>): void => {
    console.log('🔄 Updating transaction:', id, updates);
    
    transactions.updateTransaction(id, updates);
    
    // Rebuild after update
    setTimeout(() => {
      rebuildFinancialDataFromTransactions();
    }, 100);
    
    console.log('✅ Transaction updated');
  }, [transactions, rebuildFinancialDataFromTransactions]);

  // DELETE with targeted rebuild
  const deleteTransactionAndSync = useCallback((id: string): void => {
    console.log('🔄 Deleting transaction:', id);
    
    transactions.deleteTransaction(id);
    
    // Rebuild after deletion
    setTimeout(() => {
      rebuildFinancialDataFromTransactions();
    }, 100);
    
    console.log('✅ Transaction deleted');
  }, [transactions, rebuildFinancialDataFromTransactions]);

  // Force complete recalculation
  const forceCompleteRecalculation = useCallback((): void => {
    console.log('🔄 Forcing complete recalculation');
    rebuildFinancialDataFromTransactions();
  }, [rebuildFinancialDataFromTransactions]);

  return {
    ...financialData,
    ...transactions,
    addTransactionAndSync,
    updateTransactionAndSync,
    deleteTransactionAndSync,
    forceRecalculation: forceCompleteRecalculation,
    rebuildFinancialDataFromTransactions
  };
};
