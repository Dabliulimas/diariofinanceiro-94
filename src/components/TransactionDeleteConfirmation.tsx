
import React from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { TransactionEntry } from '../hooks/useTransactions';
import { formatCurrency } from '../utils/currencyUtils';

interface TransactionDeleteConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  transactionToDelete: TransactionEntry;
  allTransactionsForDate: TransactionEntry[];
}

const TransactionDeleteConfirmation: React.FC<TransactionDeleteConfirmationProps> = ({
  isOpen,
  onClose,
  onConfirm,
  transactionToDelete,
  allTransactionsForDate
}) => {
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'entrada': return 'Entrada';
      case 'saida': return 'Saída';
      case 'diario': return 'Diário';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'entrada': return 'text-green-600';
      case 'saida': return 'text-red-600';
      case 'diario': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-red-600">
            ⚠️ Confirmar Exclusão de Lançamento
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">
              Atenção: Múltiplos lançamentos encontrados
            </h3>
            <p className="text-yellow-700">
              Há {allTransactionsForDate.length} lançamentos na data {formatDate(transactionToDelete.date)}
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-800 mb-2">
              Lançamento que será excluído:
            </h3>
            <div className="bg-white rounded p-3 border">
              <div className="flex items-center justify-between">
                <div>
                  <span className={`font-medium ${getTypeColor(transactionToDelete.type)}`}>
                    {getTypeLabel(transactionToDelete.type)}
                  </span>
                  <span className="mx-2">•</span>
                  <span className="font-semibold">
                    {formatCurrency(transactionToDelete.amount)}
                  </span>
                </div>
              </div>
              {transactionToDelete.description && (
                <p className="text-sm text-gray-600 mt-1">
                  {transactionToDelete.description}
                </p>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">
              Outros lançamentos na mesma data (não serão afetados):
            </h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {allTransactionsForDate
                .filter(t => t.id !== transactionToDelete.id)
                .map((transaction) => (
                  <div key={transaction.id} className="bg-white rounded p-2 border">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className={`font-medium ${getTypeColor(transaction.type)}`}>
                          {getTypeLabel(transaction.type)}
                        </span>
                        <span className="mx-2">•</span>
                        <span className="font-semibold">
                          {formatCurrency(transaction.amount)}
                        </span>
                      </div>
                    </div>
                    {transaction.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {transaction.description}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Confirmar Exclusão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDeleteConfirmation;
