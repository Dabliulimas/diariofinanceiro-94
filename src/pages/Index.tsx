import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSyncedFinancialData } from '../hooks/useSyncedFinancialData';
import { useReserveAndExpenses } from '../hooks/useReserveAndExpenses';
import { useRecurringTransactions } from '../hooks/useRecurringTransactions';
import { useRecurringProcessor } from '../hooks/useRecurringProcessor';
import { useDataCleanup } from '../hooks/useDataCleanup';
import SummaryCard from '../components/SummaryCard';
import SmartAlerts from '../components/SmartAlerts';
import EmergencyReserveModal from '../components/EmergencyReserveModal';
import FixedExpensesModal from '../components/FixedExpensesModal';
import RecurringTransactionsModal from '../components/RecurringTransactionsModal';
import MonthNavigation from '../components/MonthNavigation';
import FinancialTable from '../components/FinancialTable';
import { Button } from '../components/ui/button';
import { Zap } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  
  const {
    data,
    selectedYear,
    selectedMonth,
    setSelectedYear,
    setSelectedMonth,
    updateDayData,
    initializeMonth,
    getMonthlyTotals,
    getYearlyTotals,
    getDaysInMonth,
    formatCurrency,
    recalculateBalances,
    getTransactionsByDate,
    addTransactionAndSync,
    updateTransactionAndSync,
    deleteTransactionAndSync,
    forceRecalculation,
    transactions,
    rebuildFinancialDataFromTransactions
  } = useSyncedFinancialData();

  const {
    emergencyReserve,
    fixedExpenses,
    updateEmergencyReserve,
    updateFixedExpenses
  } = useReserveAndExpenses();

  const {
    recurringTransactions,
    addRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    getActiveRecurringTransactions
  } = useRecurringTransactions();

  const { processRecurringTransactions } = useRecurringProcessor();
  
  const { clearAllData, clearTransactionsOnly } = useDataCleanup();

  const [inputValues, setInputValues] = useState<{[key: string]: string}>({});
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [showExpensesModal, setShowExpensesModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);

  // CONTROLE SUPER RIGOROSO: Uma única execução por período
  const processedPeriodsRef = useRef<Set<string>>(new Set());
  const isProcessingRef = useRef<boolean>(false);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize month when year/month changes
  useEffect(() => {
    initializeMonth(selectedYear, selectedMonth);
    setInputValues({});
  }, [selectedYear, selectedMonth, initializeMonth]);

  // Process recurring transactions - COM CONTROLE ABSOLUTO
  useEffect(() => {
    const periodKey = `${selectedYear}-${selectedMonth}`;
    
    // Multiple checks to prevent duplicate processing
    if (processedPeriodsRef.current.has(periodKey)) {
      console.log(`✅ Period ${periodKey} already processed - SKIPPING`);
      return;
    }

    if (isProcessingRef.current) {
      console.log(`⏳ Already processing another period - SKIPPING ${periodKey}`);
      return;
    }

    const activeTransactions = getActiveRecurringTransactions();
    if (activeTransactions.length === 0) {
      console.log(`⏭️ No active recurring transactions for ${periodKey}`);
      processedPeriodsRef.current.add(periodKey);
      return;
    }

    console.log(`🔄 Processing recurring transactions for ${periodKey} - SINGLE EXECUTION GUARANTEED`);
    
    // Mark as processed BEFORE processing to prevent race conditions
    processedPeriodsRef.current.add(periodKey);
    isProcessingRef.current = true;
    
    // Clear any existing timeout
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }
    
    // Use longer timeout for stability
    processingTimeoutRef.current = setTimeout(() => {
      try {
        processRecurringTransactions(
          activeTransactions,
          selectedYear,
          selectedMonth,
          addTransactionAndSync,
          updateRecurringTransaction,
          transactions
        );
        
        console.log(`✅ Recurring transactions processed for ${periodKey}`);
      } catch (error) {
        console.error('❌ Error processing recurring transactions:', error);
        // Remove from processed set if there was an error
        processedPeriodsRef.current.delete(periodKey);
      } finally {
        isProcessingRef.current = false;
        processingTimeoutRef.current = null;
      }
    }, 800); // Increased timeout for stability

    // Cleanup function
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
        processingTimeoutRef.current = null;
      }
      isProcessingRef.current = false;
    };
  }, [selectedYear, selectedMonth, getActiveRecurringTransactions, processRecurringTransactions, addTransactionAndSync, updateRecurringTransaction, transactions]);

  // Clear processed periods when recurring transactions change significantly
  useEffect(() => {
    const activeCount = getActiveRecurringTransactions().length;
    console.log(`🔄 Active recurring transactions count changed: ${activeCount}`);
    
    // Only clear if there's a significant change
    if (activeCount === 0) {
      console.log('🧹 No active recurring transactions - clearing processed periods');
      processedPeriodsRef.current.clear();
      isProcessingRef.current = false;
    }
  }, [getActiveRecurringTransactions().length]);

  useEffect(() => {
    document.title = 'Diário Financeiro - Alertas Inteligentes';
  }, []);

  // Calculate totals
  const yearlyTotals = getYearlyTotals(selectedYear);  
  const monthlyTotals = getMonthlyTotals(selectedYear, selectedMonth);
  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);

  // Generate years array - 50 anos a partir de 2025
  const currentYear = new Date().getFullYear();
  const startYear = Math.max(2025, currentYear);
  const years = Array.from({ length: 50 }, (_, i) => startYear + i);

  // Input handling helpers
  const getInputKey = (day: number, field: string) => `${selectedYear}-${selectedMonth}-${day}-${field}`;

  const handleInputChange = (day: number, field: 'entrada' | 'saida' | 'diario', value: string) => {
    const key = getInputKey(day, field);
    setInputValues(prev => ({ ...prev, [key]: value }));
  };

  const handleInputBlur = (day: number, field: 'entrada' | 'saida' | 'diario', value: string) => {
    updateDayData(selectedYear, selectedMonth, day, field, value);
    
    const key = getInputKey(day, field);
    setInputValues(prev => {
      const newValues = { ...prev };
      delete newValues[key];
      return newValues;
    });
  };

  // Enhanced recurring transaction handlers
  const handleUpdateRecurringTransaction = (id: string, updates: any) => {
    console.log('🔄 Updating recurring transaction');
    updateRecurringTransaction(id, updates);
    processedPeriodsRef.current.clear();
    
    setTimeout(() => {
      rebuildFinancialDataFromTransactions();
    }, 300);
  };

  const handleDeleteRecurringTransaction = (id: string) => {
    console.log('🗑️ Deleting recurring transaction');
    deleteRecurringTransaction(id);
    processedPeriodsRef.current.clear();
    
    setTimeout(() => {
      rebuildFinancialDataFromTransactions();
    }, 300);
  };

  const handleAddRecurringTransaction = (transaction: any) => {
    console.log('➕ Adding recurring transaction');
    addRecurringTransaction(transaction);
    processedPeriodsRef.current.clear();
    
    setTimeout(() => {
      rebuildFinancialDataFromTransactions();
    }, 300);
  };

  // Calculate total recurring amount
  const totalRecurringAmount = getActiveRecurringTransactions().reduce((sum, t) => {
    return sum + (t.type === 'entrada' ? t.amount : -t.amount);
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50 py-2 sm:py-4 md:py-8">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        {/* Header with cleanup buttons */}
        <div className="text-center mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
            Diário Financeiro
          </h1>
          <p className="text-sm sm:text-lg md:text-xl text-gray-600">Alertas Inteligentes</p>
          
          {/* Data cleanup controls */}
          <div className="flex justify-center gap-2 mt-4">
            <button
              onClick={clearTransactionsOnly}
              className="px-3 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600"
            >
              🧹 Limpar Transações
            </button>
            <button
              onClick={clearAllData}
              className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
            >
              🗑️ Limpar Tudo
            </button>
          </div>
        </div>

        {/* Year Selector */}
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-center sm:items-center sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full sm:w-auto bg-white border-2 border-green-500 rounded-lg px-3 sm:px-4 py-2 pr-8 sm:pr-10 text-sm sm:text-base md:text-lg font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="flex justify-center mb-4 sm:mb-6">
          <Button
            onClick={() => navigate('/quick-entry')}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold px-6 py-3 text-sm sm:text-base flex items-center gap-2 shadow-lg"
          >
            <Zap className="w-5 h-5" />
            Lançamento Rápido
          </Button>
        </div>

        {/* Control Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <Button
            onClick={() => setShowReserveModal(true)}
            variant="outline"
            className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50 text-xs sm:text-sm px-2 sm:px-4 py-2 w-full sm:w-auto"
          >
            <span className="flex items-center justify-center">
              <span className="mr-1">🛡️</span>
              <span className="hidden xs:inline">Reserva: </span> 
              <span className="font-medium">{formatCurrency(emergencyReserve.amount)}</span>
            </span>
          </Button>
          
          <Button
            onClick={() => setShowExpensesModal(true)}
            variant="outline"
            className="border-2 border-purple-500 text-purple-600 hover:bg-purple-50 text-xs sm:text-sm px-2 sm:px-4 py-2 w-full sm:w-auto"
          >
            <span className="flex items-center justify-center">
              <span className="mr-1">📊</span>
              <span className="hidden xs:inline">Gastos: </span> 
              <span className="font-medium">{formatCurrency(fixedExpenses.totalAmount)}</span>
            </span>
          </Button>

          <Button
            onClick={() => setShowRecurringModal(true)}
            variant="outline"
            className="border-2 border-orange-500 text-orange-600 hover:bg-orange-50 text-xs sm:text-sm px-2 sm:px-4 py-2 w-full sm:w-auto"
          >
            <span className="flex items-center justify-center">
              <span className="mr-1">🔄</span>
              <span className="hidden xs:inline">Recorrentes: </span>
              <span className={`font-medium ${totalRecurringAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(totalRecurringAmount)}
              </span>
            </span>
          </Button>
        </div>

        {/* Smart Alerts */}
        <SmartAlerts
          data={data}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          monthlyTotals={monthlyTotals}
        />

        {/* Yearly Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-6 mb-4 sm:mb-6 md:mb-8">
          <SummaryCard
            title={`Entradas ${selectedYear}`}
            value={yearlyTotals.totalEntradas}
            icon="📈"
            color="green"
          />
          <SummaryCard
            title={`Saídas ${selectedYear}`}
            value={yearlyTotals.totalSaidas}
            icon="📉"
            color="red"
          />
          <SummaryCard
            title={`Diário ${selectedYear}`}
            value={yearlyTotals.totalDiario}
            icon="💰"
            color="blue"
          />
          <SummaryCard
            title={`Saldo Final ${selectedYear}`}
            value={yearlyTotals.saldoFinal}
            icon="🏆"
            color="purple"
          />
        </div>

        <MonthNavigation
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
        />

        {/* Monthly Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-6 mb-4 sm:mb-6 md:mb-8">
          <SummaryCard
            title="Total Entradas"
            value={monthlyTotals.totalEntradas}
            icon="📈"
            color="green"
          />
          <SummaryCard
            title="Total Saídas"
            value={monthlyTotals.totalSaidas}
            icon="📉"
            color="red"
          />
          <SummaryCard
            title="Total Diário"
            value={monthlyTotals.totalDiario}
            icon="💰"
            color="blue"
          />
          <SummaryCard
            title="Saldo Final"
            value={monthlyTotals.saldoFinal}
            icon="🏆"
            color="purple"
          />
        </div>

        <FinancialTable
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          data={data}
          daysInMonth={daysInMonth}
          inputValues={inputValues}
          onInputChange={handleInputChange}
          onInputBlur={handleInputBlur}
          getTransactionsByDate={getTransactionsByDate}
          updateTransactionAndSync={updateTransactionAndSync}
          deleteTransactionAndSync={deleteTransactionAndSync}
        />

        {/* Modals */}
        <EmergencyReserveModal
          isOpen={showReserveModal}
          onClose={() => setShowReserveModal(false)}
          onSave={updateEmergencyReserve}
          currentAmount={emergencyReserve.amount}
          currentMonths={emergencyReserve.months}
          fixedExpensesTotal={fixedExpenses.totalAmount}
        />

        <FixedExpensesModal
          isOpen={showExpensesModal}
          onClose={() => setShowExpensesModal(false)}
          onSave={updateFixedExpenses}
          currentCategories={fixedExpenses.categories}
        />

        <RecurringTransactionsModal
          isOpen={showRecurringModal}
          onClose={() => setShowRecurringModal(false)}
          onSave={handleAddRecurringTransaction}
          onUpdate={handleUpdateRecurringTransaction}
          onDelete={handleDeleteRecurringTransaction}
          currentTransactions={recurringTransactions}
        />
      </div>
    </div>
  );
};

export default Index;
