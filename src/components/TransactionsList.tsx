
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { formatCurrency } from '../utils/currencyUtils';
import { TransactionEntry } from '../hooks/useTransactions';

interface TransactionsListProps {
  selectedDate: Date;
  transactions: TransactionEntry[];
  onEdit: (transaction: TransactionEntry) => void;
  onDelete: (id: string, transactionDate: string) => void;
}

const TransactionsList: React.FC<TransactionsListProps> = ({
  selectedDate,
  transactions,
  onEdit,
  onDelete
}) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'entrada': return 'text-green-600 bg-green-50';
      case 'saida': return 'text-red-600 bg-red-50';
      case 'diario': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'entrada': return 'Entrada';
      case 'saida': return 'Saída';
      case 'diario': return 'Diário';
      default: return type;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Lançamentos de {format(selectedDate, "dd/MM/yyyy")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Nenhum lançamento para esta data
          </p>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getTypeColor(transaction.type))}>
                      {getTypeLabel(transaction.type)}
                    </span>
                    <span className="font-medium">{formatCurrency(transaction.amount)}</span>
                  </div>
                  {transaction.description && (
                    <p className="text-sm text-gray-600">{transaction.description}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(transaction)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(transaction.id, transaction.date)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionsList;
