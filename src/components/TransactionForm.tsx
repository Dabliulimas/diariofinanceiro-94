
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransactionFormProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  transactionType: 'entrada' | 'saida' | 'diario';
  setTransactionType: (type: 'entrada' | 'saida' | 'diario') => void;
  amount: string;
  setAmount: (amount: string) => void;
  description: string;
  setDescription: (description: string) => void;
  editingTransaction: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  selectedDate,
  setSelectedDate,
  transactionType,
  setTransactionType,
  amount,
  setAmount,
  description,
  setDescription,
  editingTransaction,
  onSubmit,
  onCancel
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          {editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Date Picker */}
          <div className="space-y-2">
            <Label>Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Transaction Type */}
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Tabs value={transactionType} onValueChange={(value) => setTransactionType(value as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="entrada" className="text-green-600">Entrada</TabsTrigger>
                <TabsTrigger value="saida" className="text-red-600">Saída</TabsTrigger>
                <TabsTrigger value="diario" className="text-blue-600">Diário</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Valor</Label>
            <Input
              id="amount"
              type="text"
              value={amount}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d*[,.]?\d*$/.test(value)) {
                  setAmount(value);
                }
              }}
              placeholder="0,00"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Almoço, Gasolina, Salário..."
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              {editingTransaction ? 'Atualizar' : 'Adicionar'}
            </Button>
            {editingTransaction && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default TransactionForm;
