
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'entrada': return '📈';
      case 'saida': return '📉';
      case 'diario': return '💰';
      default: return '📝';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const isRecurringTransaction = (description: string) => {
    // Identificar se é uma transação recorrente baseada na descrição
    const recurringPatterns = [
      'RECORRENTE',
      'MENSAL',
      'SEMANAL',
      'ANUAL',
      'AUTOMÁTICO',
      'FIXO'
    ];
    return recurringPatterns.some(pattern => 
      description.toUpperCase().includes(pattern)
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-red-600 text-xl font-bold">
            ⚠️ Confirmar Exclusão de Lançamento
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Alerta de múltiplos lançamentos */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="font-semibold text-yellow-800 mb-2">
                  Múltiplos lançamentos encontrados
                </h3>
                <p className="text-yellow-700">
                  Há <span className="font-bold">{allTransactionsForDate.length} lançamentos</span> na data{' '}
                  <span className="font-bold">{formatDate(transactionToDelete.date)}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Lançamento que será excluído */}
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-400 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="text-2xl">🗑️</span>
              </div>
              <div className="ml-3 w-full">
                <h3 className="font-semibold text-red-800 mb-3">
                  Lançamento que será EXCLUÍDO:
                </h3>
                <div className="bg-white rounded-lg p-4 border-2 border-red-200 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{getTypeIcon(transactionToDelete.type)}</span>
                        <span className={`font-bold text-sm px-2 py-1 rounded-full bg-opacity-20 ${getTypeColor(transactionToDelete.type)}`}>
                          {getTypeLabel(transactionToDelete.type).toUpperCase()}
                        </span>
                        {isRecurringTransaction(transactionToDelete.description) && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                            🔄 RECORRENTE
                          </span>
                        )}
                      </div>
                      <div className="mb-2">
                        <span className="text-lg font-bold text-gray-900">
                          {formatCurrency(transactionToDelete.amount)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                        <strong>Descrição:</strong> {transactionToDelete.description || 'Sem descrição'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        ID: {transactionToDelete.id}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Outros lançamentos que NÃO serão afetados */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="text-2xl">🛡️</span>
              </div>
              <div className="ml-3 w-full">
                <h3 className="font-semibold text-blue-800 mb-3">
                  Outros lançamentos na mesma data (NÃO serão afetados):
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {allTransactionsForDate
                    .filter(t => t.id !== transactionToDelete.id)
                    .map((transaction) => (
                      <div key={transaction.id} className="bg-white rounded-lg p-3 border border-blue-200 shadow-sm">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm">{getTypeIcon(transaction.type)}</span>
                              <span className={`font-medium text-xs px-2 py-1 rounded-full bg-opacity-20 ${getTypeColor(transaction.type)}`}>
                                {getTypeLabel(transaction.type)}
                              </span>
                              {isRecurringTransaction(transaction.description) && (
                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                                  🔄 RECORRENTE
                                </span>
                              )}
                            </div>
                            <div className="mb-1">
                              <span className="font-bold text-gray-900">
                                {formatCurrency(transaction.amount)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600">
                              {transaction.description || 'Sem descrição'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Aviso final */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-700">
              <span className="text-lg">💡</span>
              <p className="text-sm">
                <strong>Importante:</strong> Apenas o lançamento selecionado será excluído. 
                Os demais lançamentos desta data permanecerão inalterados.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1 border-gray-300 hover:bg-gray-50"
          >
            ❌ Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700"
          >
            🗑️ Confirmar Exclusão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDeleteConfirmation;
