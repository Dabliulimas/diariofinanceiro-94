
import React from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { RecurringTransaction } from '../hooks/useRecurringTransactions';
import { formatCurrency, parseCurrency } from '../utils/currencyUtils';

interface FormData {
  type: 'entrada' | 'saida';
  amount: string;
  description: string;
  dayOfMonth: string;
  frequency: 'until-cancelled' | 'fixed-count' | 'monthly-duration';
  remainingCount: string;
  monthsDuration: string;
}

interface RecurringTransactionFormProps {
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  editingTransaction?: RecurringTransaction | null;
}

const RecurringTransactionForm: React.FC<RecurringTransactionFormProps> = ({
  onSubmit,
  onCancel,
  editingTransaction
}) => {
  const form = useForm<FormData>({
    defaultValues: {
      type: editingTransaction?.type || 'saida',
      amount: editingTransaction ? formatCurrency(editingTransaction.amount) : 'R$ 0,00',
      description: editingTransaction?.description || '',
      dayOfMonth: editingTransaction?.dayOfMonth.toString() || '1',
      frequency: editingTransaction?.frequency || 'until-cancelled',
      remainingCount: editingTransaction?.remainingCount?.toString() || '1',
      monthsDuration: editingTransaction?.monthsDuration?.toString() || '12'
    }
  });

  const handleAmountChange = (value: string) => {
    const numericValue = parseCurrency(value);
    form.setValue('amount', formatCurrency(numericValue));
  };

  return (
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              onClick={onCancel}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default RecurringTransactionForm;
