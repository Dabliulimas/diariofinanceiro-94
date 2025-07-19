
import { useCallback, useRef, useMemo } from 'react';
import { useFinancialData } from './useFinancialData';
import { useTransactions, TransactionEntry } from './useTransactions';

export const useImprovedFinancialSync = () => {
  const financialData = useFinancialData();
  const transactions = useTransactions();
  
  // CONTROLE RIGOROSO para prevenir múltiplos processamentos
  const processingRef = useRef<boolean>(false);
  const lastProcessedHashRef = useRef<string>('');
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hash melhorado para transações
  const createTransactionHash = useCallback((transaction: {
    date: string;
    type: string;
    description: string;
    amount: number;
  }): string => {
    return `${transaction.date}|${transaction.type}|${transaction.description.toLowerCase().trim()}|${transaction.amount.toFixed(2)}`;
  }, []);

  // Verificação rigorosa de duplicatas
  const isDuplicateTransaction = useCallback((
    newTransaction: { date: string; type: string; description: string; amount: number },
    existingTransactions: TransactionEntry[]
  ): boolean => {
    const newSignature = createTransactionHash(newTransaction);
    
    const duplicate = existingTransactions.some(t => 
      createTransactionHash(t) === newSignature
    );
    
    if (duplicate) {
      console.log(`🚫 DUPLICATE BLOCKED: ${newTransaction.description} on ${newTransaction.date}`);
    }
    
    return duplicate;
  }, [createTransactionHash]);

  // Função para contar transações em uma data específica
  const countTransactionsForDate = useCallback((date: string): {
    entrada: number;
    saida: number;
    diario: number;
    total: number;
  } => {
    const dateTransactions = transactions.transactions.filter(t => t.date === date);
    return {
      entrada: dateTransactions.filter(t => t.type === 'entrada').length,
      saida: dateTransactions.filter(t => t.type === 'saida').length,
      diario: dateTransactions.filter(t => t.type === 'diario').length,
      total: dateTransactions.length
    };
  }, [transactions.transactions]);

  // Rebuild OTIMIZADO seguindo a lógica financeira correta
  const rebuildFinancialDataFromTransactions = useCallback((): void => {
    if (processingRef.current) {
      console.log('⏭️ Rebuild already in progress, skipping');
      return;
    }
    
    // Clear existing debounce
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Debounce the rebuild
    debounceTimeoutRef.current = setTimeout(() => {
      processingRef.current = true;
      console.log('🔄 Starting CONTROLLED financial data rebuild following specification');
      
      try {
        const allTransactions = transactions.transactions;
        const transactionsHash = JSON.stringify(allTransactions.map(t => `${t.id}-${t.date}-${t.amount}`).sort());
        
        // Skip rebuild if transactions haven't changed
        if (transactionsHash === lastProcessedHashRef.current) {
          console.log('⏭️ Transactions unchanged, skipping rebuild');
          processingRef.current = false;
          return;
        }
        
        console.log(`📊 Processing ${allTransactions.length} transactions for CORRECT rebuild`);
        
        // PRIMEIRO: Limpar todos os valores existentes para R$ 0,00
        const currentData = financialData.data;
        const years = Object.keys(currentData).map(Number).sort();
        
        for (const year of years) {
          for (let month = 0; month < 12; month++) {
            if (currentData[year] && currentData[year][month]) {
              const monthData = currentData[year][month];
              const days = Object.keys(monthData).map(Number).sort();
              
              for (const day of days) {
                // Resetar valores para zero, mantendo estrutura
                financialData.updateDayData(year, month, day, 'entrada', 'R$ 0,00');
                financialData.updateDayData(year, month, day, 'saida', 'R$ 0,00');
                financialData.updateDayData(year, month, day, 'diario', 'R$ 0,00');
              }
            }
          }
        }
        
        // SEGUNDO: Reagrupar e aplicar transações
        const transactionsByDate: { [date: string]: { entrada: number; saida: number; diario: number } } = {};
        
        allTransactions.forEach(transaction => {
          const dateKey = transaction.date;
          
          if (!transactionsByDate[dateKey]) {
            transactionsByDate[dateKey] = { entrada: 0, saida: 0, diario: 0 };
          }
          
          transactionsByDate[dateKey][transaction.type] += transaction.amount;
        });
        
        // TERCEIRO: Aplicar valores agrupados aos dados financeiros
        let earliestYear: number | undefined;
        let earliestMonth: number | undefined;
        let earliestDay: number | undefined;
        
        Object.entries(transactionsByDate).forEach(([dateKey, values]) => {
          const [year, month, day] = dateKey.split('-').map(Number);
          
          // Track earliest change for cascade recalculation
          if (!earliestYear || year < earliestYear || 
              (year === earliestYear && month - 1 < (earliestMonth || 0)) ||
              (year === earliestYear && month - 1 === (earliestMonth || 0) && day < (earliestDay || 0))) {
            earliestYear = year;
            earliestMonth = month - 1;
            earliestDay = day;
          }
          
          financialData.initializeMonth(year, month - 1);
          
          // Update values efficiently following specification format
          if (values.entrada > 0) {
            const formattedValue = `R$ ${values.entrada.toFixed(2).replace('.', ',')}`;
            financialData.updateDayData(year, month - 1, day, 'entrada', formattedValue);
          }
          if (values.saida > 0) {
            const formattedValue = `R$ ${values.saida.toFixed(2).replace('.', ',')}`;
            financialData.updateDayData(year, month - 1, day, 'saida', formattedValue);
          }
          if (values.diario > 0) {
            const formattedValue = `R$ ${values.diario.toFixed(2).replace('.', ',')}`;
            financialData.updateDayData(year, month - 1, day, 'diario', formattedValue);
          }
        });
        
        // QUARTO: Trigger CASCADE recalculation from earliest change
        if (earliestYear && earliestMonth !== undefined && earliestDay) {
          console.log(`🧮 Triggering CASCADE recalculation from ${earliestYear}-${earliestMonth + 1}-${earliestDay}`);
          financialData.recalculateBalances(earliestYear, earliestMonth, earliestDay);
        } else {
          // Se não há transações, recalcular tudo do início
          console.log('🧮 No transactions found, triggering full recalculation');
          financialData.recalculateBalances();
        }
        
        lastProcessedHashRef.current = transactionsHash;
        console.log('✅ CONTROLLED financial data rebuild completed with proper cleanup');
        
      } catch (error) {
        console.error('❌ Error in controlled rebuild:', error);
      } finally {
        processingRef.current = false;
      }
    }, 300); // Reduced debounce for faster response
  }, [financialData, transactions]);

  // Add transaction with STRICT duplicate control
  const addTransactionAndSync = useCallback((transaction: Omit<TransactionEntry, 'id' | 'createdAt'>): void => {
    console.log('🔄 Adding transaction with STRICT control following specification:', transaction);
    
    // Strict duplicate check
    if (isDuplicateTransaction(transaction, transactions.transactions)) {
      console.log('🚫 TRANSACTION BLOCKED - Duplicate detected');
      return;
    }
    
    try {
      // Add transaction
      transactions.addTransaction(transaction);
      
      // Apply to financial data immediately following specification
      const [year, month, day] = transaction.date.split('-').map(Number);
      financialData.initializeMonth(year, month - 1);
      financialData.addToDay(year, month - 1, day, transaction.type, transaction.amount);
      
      // Trigger CASCADE recalculation from this point following specification
      financialData.recalculateBalances(year, month - 1, day);
      
      console.log('✅ Transaction added with CASCADE recalculation following specification');
      
    } catch (error) {
      console.error('❌ Error adding transaction:', error);
    }
  }, [transactions, financialData, isDuplicateTransaction]);

  // Update with controlled rebuild
  const updateTransactionAndSync = useCallback((id: string, updates: Partial<TransactionEntry>): void => {
    console.log('✏️ Updating transaction with controlled rebuild following specification:', id);
    
    transactions.updateTransaction(id, updates);
    rebuildFinancialDataFromTransactions();
  }, [transactions, rebuildFinancialDataFromTransactions]);

  // Delete with validation and controlled rebuild
  const deleteTransactionAndSync = useCallback((id: string): void => {
    console.log('🗑️ Deleting transaction with controlled rebuild following specification:', id);
    
    // Encontrar a transação para validar múltiplos lançamentos
    const transactionToDelete = transactions.transactions.find(t => t.id === id);
    if (!transactionToDelete) {
      console.log('❌ Transaction not found for deletion');
      return;
    }
    
    // Contar transações na mesma data
    const transactionsCount = countTransactionsForDate(transactionToDelete.date);
    
    // Se há múltiplas transações na mesma data, avisar o usuário
    if (transactionsCount.total > 1) {
      const confirmMessage = `⚠️ ATENÇÃO: Há ${transactionsCount.total} lançamentos em ${transactionToDelete.date}:\n` +
        `• Entradas: ${transactionsCount.entrada}\n` +
        `• Saídas: ${transactionsCount.saida}\n` +
        `• Diário: ${transactionsCount.diario}\n\n` +
        `Você está deletando: ${transactionToDelete.type} - ${transactionToDelete.description} - R$ ${transactionToDelete.amount.toFixed(2).replace('.', ',')}\n\n` +
        `Deseja realmente continuar? Os outros lançamentos desta data não serão afetados.`;
      
      if (!confirm(confirmMessage)) {
        console.log('🚫 Deletion cancelled by user');
        return;
      }
    }
    
    transactions.deleteTransaction(id);
    rebuildFinancialDataFromTransactions();
  }, [transactions, rebuildFinancialDataFromTransactions, countTransactionsForDate]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    processingRef.current = false;
  }, []);

  // Memoized return object for better performance
  const returnValue = useMemo(() => ({
    ...financialData,
    ...transactions,
    addTransactionAndSync,
    updateTransactionAndSync,  
    deleteTransactionAndSync,
    forceRecalculation: rebuildFinancialDataFromTransactions,
    rebuildFinancialDataFromTransactions,
    countTransactionsForDate,
    cleanup
  }), [
    financialData,
    transactions,
    addTransactionAndSync,
    updateTransactionAndSync,  
    deleteTransactionAndSync,
    rebuildFinancialDataFromTransactions,
    countTransactionsForDate,
    cleanup
  ]);

  return returnValue;
};
