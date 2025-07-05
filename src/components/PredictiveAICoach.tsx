
import React, { useMemo } from 'react';
import { FinancialData } from '../hooks/useFinancialData';

interface MonthlyTotals {
  totalEntradas: number;
  totalSaidas: number;
  totalDiario: number;
  saldoFinal: number;
}

interface EmergencyReserve {
  amount: number;
  months: number;
}

interface FixedExpenses {
  totalAmount: number;
  categories: Array<{
    name: string;
    amount: number;
  }>;
}

interface PredictiveAICoachProps {
  data: FinancialData;
  selectedYear: number;
  selectedMonth: number;
  monthlyTotals: MonthlyTotals;
  emergencyReserve: EmergencyReserve;
  fixedExpenses: FixedExpenses;
}

const PredictiveAICoach: React.FC<PredictiveAICoachProps> = ({
  data,
  selectedYear,
  selectedMonth,
  monthlyTotals,
  emergencyReserve,
  fixedExpenses
}) => {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const insights = useMemo(() => {
    const currentDate = new Date();
    const currentDay = currentDate.getDate();
    const isCurrentMonth = selectedYear === currentDate.getFullYear() && selectedMonth === currentDate.getMonth();
    
    const insights = [];
    
    // ANÁLISE DE PADRÕES COMPORTAMENTAIS
    const analyzeSpendingPatterns = () => {
      const monthData = data[selectedYear]?.[selectedMonth];
      if (!monthData) return [];
      
      const patterns = [];
      const dailyExpenses = [];
      
      // Coletar gastos diários
      for (let day = 1; day <= currentDay && day <= 31; day++) {
        const dayData = monthData[day];
        if (dayData) {
          const dailySpent = parseCurrency(dayData.saida) + parseCurrency(dayData.diario);
          dailyExpenses.push({ day, amount: dailySpent });
        }
      }
      
      // Detectar padrões de gastos altos
      const highSpendingDays = dailyExpenses.filter(d => d.amount > 200).length;
      if (highSpendingDays > 5) {
        patterns.push({
          type: 'warning',
          icon: '⚠️',
          title: 'Padrão de Gastos Altos Detectado',
          message: `Você teve ${highSpendingDays} dias com gastos acima de R$ 200,00. Considere revisar suas despesas para manter o controle financeiro.`
        });
      }
      
      // Detectar sequência de gastos crescentes
      const recentDays = dailyExpenses.slice(-5);
      const isIncreasingTrend = recentDays.length >= 3 && 
        recentDays.every((day, index) => index === 0 || day.amount >= recentDays[index - 1].amount);
      
      if (isIncreasingTrend && recentDays[recentDays.length - 1].amount > 100) {
        patterns.push({
          type: 'alert',
          icon: '📈',
          title: 'Tendência de Gastos Crescente',
          message: 'Seus gastos têm aumentado nos últimos dias. Hora de revisar o orçamento e controlar as despesas!'
        });
      }
      
      return patterns;
    };
    
    // PREVISÃO DE SALDO FUTURO
    const predictFutureBalance = () => {
      if (!isCurrentMonth) return [];
      
      const predictions = [];
      const monthData = data[selectedYear]?.[selectedMonth];
      
      if (monthData) {
        // Calcular média de gastos dos últimos 7 dias
        const last7Days = [];
        for (let day = Math.max(1, currentDay - 6); day <= currentDay; day++) {
          const dayData = monthData[day];
          if (dayData) {
            const dailySpent = parseCurrency(dayData.saida) + parseCurrency(dayData.diario);
            const dailyIncome = parseCurrency(dayData.entrada);
            last7Days.push({ spent: dailySpent, income: dailyIncome });
          }
        }
        
        if (last7Days.length >= 3) {
          const avgDailySpent = last7Days.reduce((sum, day) => sum + day.spent, 0) / last7Days.length;
          const avgDailyIncome = last7Days.reduce((sum, day) => sum + day.income, 0) / last7Days.length;
          
          // Projetar saldo para o final do mês
          const daysRemaining = new Date(selectedYear, selectedMonth + 1, 0).getDate() - currentDay;
          const projectedExpenses = avgDailySpent * daysRemaining;
          const projectedIncome = avgDailyIncome * daysRemaining;
          const projectedBalance = monthlyTotals.saldoFinal + projectedIncome - projectedExpenses;
          
          if (projectedBalance < 0) {
            predictions.push({
              type: 'critical',
              icon: '🚨',
              title: 'Alerta de Saldo Negativo',
              message: `Baseado no seu padrão atual, seu saldo pode ficar negativo em ${formatCurrency(projectedBalance)} até o final do mês. Reduza gastos urgentemente!`
            });
          } else if (projectedBalance < 500) {
            predictions.push({
              type: 'warning',
              icon: '⚠️',
              title: 'Saldo Baixo Projetado',
              message: `Projeção para fim do mês: ${formatCurrency(projectedBalance)}. Considere reduzir gastos para manter uma margem de segurança.`
            });
          } else {
            predictions.push({
              type: 'success',
              icon: '✅',
              title: 'Projeção Positiva',
              message: `Ótima gestão! Projeção para fim do mês: ${formatCurrency(projectedBalance)}. Continue assim!`
            });
          }
        }
      }
      
      return predictions;
    };
    
    // ANÁLISE DA RESERVA DE EMERGÊNCIA
    const analyzeEmergencyReserve = () => {
      const reserveAnalysis = [];
      const monthlyExpenses = fixedExpenses.totalAmount;
      const idealReserve = monthlyExpenses * 6; // 6 meses de reserva
      
      if (emergencyReserve.amount < monthlyExpenses) {
        reserveAnalysis.push({
          type: 'critical',
          icon: '🛡️',
          title: 'Reserva de Emergência Crítica',
          message: `Sua reserva de ${formatCurrency(emergencyReserve.amount)} não cobre nem 1 mês de gastos fixos. Meta: ${formatCurrency(idealReserve)}.`
        });
      } else if (emergencyReserve.amount < idealReserve) {
        const monthsCovered = Math.floor(emergencyReserve.amount / monthlyExpenses);
        reserveAnalysis.push({
          type: 'warning',
          icon: '🛡️',
          title: 'Reserva Insuficiente',
          message: `Sua reserva cobre ${monthsCovered} meses. Recomendamos 6 meses de gastos fixos (${formatCurrency(idealReserve)}).`
        });
      } else {
        reserveAnalysis.push({
          type: 'success',
          icon: '🛡️',
          title: 'Reserva Adequada',
          message: 'Parabéns! Sua reserva de emergência está em um nível seguro para cobrir imprevistos.'
        });
      }
      
      return reserveAnalysis;
    };
    
    // COACHING PERSONALIZADO BASEADO EM DADOS
    const generatePersonalizedCoaching = () => {
      const coaching = [];
      
      // Análise de proporção entrada vs saída
      const totalIncome = monthlyTotals.totalEntradas;
      const totalExpenses = monthlyTotals.totalSaidas + monthlyTotals.totalDiario;
      
      if (totalIncome > 0) {
        const expenseRatio = (totalExpenses / totalIncome) * 100;
        
        if (expenseRatio > 90) {
          coaching.push({
            type: 'alert',
            icon: '💡',
            title: 'Coach Financeiro - Gasto Excessivo',
            message: `Você está gastando ${expenseRatio.toFixed(1)}% da sua renda. Tente manter abaixo de 80% para ter margem de poupança.`
          });
        } else if (expenseRatio < 60) {
          coaching.push({
            type: 'success',
            icon: '🎯',
            title: 'Coach Financeiro - Excelente Controle',
            message: `Fantástico! Você está gastando apenas ${expenseRatio.toFixed(1)}% da sua renda. Considere investir o excedente.`
          });
        }
      }
      
      // Sugestões baseadas no histórico
      const hasHighDailyExpenses = monthlyTotals.totalDiario > monthlyTotals.totalSaidas * 0.5;
      if (hasHighDailyExpenses) {
        coaching.push({
          type: 'suggestion',
          icon: '📝',
          title: 'Dica do Coach - Gastos Diários',
          message: 'Seus gastos diários são significativos. Tente planejar refeições e compras para reduzir custos impulsivos.'
        });
      }
      
      return coaching;
    };

    // Função auxiliar para parse de moeda
    const parseCurrency = (value: string): number => {
      if (!value) return 0;
      return parseFloat(value.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
    };

    // Combinar todas as análises
    insights.push(...analyzeSpendingPatterns());
    insights.push(...predictFutureBalance());
    insights.push(...analyzeEmergencyReserve());
    insights.push(...generatePersonalizedCoaching());
    
    return insights;
  }, [data, selectedYear, selectedMonth, monthlyTotals, emergencyReserve, fixedExpenses]);

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-800';
      case 'alert': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'suggestion': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  if (insights.length === 0) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 mb-8 border border-green-200">
        <div className="text-center">
          <span className="text-3xl">🤖</span>
          <h3 className="text-lg font-bold text-green-800 mt-2 mb-2">
            Coach IA Preditivo
          </h3>
          <p className="text-green-700">
            Continue registrando seus dados para receber análises personalizadas e previsões inteligentes!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 mb-8 border border-purple-200 shadow-lg">
      <div className="text-center mb-6">
        <span className="text-3xl">🤖</span>
        <h3 className="text-xl font-bold text-purple-800 mt-2 mb-1">
          Coach IA Preditivo
        </h3>
        <p className="text-sm text-purple-600">
          Análise Inteligente • Previsões Personalizadas • Coaching Adaptativo
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`rounded-lg p-4 border-2 ${getInsightColor(insight.type)} transition-all duration-200 hover:shadow-md`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0 mt-1">{insight.icon}</span>
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-2">{insight.title}</h4>
                <p className="text-sm leading-relaxed">{insight.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-purple-200">
        <div className="text-center text-xs text-purple-600">
          🧠 IA alimentada pelos seus dados • Análise em tempo real • Previsões personalizadas
        </div>
      </div>
    </div>
  );
};

export default PredictiveAICoach;
