
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSyncedFinancialData } from '../hooks/useSyncedFinancialData';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import TransactionForm from '../components/TransactionForm';
import TransactionsList from '../components/TransactionsList';

const QuickEntry = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const {
    getTransactionsByDate,
    addTransactionAndSync,
    updateTransactionAndSync,
    deleteTransactionAndSync
  } = useSyncedFinancialData();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [transactionType, setTransactionType] = useState<'entrada' | 'saida' | 'diario'>('entrada');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);

  // Initialize date from URL params if provided - FIXED date parsing
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      // Parse date correctly to avoid timezone issues
      const [year, month, day] = dateParam.split('-').map(Number);
      const correctDate = new Date(year, month - 1, day); // month - 1 because Date uses 0-based months
      console.log('📅 Setting date from URL param:', dateParam, '→', correctDate);
      setSelectedDate(correctDate);
    }

    // Update document title
    document.title = 'Lançamento Rápido - Diário Financeiro';
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount.replace(',', '.')) <= 0) {
      toast({
        title: "Erro",
        description: "Por favor, insira um valor válido.",
        variant: "destructive"
      });
      return;
    }

    // FIXED: Use correct date formatting to avoid timezone issues
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    const numericAmount = parseFloat(amount.replace(',', '.'));

    console.log('🚀 Submitting transaction with CORRECT date:', { 
      date: dateString, 
      selectedDate: selectedDate,
      type: transactionType, 
      amount: numericAmount, 
      description 
    });

    if (editingTransaction) {
      console.log('✏️ Updating existing transaction:', editingTransaction);
      updateTransactionAndSync(editingTransaction, {
        date: dateString,
        type: transactionType,
        amount: numericAmount,
        description: description.trim()
      });
      toast({
        title: "Sucesso",
        description: "Lançamento atualizado com sucesso!"
      });
      setEditingTransaction(null);
    } else {
      console.log('➕ Adding new transaction');
      addTransactionAndSync({
        date: dateString,
        type: transactionType,
        amount: numericAmount,
        description: description.trim()
      });
      toast({
        title: "Sucesso",
        description: "Lançamento adicionado com sucesso!"
      });
    }

    // Reset form
    setAmount('');
    setDescription('');
  };

  const handleEdit = (transaction: any) => {
    console.log('✏️ Editing transaction with CORRECT date handling:', transaction);
    
    setEditingTransaction(transaction.id);
    
    // FIXED: Parse transaction date correctly
    const [year, month, day] = transaction.date.split('-').map(Number);
    const correctDate = new Date(year, month - 1, day); // month - 1 for 0-based months
    console.log('📅 Edit: Setting date from transaction:', transaction.date, '→', correctDate);
    
    setSelectedDate(correctDate);
    setTransactionType(transaction.type);
    setAmount(transaction.amount.toString().replace('.', ','));
    setDescription(transaction.description);
  };

  const handleDelete = (id: string, transactionDate: string) => {
    console.log('🗑️ Deleting transaction:', id, 'for date:', transactionDate);
    deleteTransactionAndSync(id);
    
    toast({
      title: "Sucesso",
      description: "Lançamento excluído com sucesso!"
    });
  };

  const handleCancel = () => {
    console.log('❌ Canceling edit');
    setEditingTransaction(null);
    setAmount('');
    setDescription('');
  };

  // FIXED: Get transactions using correct date formatting
  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const todayTransactions = getTransactionsByDate(dateString);
  console.log('📋 Transactions for', dateString, ':', todayTransactions.length, 'transactions found');

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lançamento Rápido</h1>
              <p className="text-gray-600">Diário Financeiro - Sincronização Automática</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <TransactionForm
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            transactionType={transactionType}
            setTransactionType={setTransactionType}
            amount={amount}
            setAmount={setAmount}
            description={description}
            setDescription={setDescription}
            editingTransaction={editingTransaction}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />

          {/* Transactions List */}
          <TransactionsList
            selectedDate={selectedDate}
            transactions={todayTransactions}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  );
};

export default QuickEntry;
