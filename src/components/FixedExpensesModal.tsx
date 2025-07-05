
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { FluidNumberInput } from './FluidNumberInput';
import { Trash2, Plus } from 'lucide-react';

interface FixedExpenseCategory {
  id: string;
  name: string;
  amount: number;
}

interface FixedExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (categories: FixedExpenseCategory[]) => void;
  currentCategories: FixedExpenseCategory[];
}

const defaultCategories = [
  'Alimentação',
  'Moradia',
  'Transporte',
  'Saúde',
  'Educação',
  'Lazer',
  'Seguros',
  'Telecomunicações',
  'Outros'
];

const FixedExpensesModal: React.FC<FixedExpensesModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentCategories
}) => {
  const [categories, setCategories] = useState<FixedExpenseCategory[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (currentCategories.length > 0) {
        setCategories([...currentCategories]);
      } else {
        // Initialize with default categories
        setCategories(defaultCategories.map(name => ({
          id: Math.random().toString(36).substr(2, 9),
          name,
          amount: 0
        })));
      }
    }
  }, [isOpen, currentCategories]);

  const addCategory = () => {
    const newCategory: FixedExpenseCategory = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      amount: 0
    };
    setCategories([...categories, newCategory]);
  };

  const removeCategory = (id: string) => {
    setCategories(categories.filter(cat => cat.id !== id));
  };

  const updateCategory = (id: string, field: 'name' | 'amount', value: string | number) => {
    setCategories(categories.map(cat => 
      cat.id === id 
        ? { ...cat, [field]: field === 'amount' ? parseFloat(value.toString()) || 0 : value }
        : cat
    ));
  };

  const handleSave = () => {
    const validCategories = categories.filter(cat => cat.name.trim() !== '' && cat.amount > 0);
    onSave(validCategories);
    onClose();
  };

  const totalAmount = categories.reduce((sum, cat) => sum + cat.amount, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Gastos Fixos por Categoria</h2>
          <p className="text-gray-600 mt-1">Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAmount)}</p>
        </div>
        
        <div className="p-6 max-h-96 overflow-y-auto space-y-4">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <input
                  type="text"
                  value={category.name}
                  onChange={(e) => updateCategory(category.id, 'name', e.target.value)}
                  placeholder="Nome da categoria"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div className="w-32">
                <FluidNumberInput
                  value={category.amount.toString()}
                  onChange={(value) => updateCategory(category.id, 'amount', value)}
                  onBlur={() => {}}
                  placeholder="0,00"
                  color="blue"
                  className="w-full text-sm"
                />
              </div>
              <Button
                onClick={() => removeCategory(category.id)}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          <Button
            onClick={addCategory}
            variant="outline"
            className="w-full border-dashed border-2 border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Categoria
          </Button>
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
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FixedExpensesModal;
