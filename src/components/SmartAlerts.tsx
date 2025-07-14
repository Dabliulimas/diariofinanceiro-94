
import React, { useMemo } from 'react';
import { FinancialData } from '../hooks/useFinancialData';
import { MonthlyTotals } from './insights/InsightAnalyzer';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertTriangle, TrendingUp, TrendingDown, CheckCircle, Info } from 'lucide-react';

interface SmartAlertsProps {
  data: FinancialData;
  selectedYear: number;
  selectedMonth: number;
  monthlyTotals: MonthlyTotals;
}

const SmartAlerts: React.FC<SmartAlertsProps> = ({
  data,
  selectedYear,
  selectedMonth,
  monthlyTotals
}) => {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const parseCurrency = (value: string): number => {
    if (!value) return 0;
    return parseFloat(value.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
  };

  const alerts = useMemo(() => {
    const currentDate = new Date();
    const isCurrentMonth = selectedYear === currentDate.getFullYear() && selectedMonth === currentDate.getMonth();
    const currentDay = currentDate.getDate();
    const monthData = data[selectedYear]?.[selectedMonth];
    
    if (!monthData) return [];

    const alertsList = [];
    const totalExpenses = monthlyTotals.totalSaidas + monthlyTotals.totalDiario;
    const totalIncome = monthlyTotals.totalEntradas;

    // Encontrar o primeiro dia com saldo negativo
    const findNegativeBalanceDay = () => {
      const days = Object.keys(monthData).map(Number).sort((a, b) => a - b);
      for (const day of days) {
        const dayData = monthData[day];
        if (dayData.balance < 0) {
          return day;
        }
      }
      return null;
    };

    // Alerta de saldo negativo com dia específico
    if (monthlyTotals.saldoFinal < 0) {
      const negativeDay = findNegativeBalanceDay();
      const dayMessage = negativeDay 
        ? ` O saldo ficou negativo no dia ${negativeDay}.`
        : '';
      
      alertsList.push({
        type: 'destructive',
        icon: AlertTriangle,
        title: 'Saldo Negativo',
        message: `Seu saldo está negativo em ${formatCurrency(Math.abs(monthlyTotals.saldoFinal))}.${dayMessage} Revise seus gastos urgentemente.`
      });
    }

    // Previsão de saldo negativo para mês atual
    if (isCurrentMonth && monthlyTotals.saldoFinal >= 0) {
      const days = Object.keys(monthData).map(Number).sort((a, b) => a - b);
      let runningBalance = 0;
      let predictedNegativeDay = null;

      // Calcular média de gastos dos últimos dias para projeção
      const recentDays = days.filter(day => day <= currentDay && day > 0);
      if (recentDays.length >= 3) {
        const recentExpenses = recentDays.map(day => {
          const dayData = monthData[day];
          return parseCurrency(dayData.saida) + parseCurrency(dayData.diario);
        });
        
        const avgDailyExpense = recentExpenses.reduce((sum, exp) => sum + exp, 0) / recentExpenses.length;
        
        // Recalcular saldo atual
        for (const day of days) {
          if (day <= currentDay) {
            const dayData = monthData[day];
            runningBalance = dayData.balance;
          }
        }

        // Projetar próximos dias
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        for (let futureDay = currentDay + 1; futureDay <= daysInMonth; futureDay++) {
          runningBalance -= avgDailyExpense;
          if (runningBalance < 0 && !predictedNegativeDay) {
            predictedNegativeDay = futureDay;
            break;
          }
        }

        if (predictedNegativeDay && avgDailyExpense > 0) {
          alertsList.push({
            type: 'default',
            icon: AlertTriangle,
            title: 'Risco de Saldo Negativo',
            message: `Com base nos seus gastos atuais (média de ${formatCurrency(avgDailyExpense)}/dia), seu saldo pode ficar negativo no dia ${predictedNegativeDay}. Monitore seus gastos.`
          });
        }
      }
    }

    // Alerta de gastos altos em relação à renda
    if (totalIncome > 0 && totalExpenses > 0) {
      const expenseRatio = (totalExpenses / totalIncome) * 100;
      
      if (expenseRatio > 90) {
        alertsList.push({
          type: 'destructive',
          icon: TrendingDown,
          title: 'Gastos Críticos',
          message: `Você gastou ${expenseRatio.toFixed(0)}% da sua renda este mês. Controle urgente necessário.`
        });
      } else if (expenseRatio > 75) {
        alertsList.push({
          type: 'default',
          icon: Info,
          title: 'Gastos Elevados',
          message: `${expenseRatio.toFixed(0)}% da renda foi gasta. Monitore seus gastos próximos.`
        });
      }
    }

    // Análise de gastos diários (apenas para mês atual)
    if (isCurrentMonth && currentDay >= 3) {
      const recentDays = [];
      for (let i = 0; i < Math.min(currentDay, 5); i++) {
        const day = currentDay - i;
        if (day >= 1 && monthData[day]) {
          const dayData = monthData[day];
          const dailyExpense = parseCurrency(dayData.saida) + parseCurrency(dayData.diario);
          if (dailyExpense > 0) {
            recentDays.push(dailyExpense);
          }
        }
      }

      if (recentDays.length >= 2) {
        const avgDailyExpense = recentDays.reduce((sum, exp) => sum + exp, 0) / recentDays.length;
        const todayExpense = recentDays[0];

        if (todayExpense > avgDailyExpense * 2 && todayExpense > 100) {
          alertsList.push({
            type: 'default',
            icon: TrendingUp,
            title: 'Gasto Elevado Hoje',
            message: `Gasto de ${formatCurrency(todayExpense)} hoje está muito acima da sua média de ${formatCurrency(avgDailyExpense)}.`
          });
        }
      }
    }

    // Alerta positivo para boa gestão
    if (totalIncome > 0 && totalExpenses > 0) {
      const expenseRatio = (totalExpenses / totalIncome) * 100;
      if (expenseRatio < 60 && monthlyTotals.saldoFinal > 0) {
        alertsList.push({
          type: 'default',
          icon: CheckCircle,
          title: 'Gestão Eficiente',
          message: `Parabéns! Apenas ${expenseRatio.toFixed(0)}% da renda gasta. Continue assim.`
        });
      }
    }

    return alertsList.slice(0, 3); // Máximo 3 alertas
  }, [data, selectedYear, selectedMonth, monthlyTotals]);

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-6">
      {alerts.map((alert, index) => {
        const IconComponent = alert.icon;
        return (
          <Alert key={index} variant={alert.type as any} className="border-l-4">
            <IconComponent className="h-4 w-4" />
            <AlertTitle className="text-sm font-semibold">{alert.title}</AlertTitle>
            <AlertDescription className="text-sm">{alert.message}</AlertDescription>
          </Alert>
        );
      })}
    </div>
  );
};

export default SmartAlerts;
