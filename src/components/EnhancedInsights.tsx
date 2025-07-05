
import React from 'react';
import { Card, CardContent } from './ui/card';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, DollarSign, Target, Shield, Activity } from 'lucide-react';
import { formatCurrency } from '../utils/currencyUtils';

interface EnhancedInsightsProps {
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

const EnhancedInsights: React.FC<EnhancedInsightsProps> = ({
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
  const savingsRate = monthlyTotals.totalEntradas > 0 ? (netFlow / monthlyTotals.totalEntradas) * 100 : 0;
  const expenseRatio = monthlyTotals.totalEntradas > 0 ? ((monthlyTotals.totalSaidas + monthlyTotals.totalDiario) / monthlyTotals.totalEntradas) * 100 : 0;

  const getFlowInsight = () => {
    if (netFlow > 0 && reserveStatus) {
      return {
        icon: <CheckCircle className="w-5 h-5 text-green-500" />,
        text: "Situação excelente! Considere investir o excedente.",
        color: "text-green-700",
        bgColor: "bg-green-50",
        borderColor: "border-green-200"
      };
    } else if (netFlow > 0 && !reserveStatus) {
      return {
        icon: <Target className="w-5 h-5 text-blue-500" />,
        text: "Fluxo positivo! Priorize completar sua reserva de emergência.",
        color: "text-blue-700",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200"
      };
    } else if (netFlow < 0 && reserveStatus) {
      return {
        icon: <TrendingDown className="w-5 h-5 text-orange-500" />,
        text: "Gastos altos, mas reserva protegida. Revise despesas.",
        color: "text-orange-700",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200"
      };
    } else {
      return {
        icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
        text: "Atenção! Gastos altos e reserva insuficiente.",
        color: "text-red-700",
        bgColor: "bg-red-50",
        borderColor: "border-red-200"
      };
    }
  };

  const flowInsight = getFlowInsight();

  return (
    <div className="space-y-4 mb-6">
      {/* Main Insight Card */}
      <Card className={`border-l-4 ${flowInsight.borderColor} ${flowInsight.bgColor}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            {flowInsight.icon}
            <h3 className={`font-semibold ${flowInsight.color}`}>Análise Financeira</h3>
          </div>
          <p className={`text-sm ${flowInsight.color} mb-3`}>
            {flowInsight.text}
          </p>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Fluxo:</span>
              <span className={`font-medium ${netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(netFlow)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Reserva:</span>
              <span className="font-medium text-blue-600">
                {formatCurrency(emergencyReserve.amount)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-600 font-medium">Taxa de Poupança</p>
                <p className="text-lg font-bold text-purple-700">
                  {savingsRate >= 0 ? `+${savingsRate.toFixed(1)}%` : `${savingsRate.toFixed(1)}%`}
                </p>
              </div>
              <Activity className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-indigo-600 font-medium">Gastos vs Renda</p>
                <p className="text-lg font-bold text-indigo-700">
                  {expenseRatio.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedInsights;
