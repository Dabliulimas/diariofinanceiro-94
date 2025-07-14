
import React from 'react';
import { Button } from './ui/button';
import { RecurringTransaction } from '../hooks/useRecurringTransactions';
import { formatCurrency } from '../utils/currencyUtils';
import { Trash2, Edit, Plus } from 'lucide-react';

interface RecurringTransactionsListProps {
  transactions: RecurringTransaction[];
  onEdit: (transaction: RecurringTransaction) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
}

const RecurringTransactionsList: React.FC<RecurringTransactionsListProps> = ({
  transactions,
  onEdit,
  onToggleActive,
  onDelete,
  onAddNew
}) => {
  const getFrequencyLabel = (transaction: RecurringTransaction) => {
    switch (transaction.frequency) {
      case 'until-cancelled':
        return 'Até cancelar';
      case 'fixed-count':
        return `${transaction.remainingCount || 0} vezes restantes`;
      case 'monthly-duration':
        return `${transaction.remainingMonths || 0} meses restantes`;
      default:
        return 'Indefinido';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Transações Cadastradas</h3>
        <Button
          onClick={onAddNew}
          className="bg-green-500 hover:bg-green-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Recorrência
        </Button>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Nenhuma transação recorrente cadastrada.</p>
          <p className="text-sm mt-2">
            ⚠️ Evite lançar entradas e saídas incertas ou bônus futuros
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((transaction) => (
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
                    onClick={() => onEdit(transaction)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={transaction.isActive ? "outline" : "default"}
                    size="sm"
                    onClick={() => onToggleActive(transaction.id, transaction.isActive)}
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
  );
};

export default RecurringTransactionsList;
