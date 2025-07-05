
import React from 'react';
import InsightCard from './InsightCard';

interface FixedExpenseCategory {
  id: string;
  name: string;
  amount: number;
}

interface InsightsSectionProps {
  monthlyTotals: {
    totalEntradas: number;
    totalSaidas: number;
    totalDiario: number;
    saldoFinal: number;
  };
  selectedMonth: number;
  selectedYear: number;
  data: any;
  emergencyReserve: { amount: number; months: 6 | 12; lastUpdated: string };
  fixedExpenses: { categories: FixedExpenseCategory[]; totalAmount: number; lastUpdated: string };
  recommendedReserve: number;
}

const InsightsSection: React.FC<InsightsSectionProps> = ({ 
  monthlyTotals, 
  selectedMonth, 
  selectedYear,
  data,
  emergencyReserve,
  fixedExpenses,
  recommendedReserve
}) => {
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const generateInsights = () => {
    const insights = [];
    const { totalEntradas, totalSaidas, totalDiario, saldoFinal } = monthlyTotals;

    // Emergency Reserve Insights
    if (fixedExpenses.totalAmount > 0) {
      const reserveMonths = emergencyReserve.amount / fixedExpenses.totalAmount;
      const targetMonths = emergencyReserve.months;
      
      if (emergencyReserve.amount === 0) {
        insights.push({
          type: 'critical' as const,
          icon: '🚨',
          title: 'Sem Reserva de Emergência',
          message: `Você não tem reserva de emergência. Recomendamos ter ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(recommendedReserve)} (${targetMonths} meses de gastos fixos).`
        });
      } else if (reserveMonths < targetMonths / 2) {
        insights.push({
          type: 'critical' as const,
          icon: '⚠️',
          title: 'Reserva Crítica',
          message: `Sua reserva cobre apenas ${reserveMonths.toFixed(1)} meses de gastos fixos. Meta: ${targetMonths} meses. Priorize aumentar sua reserva!`
        });
      } else if (reserveMonths < targetMonths) {
        insights.push({
          type: 'warning' as const,
          icon: '📊',
          title: 'Reserva em Construção',
          message: `Sua reserva cobre ${reserveMonths.toFixed(1)} meses de gastos fixos. Faltam ${(targetMonths - reserveMonths).toFixed(1)} meses para atingir sua meta.`
        });
      } else {
        insights.push({
          type: 'success' as const,
          icon: '🛡️',
          title: 'Reserva Saudável',
          message: `Excelente! Sua reserva cobre ${reserveMonths.toFixed(1)} meses de gastos fixos. Você está protegido!`
        });
      }
    }

    // Check if no data exists
    if (totalEntradas === 0 && totalSaidas === 0 && totalDiario === 0) {
      insights.push({
        type: 'info' as const,
        icon: '🎯',
        title: 'Comece a Registrar',
        message: 'Adicione suas receitas e gastos para receber insights personalizados sobre sua situação financeira.'
      });
      return insights;
    }

    // Advanced negative balance detection
    if (saldoFinal < 0) {
      let firstNegativeDay = null;
      let worstDay = null;
      let worstBalance = 0;
      
      if (data[selectedYear] && data[selectedYear][selectedMonth]) {
        const monthData = data[selectedYear][selectedMonth];
        const days = Object.keys(monthData).map(Number).sort();
        
        for (const day of days) {
          const balance = monthData[day].balance;
          if (balance < 0 && !firstNegativeDay) {
            firstNegativeDay = day;
          }
          if (balance < worstBalance) {
            worstBalance = balance;
            worstDay = day;
          }
        }
      }

      const dayText = firstNegativeDay ? ` a partir do dia ${firstNegativeDay}` : '';
      const worstText = worstDay ? ` (pior momento: dia ${worstDay} com ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(worstBalance)})` : '';

      insights.push({
        type: 'critical' as const,
        icon: '💥',
        title: 'Renda Comprometida',
        message: `ATENÇÃO: Sua renda ficará comprometida${dayText} em ${monthNames[selectedMonth]}${worstText}. Reduza gastos urgentemente!`
      });

      // Suggest specific actions
      if (totalSaidas > totalEntradas) {
        const excess = totalSaidas - totalEntradas;
        insights.push({
          type: 'warning' as const,
          icon: '💡',
          title: 'Sugestão de Economia',
          message: `Você precisa cortar ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(excess)} em gastos para equilibrar o orçamento. Analise seus gastos fixos por categoria.`
        });
      }
    }

    // Future financial risk prediction
    const totalMonthlySpending = totalSaidas + totalDiario;
    if (totalEntradas > 0 && totalMonthlySpending > totalEntradas * 0.85) {
      const riskLevel = totalMonthlySpending / totalEntradas;
      if (riskLevel >= 0.95) {
        insights.push({
          type: 'critical' as const,
          icon: '🚨',
          title: 'Alto Risco Financeiro',
          message: `Seus gastos representam ${(riskLevel * 100).toFixed(1)}% da receita. Risco alto de endividamento no próximo mês!`
        });
      } else {
        insights.push({
          type: 'warning' as const,
          icon: '⚡',
          title: 'Risco Financeiro Moderado',
          message: `Gastos elevados: ${(riskLevel * 100).toFixed(1)}% da receita. Monitore de perto para evitar problemas futuros.`
        });
      }
    }

    // Fixed expenses category analysis
    if (fixedExpenses.categories.length > 0) {
      const highestCategory = fixedExpenses.categories.reduce((prev, current) => 
        (prev.amount > current.amount) ? prev : current
      );
      
      if (totalEntradas > 0) {
        const categoryPercentage = (highestCategory.amount / totalEntradas) * 100;
        if (categoryPercentage > 30) {
          insights.push({
            type: 'warning' as const,
            icon: '📈',
            title: 'Categoria Dominante',
            message: `${highestCategory.name} representa ${categoryPercentage.toFixed(1)}% da sua receita (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(highestCategory.amount)}). Considere otimizar este gasto.`
          });
        }
      }
    }

    // Positive insights
    if (saldoFinal > 0 && totalEntradas > 0) {
      const savingsRate = (saldoFinal / totalEntradas) * 100;
      if (savingsRate >= 20) {
        insights.push({
          type: 'success' as const,
          icon: '🎉',
          title: 'Excelente Poupador!',
          message: `Parabéns! Você conseguiu poupar ${savingsRate.toFixed(1)}% da sua receita (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldoFinal)}) este mês.`
        });
      } else if (savingsRate >= 10) {
        insights.push({
          type: 'success' as const,
          icon: '💰',
          title: 'Boa Disciplina Financeira',
          message: `Você poupou ${savingsRate.toFixed(1)}% da receita. Continue assim e tente aumentar gradualmente para 20%.`
        });
      }
    }

    return insights;
  };

  const insights = generateInsights();

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
      <div className="flex items-center space-x-3 mb-4 sm:mb-6">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-full flex items-center justify-center">
          <span className="text-purple-600 text-lg sm:text-xl">🧠</span>
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Insights Financeiros IA</h2>
      </div>
      
      <div className="space-y-3 sm:space-y-4">
        {insights.map((insight, index) => (
          <InsightCard
            key={index}
            type={insight.type}
            icon={insight.icon}
            title={insight.title}
            message={insight.message}
          />
        ))}
      </div>
    </div>
  );
};

export default InsightsSection;
