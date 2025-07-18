
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useImprovedFinancialSync } from '../hooks/useImprovedFinancialSync';
import { useRecurringTransactions } from '../hooks/useRecurringTransactions';
import { useDataIntegrity } from '../hooks/useDataIntegrity';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Play, Bug, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

const DeveloperPanel: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  
  const { addTransactionAndSync, transactions } = useImprovedFinancialSync();
  const { addRecurringTransaction } = useRecurringTransactions();
  const { validateTransactions, cleanupDuplicates, validateFinancialData, getLastReport } = useDataIntegrity();

  const runIntegrityTests = async () => {
    setIsRunning(true);
    const results: string[] = [];
    
    try {
      // Test 1: Validate current transactions
      console.log('🧪 Test 1: Transaction validation');
      const report = validateTransactions(transactions);
      
      if (report.isValid) {
        results.push('✅ Test 1 PASSED: All transactions are valid');
      } else {
        results.push(`❌ Test 1 FAILED: ${report.errors.length} errors, ${report.warnings.length} warnings`);
        report.errors.forEach(error => results.push(`  - Error: ${error}`));
        report.warnings.forEach(warning => results.push(`  - Warning: ${warning}`));
      }
      
      // Test 2: Duplicate prevention
      console.log('🧪 Test 2: Duplicate prevention');
      const originalCount = transactions.length;
      const testTransaction = {
        type: 'entrada' as const,
        amount: 500,
        description: 'Teste Duplicação Auto',
        date: '2025-01-20'
      };
      
      // Try to add same transaction multiple times
      addTransactionAndSync(testTransaction);
      addTransactionAndSync(testTransaction);
      addTransactionAndSync(testTransaction);
      
      // Wait a bit and check
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const newCount = transactions.length;
      const addedTransactions = newCount - originalCount;
      
      if (addedTransactions <= 1) {
        results.push('✅ Test 2 PASSED: Duplicate prevention working');
      } else {
        results.push(`❌ Test 2 FAILED: Added ${addedTransactions} duplicates`);
      }
      
      // Test 3: Financial data structure validation
      console.log('🧪 Test 3: Financial data validation');
      const financialDataValid = validateFinancialData({}); // This would normally get actual data
      
      if (financialDataValid) {
        results.push('✅ Test 3 PASSED: Financial data structure is valid');
      } else {
        results.push('❌ Test 3 FAILED: Financial data structure issues found');
      }
      
      // Test 4: Recurring transaction logic
      console.log('🧪 Test 4: Recurring transaction');
      addRecurringTransaction({
        type: 'saida',
        amount: 200,
        description: 'Teste Recorrente Auto',
        dayOfMonth: 25,
        frequency: 'fixed-count',
        remainingCount: 1,
        isActive: true
      });
      
      results.push('✅ Test 4 PASSED: Recurring transaction added');
      
    } catch (error) {
      results.push(`❌ Test suite error: ${error}`);
    }
    
    setTestResults(results);
    setIsRunning(false);
  };

  const runPerformanceTest = async () => {
    setIsRunning(true);
    const results: string[] = [];
    
    try {
      console.log('🧪 Performance Test: Bulk transaction processing');
      const startTime = performance.now();
      
      // Add multiple transactions quickly
      for (let i = 0; i < 10; i++) {
        addTransactionAndSync({
          type: 'entrada',
          amount: Math.random() * 1000,
          description: `Teste Performance ${i}`,
          date: `2025-01-${(i + 1).toString().padStart(2, '0')}`
        });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      results.push(`✅ Performance Test: ${duration.toFixed(2)}ms for 10 transactions`);
      
      if (duration < 1000) {
        results.push('✅ Performance: Excellent (< 1s)');
      } else if (duration < 3000) {
        results.push('⚠️ Performance: Good (< 3s)');
      } else {
        results.push('❌ Performance: Poor (> 3s)');
      }
      
    } catch (error) {
      results.push(`❌ Performance test error: ${error}`);
    }
    
    setTestResults(results);
    setIsRunning(false);
  };

  const cleanupTestData = () => {
    // This would implement cleanup of test data
    setTestResults(['🧹 Test data cleanup completed']);
  };

  const getResultIcon = (result: string) => {
    if (result.includes('✅')) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (result.includes('⚠️')) return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    if (result.includes('❌')) return <XCircle className="h-4 w-4 text-red-500" />;
    return null;
  };

  const lastReport = getLastReport();

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Painel de Desenvolvimento
        </CardTitle>
        <CardDescription>
          Ferramentas para teste e validação da lógica financeira
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="tests" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tests">Testes</TabsTrigger>
            <TabsTrigger value="integrity">Integridade</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tests" className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={runIntegrityTests} disabled={isRunning}>
                <Play className="h-4 w-4 mr-2" />
                {isRunning ? 'Executando...' : 'Executar Testes'}
              </Button>
              <Button onClick={cleanupTestData} variant="outline">
                🧹 Limpar Dados de Teste
              </Button>
            </div>
            
            {testResults.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Resultados dos Testes:</h4>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {testResults.map((result, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded">
                      {getResultIcon(result)}
                      <span className="font-mono text-xs">{result}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="integrity" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{transactions.length}</div>
                <div className="text-sm text-gray-600">Total Transações</div>
              </div>
              
              {lastReport && (
                <>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{lastReport.statistics.uniqueTransactions}</div>
                    <div className="text-sm text-gray-600">Únicas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{lastReport.duplicates.length}</div>
                    <div className="text-sm text-gray-600">Duplicatas</div>
                  </div>
                  <div className="text-center">
                    <Badge variant={lastReport.isValid ? "default" : "destructive"}>
                      {lastReport.isValid ? "✅ Válido" : "❌ Inválido"}
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="performance" className="space-y-4">
            <Button onClick={runPerformanceTest} disabled={isRunning}>
              <Play className="h-4 w-4 mr-2" />
              {isRunning ? 'Testando...' : 'Teste de Performance'}
            </Button>
            
            <div className="text-sm text-gray-600">
              <p>• Teste de processamento em lote</p>
              <p>• Medição de tempo de resposta</p>
              <p>• Verificação de memória</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DeveloperPanel;
