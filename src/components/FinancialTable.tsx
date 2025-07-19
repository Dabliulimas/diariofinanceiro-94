
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FluidNumberInput } from './FluidNumberInput';
import { FinancialData } from '../hooks/useFinancialData';
import { formatCurrency } from '../utils/currencyUtils';
import { TransactionEntry } from '../hooks/useTransactions';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import TransactionDeleteConfirmation from './TransactionDeleteConfirmation';

interface FinancialTableProps {
  selectedYear: number;
  selectedMonth: number;
  data: FinancialData;
  daysInMonth: number;
  inputValues: {[key: string]: string};
  onInputChange: (day: number, field: 'entrada' | 'saida' | 'diario', value: string) => void;
  onInputBlur: (day: number, field: 'entrada' | 'saida' | 'diario', value: string) => void;
  getTransactionsByDate: (date: string) => TransactionEntry[];
  updateTransactionAndSync: (id: string, updates: Partial<TransactionEntry>) => void;
  deleteTransactionAndSync: (id: string) => void;
}

const FinancialTable: React.FC<FinancialTableProps> = ({
  selectedYear,
  selectedMonth,
  data,
  daysInMonth,
  inputValues,
  onInputChange,
  onInputBlur,
  getTransactionsByDate,
  updateTransactionAndSync,
  deleteTransactionAndSync
}) => {
  const navigate = useNavigate();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<TransactionEntry | null>(null);
  const [allTransactionsForDate, setAllTransactionsForDate] = useState<TransactionEntry[]>([]);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const getInputKey = (day: number, field: string) => `${selectedYear}-${selectedMonth}-${day}-${field}`;

  // Handle day cell click to navigate to quick entry
  const handleDayClick = (day: number) => {
    const date = new Date(selectedYear, selectedMonth, day);
    const dateString = date.toISOString().split('T')[0];
    navigate(`/quick-entry?date=${dateString}`);
  };

  // Handle edit transaction
  const handleEditTransaction = (transaction: TransactionEntry) => {
    const date = new Date(transaction.date);
    const dateString = date.toISOString().split('T')[0];
    navigate(`/quick-entry?date=${dateString}&editId=${transaction.id}`);
  };

  // Handle delete transaction with confirmation
  const handleDeleteTransaction = (transaction: TransactionEntry) => {
    const dateTransactions = getTransactionsByDate(transaction.date);
    
    if (dateTransactions.length > 1) {
      // Múltiplas transações - mostrar confirmação
      setTransactionToDelete(transaction);
      setAllTransactionsForDate(dateTransactions);
      setShowDeleteConfirmation(true);
    } else {
      // Única transação - confirmar simples
      if (window.confirm(`Deseja realmente excluir este lançamento?\n\n${transaction.description}\nR$ ${transaction.amount.toFixed(2).replace('.', ',')}`)) {
        deleteTransactionAndSync(transaction.id);
      }
    }
  };

  // Confirm deletion
  const handleConfirmDeletion = () => {
    if (transactionToDelete) {
      deleteTransactionAndSync(transactionToDelete.id);
      setShowDeleteConfirmation(false);
      setTransactionToDelete(null);
      setAllTransactionsForDate([]);
    }
  };

  // Cancel deletion
  const handleCancelDeletion = () => {
    setShowDeleteConfirmation(false);
    setTransactionToDelete(null);
    setAllTransactionsForDate([]);
  };

  const renderDayRow = (day: number) => {
    const dayData = data[selectedYear]?.[selectedMonth]?.[day] || {
      entrada: "R$ 0,00",
      saida: "R$ 0,00",
      diario: "R$ 0,00",
      balance: 0
    };

    // Check if there are detailed transactions for this day
    const dateString = new Date(selectedYear, selectedMonth, day).toISOString().split('T')[0];
    const dayTransactions = getTransactionsByDate(dateString);
    const hasTransactions = dayTransactions.length > 0;

    return (
      <tr key={day} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
        <td 
          className={`py-2 sm:py-3 px-2 sm:px-4 text-center font-medium text-sm sm:text-base cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition-colors ${
            hasTransactions ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
          }`}
          onClick={() => handleDayClick(day)}
          title="Clique para lançamentos detalhados"
        >
          <div className="flex items-center justify-center gap-1">
            {day}
            {hasTransactions && (
              <div className="flex items-center gap-1">
                <span className="text-xs">📝</span>
                {dayTransactions.length > 1 && (
                  <span className="text-xs bg-blue-100 text-blue-600 px-1 rounded">
                    {dayTransactions.length}
                  </span>
                )}
              </div>
            )}
          </div>
        </td>
        
        <td className="py-2 sm:py-3 px-1 sm:px-4">
          <div className="flex items-center gap-1">
            <FluidNumberInput
              value={inputValues[getInputKey(day, 'entrada')] ?? dayData.entrada}
              onChange={(value) => onInputChange(day, 'entrada', value)}
              onBlur={(value) => onInputBlur(day, 'entrada', value)}
              color="green"
              className="w-full text-xs sm:text-sm"
            />
            {hasTransactions && (
              <div className="flex gap-1">
                {dayTransactions.filter(t => t.type === 'entrada').map(transaction => (
                  <div key={transaction.id} className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-green-100"
                      onClick={() => handleEditTransaction(transaction)}
                      title="Editar lançamento de entrada"
                    >
                      <Edit className="h-3 w-3 text-green-600" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-red-100"
                      onClick={() => handleDeleteTransaction(transaction)}
                      title="Excluir lançamento de entrada"
                    >
                      <Trash2 className="h-3 w-3 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </td>
        
        <td className="py-2 sm:py-3 px-1 sm:px-4">
          <div className="flex items-center gap-1">
            <FluidNumberInput
              value={inputValues[getInputKey(day, 'saida')] ?? dayData.saida}
              onChange={(value) => onInputChange(day, 'saida', value)}
              onBlur={(value) => onInputBlur(day, 'saida', value)}
              color="red"
              className="w-full text-xs sm:text-sm"
            />
            {hasTransactions && (
              <div className="flex gap-1">
                {dayTransactions.filter(t => t.type === 'saida').map(transaction => (
                  <div key={transaction.id} className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-red-100"
                      onClick={() => handleEditTransaction(transaction)}
                      title="Editar lançamento de saída"
                    >
                      <Edit className="h-3 w-3 text-red-600" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-red-100"
                      onClick={() => handleDeleteTransaction(transaction)}
                      title="Excluir lançamento de saída"
                    >
                      <Trash2 className="h-3 w-3 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </td>
        
        <td className="py-2 sm:py-3 px-1 sm:px-4">
          <div className="flex items-center gap-1">
            <FluidNumberInput
              value={inputValues[getInputKey(day, 'diario')] ?? dayData.diario}
              onChange={(value) => onInputChange(day, 'diario', value)}
              onBlur={(value) => onInputBlur(day, 'diario', value)}
              color="blue"
              className="w-full text-xs sm:text-sm"
            />
            {hasTransactions && (
              <div className="flex gap-1">
                {dayTransactions.filter(t => t.type === 'diario').map(transaction => (
                  <div key={transaction.id} className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-blue-100"
                      onClick={() => handleEditTransaction(transaction)}
                      title="Editar lançamento diário"
                    >
                      <Edit className="h-3 w-3 text-blue-600" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-red-100"
                      onClick={() => handleDeleteTransaction(transaction)}
                      title="Excluir lançamento diário"
                    >
                      <Trash2 className="h-3 w-3 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </td>
        
        <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
          <span className={`text-xs sm:text-sm font-medium ${dayData.balance < 0 ? 'text-red-600' : 'text-purple-600'}`}>
            {formatCurrency(dayData.balance)}
          </span>
        </td>
      </tr>
    );
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg mb-4 sm:mb-6 md:mb-8 overflow-hidden">
        <div className="p-3 sm:p-4 md:p-6 border-b border-gray-200">
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
            {monthNames[selectedMonth]} {selectedYear}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            💡 Clique no número do dia para fazer lançamentos detalhados (📝 indica dias com lançamentos, número indica quantidade) | ✏️ Editar | 🗑️ Excluir
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Dia
                </th>
                <th className="py-2 sm:py-3 px-1 sm:px-4 text-left text-xs font-medium text-green-600 uppercase tracking-wider">
                  Entrada
                </th>
                <th className="py-2 sm:py-3 px-1 sm:px-4 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                  Saída
                </th>
                <th className="py-2 sm:py-3 px-1 sm:px-4 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">
                  Diário
                </th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left text-xs font-medium text-purple-600 uppercase tracking-wider">
                  Saldo
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {Array.from({ length: daysInMonth }, (_, i) => renderDayRow(i + 1))}
            </tbody>
          </table>
        </div>
      </div>

      {transactionToDelete && (
        <TransactionDeleteConfirmation
          isOpen={showDeleteConfirmation}
          onClose={handleCancelDeletion}
          onConfirm={handleConfirmDeletion}
          transactionToDelete={transactionToDelete}
          allTransactionsForDate={allTransactionsForDate}
        />
      )}
    </>
  );
};

export default FinancialTable;
