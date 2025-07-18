
import React, { useState } from 'react';
import { Button } from './ui/button';
import { useSyncedFinancialData } from '../hooks/useSyncedFinancialData';
import { useRecurringTransactions } from '../hooks/useRecurringTransactions';

const FinancialTestingPanel = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const { addTransactionAndSync, transactions } = useSyncedFinancialData();
  const { addRecurringTransaction } = useRecurringTransactions();

  const runTests = () => {
    const results: string[] = [];
    
    // Test 1: Add duplicate transactions
    console.log('🧪 Test 1: Adding duplicate transactions');
    const testTransaction = {
      type: 'entrada' as const,
      amount: 1000,
      description: 'Teste de duplicação',
      date: '2025-01-15'
    };
    
    // Add same transaction multiple times
    addTransactionAndSync(testTransaction);
    addTransactionAndSync(testTransaction);
    addTransactionAndSync(testTransaction);
    
    // Check if only one was added
    const duplicates = transactions.filter(t => 
      t.description === 'Teste de duplicação' && t.date === '2025-01-15'
    );
    
    if (duplicates.length === 1) {
      results.push('✅ Test 1 PASSED: Duplicate prevention working');
    } else {
      results.push(`❌ Test 1 FAILED: Found ${duplicates.length} duplicates`);
    }
    
    // Test 2: Add recurring transaction
    console.log('🧪 Test 2: Adding recurring transaction');
    addRecurringTransaction({
      type: 'saida',
      amount: 500,
      description: 'Teste Recorrente',
      dayOfMonth: 15,
      frequency: 'fixed-count',
      remainingCount: 2,
      isActive: true
    });
    
    results.push('✅ Test 2: Recurring transaction added');
    
    setTestResults(results);
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
      <h3 className="text-lg font-semibold mb-3">🧪 Financial Logic Testing</h3>
      
      <Button onClick={runTests} className="mb-3">
        Run Tests
      </Button>
      
      {testResults.length > 0 && (
        <div className="space-y-1">
          {testResults.map((result, index) => (
            <div key={index} className="text-sm">
              {result}
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-3 text-xs text-gray-600">
        <p>Total transactions: {transactions.length}</p>
      </div>
    </div>
  );
};

export default FinancialTestingPanel;
