
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useForm } from 'react-hook-form';
import { RecurringTransaction } from '../hooks/useRecurringTransactions';
import { formatCurrency, parseCurrency } from '../utils/currencyUtils';
import { Trash2, Plus, Edit } from 'lucide-react';

interface RecurringTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<RecurringTransaction, 'id' | 'createdAt' | 'startDate'>) => void;
  onUpdate: (id: string, updates: Partial<RecurringTransaction>) => void;
  onDelete: (id: string) => void;
  currentTransactions: RecurringTransaction[];
}

interface FormData {
  type: 'entrada' | 'saida';
  amount: string;
  description: string;
  dayOfMonth: string;
  frequency: 'until-cancelled' | 'fixed-count' | 'monthly-duration';
  remainingCount: string;
  monthsDuration: string;
}

const RecurringTransactionsModal: React.FC<RecurringTransactionsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  onDelete,
  currentTransactions
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<RecurringTransaction | null>(null);

  const form = useForm<FormData>({
    defaultValues: {
      type: 'saida',
      amount: 'R$ 0,00',
      description: '',
      dayOfMonth: '1',
      frequency: 'until-cancelled',
      remainingCount: '1',
      monthsDuration: '12'
    }
  });

  const startEdit = (transaction: RecurringTransaction) => {
    setEditingTransaction(transaction);
    form.reset({
      type: transaction.type,
      amount: formatCurrency(transaction.amount),
      description: transaction.description,
      dayOfMonth: transaction.dayOfMonth.toString(),
      frequency: transaction.frequency,
      remainingCount: transaction.remainingCount?.toString() || '1',
      monthsDuration: transaction.monthsDuration?.toString() || '12'
    });
    setShowForm(true);
  };

  const handleSubmit = (data: FormData) => {
    const transactionData = {
      type: data.type,
      amount: parseCurrency(data.amount),
      description: data.description,
      dayOfMonth: parseInt(data.dayOfMonth),
      frequency: data.frequency,
      remainingCount: data.frequency === 'fixed-count' ? parseInt(data.remainingCount) : undefined,
      monthsDuration: data.frequency === 'monthly-duration' ? parseInt(data.monthsDuration) : undefined,
      remainingMonths: data.frequency === 'monthly-duration' ? parseInt(data.monthsDuration) : undefined,
      isActive: true
    };

    if (editingTransaction) {
      onUpdate(editingTransaction.id, transactionData);
    } else {
      onSave(transactionData);
    }
    
    form.reset();
    setShowForm(false);
    setEditingTransaction(null);
  };

  const cancelEdit = () => {
    setShowForm(false);
    setEditingTransaction(null);
    form.reset();
  };

  const handleToggleActive = (id: string, isActive: boolean) => {
    onUpdate(id, { isActive: !isActive });
  };

  const handleAmountChange = (value: string) => {
    const numericValue = parseCurrency(value);
    form.setValue('amount', formatCurrency(numericValue));
  };

  const getFrequencyLabel = (transaction: RecurringTransaction) => {
    switch (transaction.frequency) {
      case 'until-cancelled':
        return 'Até cancelar';
      case 'fixed-count':
        return `${transaction.remainingCount} vezes restantes`;
      case 'monthly-duration':
        return `${transaction.remainingMonths} meses restantes`;
      default:
        return 'Indefinido';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">
            🔄 Lançamentos Recorrentes
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Lista de transações recorrentes */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Transações Cadastradas</h3>
              <Button
                onClick={() => {
                  setEditingTransaction(null);
                  setShowForm(!showForm);
                }}
                className="bg-green-500 hover:bg-green-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Recorrência
              </Button>
            </div>

            {currentTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Nenhuma transação recorrente cadastrada.</p>
                <p className="text-sm mt-2">
                  ⚠️ Evite lançar entradas e saídas incertas ou bônus futuros
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className={`border rounded-lg p-4 ${
                      transaction.isActive ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              transaction.type === 'entrada'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {transaction.type === 'entrada' ? '📈 Entrada' : '📉 Saída'}
                          </span>
                          <span className="font-semibold text-lg">
                            {formatCurrency(transaction.amount)}
                          </span>
                          <span className="text-gray-600">
                            Dia {transaction.dayOfMonth}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-1">{transaction.description}</p>
                        <p className="text-sm text-gray-500">
                          {getFrequencyLabel(transaction)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(transaction)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={transaction.isActive ? "outline" : "default"}
                          size="sm"
                          onClick={() => handleToggleActive(transaction.id, transaction.isActive)}
                        >
                          {transaction.isActive ? 'Pausar' : 'Ativar'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDelete(transaction.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Formulário para nova/editar transação */}
          {showForm && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingTransaction ? 'Editar Transação Recorrente' : 'Nova Transação Recorrente'}
              </h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>Importante:</strong> Cadastre apenas transações certas e regulares. 
                  Evite lançar entradas incertas, bônus futuros ou valores variáveis.
                </p>
              </div>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
                          <FormControl>
                            <select
                              {...field}
                              className="w-full p-2 border border-gray-300 rounded-md"
                            >
                              <option value="saida">📉 Saída</option>
                              <option value="entrada">📈 Entrada</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              onChange={(e) => handleAmountChange(e.target.value)}
                              placeholder="R$ 0,00"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Ex: Aluguel, Salário, Conta de luz..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dayOfMonth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dia do Mês</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="1"
                              max="31"
                              placeholder="1"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="frequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Recorrência</FormLabel>
                          <FormControl>
                            <select
                              {...field}
                              className="w-full p-2 border border-gray-300 rounded-md"
                            >
                              <option value="until-cancelled">Até cancelar</option>
                              <option value="fixed-count">Número fixo de vezes</option>
                              <option value="monthly-duration">Duração em meses</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch('frequency') === 'fixed-count' && (
                      <FormField
                        control={form.control}
                        name="remainingCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantas vezes</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                min="1"
                                placeholder="1"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {form.watch('frequency') === 'monthly-duration' && (
                      <FormField
                        control={form.control}
                        name="monthsDuration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantos meses</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                min="1"
                                placeholder="12"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" className="bg-green-500 hover:bg-green-600">
                      {editingTransaction ? 'Atualizar Recorrência' : 'Salvar Recorrência'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={cancelEdit}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecurringTransactionsModal;
