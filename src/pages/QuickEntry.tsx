
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

  // Initialize date from URL params if provided
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      setSelectedDate(new Date(dateParam));
    }
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

    const dateString = format(selectedDate, 'yyyy-MM-dd');
    const numericAmount = parseFloat(amount.replace(',', '.'));

    console.log('🚀 Submitting transaction:', { 
      date: dateString, 
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
    console.log('✏️ Editing transaction:', transaction);
    setEditingTransaction(transaction.id);
    setSelectedDate(new Date(transaction.date));
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

  const todayTransactions = getTransactionsByDate(format(selectedDate, 'yyyy-MM-dd'));
  console.log('📋 Transactions for', format(selectedDate, 'yyyy-MM-dd'), ':', todayTransactions.length);

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
              <p className="text-gray-600">Adição rápida com sincronização automática</p>
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
