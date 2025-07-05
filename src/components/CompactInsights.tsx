
import React from 'react';
import { Card, CardContent } from './ui/card';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatCurrency } from '../utils/currencyUtils';

interface CompactInsightsProps {
  monthlyTotals: {
    totalEntradas: number;
    totalSaidas: number;
    totalDiario: number;
    saldoFinal: number;
  };
  selectedMonth: number;
  selectedYear: number;
  emergencyReserve: {
    amount: number;
    months: number;
  };
  fixedExpenses: {
    totalAmount: number;
  };
  recommendedReserve: number;
}

const CompactInsights: React.FC<CompactInsightsProps> = ({
  monthlyTotals,
  emergencyReserve,
  fixedExpenses,
  recommendedReserve
}) => {
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const netFlow = monthlyTotals.totalEntradas - monthlyTotals.totalSaidas - monthlyTotals.totalDiario;
  const reserveStatus = emergencyReserve.amount >= recommendedReserve;

  const getInsight = () => {
    if (netFlow > 0 && reserveStatus) {
      return {
        icon: <CheckCircle className="w-4 h-4 text-green-500" />,
        text: "Mês positivo! Considere investir o excedente.",
        color: "text-green-700"
      };
    } else if (netFlow > 0 && !reserveStatus) {
      return {
        icon: <TrendingUp className="w-4 h-4 text-blue-500" />,
        text: "Bom mês! Priorize completar sua reserva de emergência.",
        color: "text-blue-700"
      };
    } else if (netFlow < 0 && reserveStatus) {
      return {
        icon: <TrendingDown className="w-4 h-4 text-orange-500" />,
        text: "Gastos altos, mas reserva protegida. Revise despesas.",
        color: "text-orange-700"
      };
    } else {
      return {
        icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
        text: "Atenção! Gastos altos e reserva insuficiente.",
        color: "text-red-700"
      };
    }
  };

  const insight = getInsight();

  return (
    <Card className="mb-4 border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {insight.icon}
          <div className="flex-1">
            <p className={`text-sm font-medium ${insight.color}`}>
              {insight.text}
            </p>
            <div className="flex gap-4 mt-2 text-xs text-gray-600">
              <span>Fluxo: {formatCurrency(netFlow)}</span>
              <span>Reserva: {formatCurrency(emergencyReserve.amount)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompactInsights;
