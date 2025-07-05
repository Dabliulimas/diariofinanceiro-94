
import React, { useMemo, useEffect, useState } from 'react';
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

interface Insight {
  type: 'critical' | 'alert' | 'warning' | 'success' | 'suggestion' | 'coaching';
  icon: string;
  title: string;
  message: string;
  priority: number;
}

const PredictiveAICoach: React.FC<PredictiveAICoachProps> = ({
  data,
  selectedYear,
  selectedMonth,
  monthlyTotals,
  emergencyReserve,
  fixedExpenses
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // REAL-TIME REACTIVE INSIGHTS - Recalcula automaticamente quando os dados mudam
  const insights = useMemo(() => {
    console.log('🤖 IA Coach: Recalculando insights em tempo real');
    
    const currentDate = new Date();
    const currentDay = currentDate.getDate();
    const isCurrentMonth = selectedYear === currentDate.getFullYear() && selectedMonth === currentDate.getMonth();
    
    const insights: Insight[] = [];
    
    // ANÁLISE IMEDIATA DE SALDO NEGATIVO
    const analyzeNegativeBalance = () => {
      const monthData = data[selectedYear]?.[selectedMonth];
      if (!monthData) return [];
      
      const negativeBalanceInsights: Insight[] = [];
      let firstNegativeDay = null;
      let worstBalance = 0;
      let worstDay = null;
      let negativeStreak = 0;
      
      for (let day = 1; day <= 31; day++) {
        const dayData = monthData[day];
        if (dayData && dayData.balance < 0) {
          if (!firstNegativeDay) firstNegativeDay = day;
          negativeStreak++;
          
          if (dayData.balance < worstBalance) {
            worstBalance = dayData.balance;
            worstDay = day;
          }
        }
      }
      
      if (firstNegativeDay) {
        negativeBalanceInsights.push({
          type: 'critical',
          icon: '🚨',
          title: 'ALERTA CRÍTICO: Saldo Negativo Detectado',
          message: `Seu saldo ficou negativo a partir do dia ${firstNegativeDay}. Pior momento: dia ${worstDay} com ${formatCurrency(worstBalance)}. Ação urgente necessária!`,
          priority: 10
        });
        
        if (negativeStreak > 7) {
          negativeBalanceInsights.push({
            type: 'critical',
            icon: '⛔',
            title: 'Situação Financeira Prolongada',
            message: `Você ficou ${negativeStreak} dias com saldo negativo. Isso pode gerar juros e taxas. Reorganize suas finanças imediatamente.`,
            priority: 9
          });
        }
      }
      
      return negativeBalanceInsights;
    };

    // ANÁLISE COMPORTAMENTAL ADAPTATIVA
    const analyzeSpendingBehavior = () => {
      const monthData = data[selectedYear]?.[selectedMonth];
      if (!monthData) return [];
      
      const behaviorInsights: Insight[] = [];
      const dailyExpenses = [];
      const dailyIncomes = [];
      
      // Coletar dados dos últimos 7 dias
      for (let day = Math.max(1, currentDay - 6); day <= currentDay; day++) {
        const dayData = monthData[day];
        if (dayData) {
          const dailySpent = parseCurrency(dayData.saida) + parseCurrency(dayData.diario);
          const dailyIncome = parseCurrency(dayData.entrada);
          dailyExpenses.push({ day, amount: dailySpent });
          dailyIncomes.push({ day, amount: dailyIncome });
        }
      }
      
      // Detectar gastos crescentes (tendência perigosa)
      if (dailyExpenses.length >= 3) {
        const isIncreasingTrend = dailyExpenses.every((expense, index) => 
          index === 0 || expense.amount >= dailyExpenses[index - 1].amount
        );
        
        if (isIncreasingTrend && dailyExpenses[dailyExpenses.length - 1].amount > 200) {
          behaviorInsights.push({
            type: 'alert',
            icon: '📈',
            title: 'Coach IA: Padrão de Gastos Crescente Detectado',
            message: 'Seus gastos aumentaram diariamente nos últimos dias. Vamos revisar o orçamento antes que saia do controle?',
            priority: 8
          });
        }
      }
      
      // Detectar entrada baixa ou ausente
      const totalRecentIncome = dailyIncomes.reduce((sum, income) => sum + income.amount, 0);
      if (isCurrentMonth && currentDay > 10 && totalRecentIncome === 0) {
        behaviorInsights.push({
          type: 'warning',
          icon: '💰',
          title: 'Coach IA: Entrada Não Registrada',
          message: `Você não registrou entrada desde o dia 10. Tudo bem? Lembre-se de registrar salários e outras receitas.`,
          priority: 7
        });
      }
      
      return behaviorInsights;
    };

    // PREVISÃO INTELIGENTE PARA FIM DO MÊS
    const predictMonthEnd = () => {
      if (!isCurrentMonth) return [];
      
      const predictions: Insight[] = [];
      const monthData = data[selectedYear]?.[selectedMonth];
      
      if (monthData) {
        const recentDays = [];
        for (let day = Math.max(1, currentDay - 7); day <= currentDay; day++) {
          const dayData = monthData[day];
          if (dayData) {
            const dailySpent = parseCurrency(dayData.saida) + parseCurrency(dayData.diario);
            const dailyIncome = parseCurrency(dayData.entrada);
            recentDays.push({ spent: dailySpent, income: dailyIncome });
          }
        }
        
        if (recentDays.length >= 3) {
          const avgDailySpent = recentDays.reduce((sum, day) => sum + day.spent, 0) / recentDays.length;
          const avgDailyIncome = recentDays.reduce((sum, day) => sum + day.income, 0) / recentDays.length;
          
          const daysRemaining = new Date(selectedYear, selectedMonth + 1, 0).getDate() - currentDay;
          const projectedExpenses = avgDailySpent * daysRemaining;
          const projectedIncome = avgDailyIncome * daysRemaining;
          const projectedBalance = monthlyTotals.saldoFinal + projectedIncome - projectedExpenses;
          
          if (projectedBalance < -500) {
            predictions.push({
              type: 'critical',
              icon: '🎯',
              title: 'Previsão IA: Risco Alto de Endividamento',
              message: `Baseado no seu padrão atual, seu saldo pode chegar a ${formatCurrency(projectedBalance)} no fim do mês. Corte gastos agora!`,
              priority: 9
            });
          } else if (projectedBalance < 0) {
            predictions.push({
              type: 'alert',
              icon: '⚠️',
              title: 'Previsão IA: Saldo Negativo Projetado',
              message: `Projeção para fim do mês: ${formatCurrency(projectedBalance)}. Ajuste seus gastos nos próximos ${daysRemaining} dias.`,
              priority: 8
            });
          } else if (projectedBalance < 200) {
            predictions.push({
              type: 'warning',
              icon: '📊',
              title: 'Previsão IA: Margem Apertada',
              message: `Projeção para fim do mês: ${formatCurrency(projectedBalance)}. Margem baixa, mantenha o controle.`,
              priority: 6
            });
          } else if (projectedBalance > 1000) {
            predictions.push({
              type: 'success',
              icon: '🎉',
              title: 'Previsão IA: Excelente Gestão!',
              message: `Parabéns! Projeção para fim do mês: ${formatCurrency(projectedBalance)}. Considere investir o excedente.`,
              priority: 3
            });
          }
        }
      }
      
      return predictions;
    };

    // COACHING PERSONALIZADO E ADAPTATIVO
    const generatePersonalizedCoaching = () => {
      const coaching: Insight[] = [];
      
      // Análise de proporção entrada vs gastos
      const totalIncome = monthlyTotals.totalEntradas;
      const totalExpenses = monthlyTotals.totalSaidas + monthlyTotals.totalDiario;
      
      if (totalIncome > 0) {
        const expenseRatio = (totalExpenses / totalIncome) * 100;
        
        if (expenseRatio > 95) {
          coaching.push({
            type: 'critical',
            icon: '🎯',
            title: 'Coach IA: Gasto Crítico Detectado',
            message: `Você está gastando ${expenseRatio.toFixed(1)}% da sua renda! Meta: manter abaixo de 80%. Precisa cortar gastos urgentemente.`,
            priority: 8
          });
        } else if (expenseRatio > 85) {
          coaching.push({
            type: 'alert',
            icon: '📈',
            title: 'Coach IA: Atenção ao Orçamento',
            message: `Gastos em ${expenseRatio.toFixed(1)}% da renda. Você está no limite. Que tal revisar as despesas não essenciais?`,
            priority: 7
          });
        } else if (expenseRatio < 50) {
          coaching.push({
            type: 'success',
            icon: '💪',
            title: 'Coach IA: Disciplina Exemplar!',
            message: `Fantástico! Apenas ${expenseRatio.toFixed(1)}% da renda gasta. Você está no caminho certo para a independência financeira!`,
            priority: 2
          });
        }
      }
      
      // Análise da reserva de emergência
      if (fixedExpenses.totalAmount > 0) {
        const monthsCovered = emergencyReserve.amount / fixedExpenses.totalAmount;
        
        if (emergencyReserve.amount === 0) {
          coaching.push({
            type: 'critical',
            icon: '🛡️',
            title: 'Coach IA: Sem Proteção Financeira',
            message: 'Você não tem reserva de emergência. Comece com R$ 500 e aumente gradualmente até 6 meses de gastos.',
            priority: 6
          });
        } else if (monthsCovered < 3) {
          coaching.push({
            type: 'warning',
            icon: '⚡',
            title: 'Coach IA: Reserva Insuficiente',
            message: `Sua reserva cobre ${monthsCovered.toFixed(1)} mês(es). Meta: 6 meses. Que tal separar 10% da renda para a reserva?`,
            priority: 5
          });
        } else if (monthsCovered >= 6) {
          coaching.push({
            type: 'success',
            icon: '🏆',
            title: 'Coach IA: Reserva Sólida!',
            message: `Excelente! Sua reserva cobre ${monthsCovered.toFixed(1)} meses. Agora pode focar em investimentos de longo prazo.`,
            priority: 1
          });
        }
      }
      
      return coaching;
    };

    // Função auxiliar para parse de moeda
    const parseCurrency = (value: string): number => {
      if (!value) return 0;
      return parseFloat(value.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
    };

    // Combinar todas as análises e ordenar por prioridade
    const allInsights = [
      ...analyzeNegativeBalance(),
      ...analyzeSpendingBehavior(),
      ...predictMonthEnd(),
      ...generatePersonalizedCoaching()
    ];
    
    // Ordenar por prioridade (maior prioridade primeiro)
    return allInsights.sort((a, b) => b.priority - a.priority);
  }, [data, selectedYear, selectedMonth, monthlyTotals, emergencyReserve, fixedExpenses]);

  // Animação quando insights são atualizados
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 300);
    return () => clearTimeout(timer);
  }, [insights]);

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-50 border-red-300 text-red-900 shadow-red-100';
      case 'alert': return 'bg-orange-50 border-orange-300 text-orange-900 shadow-orange-100';
      case 'warning': return 'bg-yellow-50 border-yellow-300 text-yellow-900 shadow-yellow-100';
      case 'success': return 'bg-green-50 border-green-300 text-green-900 shadow-green-100';
      case 'suggestion': return 'bg-blue-50 border-blue-300 text-blue-900 shadow-blue-100';
      case 'coaching': return 'bg-purple-50 border-purple-300 text-purple-900 shadow-purple-100';
      default: return 'bg-gray-50 border-gray-300 text-gray-900 shadow-gray-100';
    }
  };

  if (insights.length === 0) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-8 border-2 border-green-200 shadow-lg">
        <div className="text-center">
          <span className="text-4xl mb-4 block animate-pulse">🤖</span>
          <h3 className="text-xl font-bold text-green-800 mb-2">
            Coach IA Preditivo Ativo
          </h3>
          <p className="text-green-700 text-sm">
            Continue registrando seus dados. Estou analisando seus padrões para oferecer insights personalizados em tempo real!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 mb-8 border-2 border-purple-200 shadow-xl transition-all duration-300 ${isAnimating ? 'scale-[1.02] shadow-2xl' : ''}`}>
      <div className="text-center mb-6">
        <span className="text-4xl mb-3 block">🤖</span>
        <h3 className="text-2xl font-bold text-purple-800 mb-1">
          Coach IA Preditivo
        </h3>
        <p className="text-sm text-purple-600 font-medium">
          🔄 Análise em Tempo Real • 🧠 IA Adaptativa • 🎯 Coaching Personalizado
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`rounded-xl p-5 border-2 ${getInsightColor(insight.type)} transition-all duration-300 hover:shadow-lg hover:scale-[1.02] animate-fade-in`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl flex-shrink-0 mt-1">{insight.icon}</span>
              <div className="flex-1">
                <h4 className="font-bold text-base mb-3 leading-tight">{insight.title}</h4>
                <p className="text-sm leading-relaxed opacity-90">{insight.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 pt-6 border-t-2 border-purple-200">
        <div className="text-center text-xs text-purple-600 font-medium">
          🧠 IA Reativa • Atualização Automática • Previsões Baseadas no Seu Comportamento
        </div>
      </div>
    </div>
  );
};

export default PredictiveAICoach;
