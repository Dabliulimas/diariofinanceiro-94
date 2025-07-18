
import { useCallback, useRef } from 'react';
import { TransactionEntry } from './useTransactions';

interface IntegrityReport {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  duplicates: TransactionEntry[];
  statistics: {
    totalTransactions: number;
    uniqueTransactions: number;
    dateRange: { start: string; end: string } | null;
  };
}

export const useDataIntegrity = () => {
  const lastReportRef = useRef<IntegrityReport | null>(null);

  const validateTransactions = useCallback((transactions: TransactionEntry[]): IntegrityReport => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const duplicates: TransactionEntry[] = [];
    
    console.log('🔍 Starting data integrity validation...');
    
    // Check for duplicates
    const seen = new Set<string>();
    const signatures = new Map<string, TransactionEntry[]>();
    
    transactions.forEach(transaction => {
      // Validate required fields
      if (!transaction.id || !transaction.date || !transaction.type || transaction.amount === undefined) {
        errors.push(`Transaction missing required fields: ${JSON.stringify(transaction)}`);
        return;
      }
      
      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(transaction.date)) {
        errors.push(`Invalid date format: ${transaction.date}`);
      }
      
      // Validate amount
      if (isNaN(transaction.amount) || transaction.amount < 0) {
        errors.push(`Invalid amount: ${transaction.amount} for transaction ${transaction.id}`);
      }
      
      // Check for exact duplicates (same ID)
      if (seen.has(transaction.id)) {
        errors.push(`Duplicate transaction ID: ${transaction.id}`);
        duplicates.push(transaction);
      } else {
        seen.add(transaction.id);
      }
      
      // Check for logical duplicates (same data, different ID)
      const signature = `${transaction.date}-${transaction.type}-${transaction.description}-${transaction.amount}`;
      if (!signatures.has(signature)) {
        signatures.set(signature, []);
      }
      signatures.get(signature)!.push(transaction);
    });
    
    // Find logical duplicates
    signatures.forEach((transactionGroup, signature) => {
      if (transactionGroup.length > 1) {
        warnings.push(`Potential logical duplicates found: ${signature}`);
        duplicates.push(...transactionGroup.slice(1)); // Keep first, mark others as duplicates
      }
    });
    
    // Calculate statistics
    const validDates = transactions
      .map(t => t.date)
      .filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date))
      .sort();
    
    const dateRange = validDates.length > 0 
      ? { start: validDates[0], end: validDates[validDates.length - 1] }
      : null;
    
    const report: IntegrityReport = {
      isValid: errors.length === 0,
      errors,
      warnings,
      duplicates,
      statistics: {
        totalTransactions: transactions.length,
        uniqueTransactions: seen.size,
        dateRange
      }
    };
    
    lastReportRef.current = report;
    
    if (errors.length > 0) {
      console.error('❌ Data integrity issues found:', errors);
    }
    if (warnings.length > 0) {
      console.warn('⚠️ Data integrity warnings:', warnings);
    }
    
    console.log('✅ Data integrity validation completed');
    return report;
  }, []);

  const cleanupDuplicates = useCallback((transactions: TransactionEntry[]): TransactionEntry[] => {
    console.log('🧹 Starting duplicate cleanup...');
    
    const seen = new Set<string>();
    const cleanTransactions: TransactionEntry[] = [];
    
    transactions.forEach(transaction => {
      const signature = `${transaction.date}-${transaction.type}-${transaction.description}-${transaction.amount}`;
      
      if (!seen.has(signature)) {
        seen.add(signature);
        cleanTransactions.push(transaction);
      } else {
        console.log(`🗑️ Removing duplicate: ${signature}`);
      }
    });
    
    console.log(`✅ Cleanup completed: ${transactions.length} -> ${cleanTransactions.length} transactions`);
    return cleanTransactions;
  }, []);

  const validateFinancialData = useCallback((data: any): boolean => {
    console.log('🔍 Validating financial data structure...');
    
    try {
      if (!data || typeof data !== 'object') {
        console.error('❌ Financial data is not an object');
        return false;
      }
      
      // Check year structure
      Object.keys(data).forEach(yearKey => {
        const year = parseInt(yearKey);
        if (isNaN(year) || year < 2020 || year > 2100) {
          console.warn(`⚠️ Suspicious year: ${yearKey}`);
        }
        
        const yearData = data[yearKey];
        if (!yearData || typeof yearData !== 'object') {
          console.error(`❌ Invalid year data for ${yearKey}`);
          return false;
        }
        
        // Check month structure
        Object.keys(yearData).forEach(monthKey => {
          const month = parseInt(monthKey);
          if (isNaN(month) || month < 0 || month > 11) {
            console.error(`❌ Invalid month: ${monthKey} in year ${yearKey}`);
            return false;
          }
          
          const monthData = yearData[monthKey];
          if (!monthData || typeof monthData !== 'object') {
            console.error(`❌ Invalid month data for ${yearKey}-${monthKey}`);
            return false;
          }
          
          // Check day structure
          Object.keys(monthData).forEach(dayKey => {
            const day = parseInt(dayKey);
            if (isNaN(day) || day < 1 || day > 31) {
              console.error(`❌ Invalid day: ${dayKey} in ${yearKey}-${monthKey}`);
              return false;
            }
            
            const dayData = monthData[dayKey];
            if (!dayData || typeof dayData !== 'object') {
              console.error(`❌ Invalid day data for ${yearKey}-${monthKey}-${dayKey}`);
              return false;
            }
            
            // Validate required fields
            const requiredFields = ['entrada', 'saida', 'diario', 'balance'];
            requiredFields.forEach(field => {
              if (!(field in dayData)) {
                console.error(`❌ Missing field ${field} in ${yearKey}-${monthKey}-${dayKey}`);
                return false;
              }
            });
          });
        });
      });
      
      console.log('✅ Financial data structure validation passed');
      return true;
      
    } catch (error) {
      console.error('❌ Error validating financial data:', error);
      return false;
    }
  }, []);

  return {
    validateTransactions,
    cleanupDuplicates,
    validateFinancialData,
    getLastReport: () => lastReportRef.current
  };
};
