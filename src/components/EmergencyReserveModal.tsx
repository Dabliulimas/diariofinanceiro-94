
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { FluidNumberInput } from './FluidNumberInput';

interface EmergencyReserveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (amount: number, months: 6 | 12) => void;
  currentAmount: number;
  currentMonths: 6 | 12;
  fixedExpensesTotal: number;
}

const EmergencyReserveModal: React.FC<EmergencyReserveModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentAmount,
  currentMonths,
  fixedExpensesTotal
}) => {
  const [amount, setAmount] = useState("");
  const [months, setMonths] = useState<6 | 12>(6);

  useEffect(() => {
    if (isOpen) {
      setAmount(currentAmount.toString());
      setMonths(currentMonths);
    }
  }, [isOpen, currentAmount, currentMonths]);

  const handleSave = () => {
    const numericAmount = parseFloat(amount) || 0;
    onSave(numericAmount, months);
    onClose();
  };

  const recommendedAmount = fixedExpensesTotal * months;
  const coverageMonths = fixedExpensesTotal > 0 ? (parseFloat(amount) || 0) / fixedExpensesTotal : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Reserva de Emergência</h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor Atual (R$)
            </label>
            <FluidNumberInput
              value={amount}
              onChange={setAmount}
              onBlur={() => {}}
              placeholder="0,00"
              color="blue"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Meta de Reserva
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  value="6"
                  checked={months === 6}
                  onChange={() => setMonths(6)}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="text-sm">6 meses de gastos fixos</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  value="12"
                  checked={months === 12}
                  onChange={() => setMonths(12)}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="text-sm">12 meses de gastos fixos</span>
              </label>
            </div>
          </div>

          {fixedExpensesTotal > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Meta recomendada:</span>
                <span className="font-medium">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(recommendedAmount)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Cobertura atual:</span>
                <span className="font-medium">
                  {coverageMonths.toFixed(1)} meses
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50 flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmergencyReserveModal;
