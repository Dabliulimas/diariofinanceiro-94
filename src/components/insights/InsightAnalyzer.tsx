
import { FinancialData } from '../../hooks/useFinancialData';

export interface MonthlyTotals {
  totalEntradas: number;
  totalSaidas: number;
  totalDiario: number;
  saldoFinal: number;
}

export interface EmergencyReserve {
  amount: number;
  months: number;
}

export interface FixedExpenses {
  totalAmount: number;
  categories: Array<{
    name: string;
    amount: number;
  }>;
}

export interface Insight {
  type: 'critical' | 'alert' | 'warning' | 'success' | 'suggestion' | 'coaching';
  icon: string;
  title: string;
  message: string;
  priority: number;
}

export class InsightAnalyzer {
  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  private parseCurrency(value: string): number {
    if (!value) return 0;
    return parseFloat(value.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
  }

  analyzeNegativeBalance(
    data: FinancialData,
    selectedYear: number,
    selectedMonth: number
  ): Insight[] {
    const monthData = data[selectedYear]?.[selectedMonth];
    if (!monthData) return [];
    
    const insights: Insight[] = [];
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
      insights.push({
        type: 'critical',
        icon: '🚨',
        title: 'Saldo Negativo Detectado',
        message: `Saldo negativo a partir do dia ${firstNegativeDay}. Pior momento: dia ${worstDay} com ${this.formatCurrency(worstBalance)}.`,
        priority: 10
      });
      
      if (negativeStreak > 7) {
        insights.push({
          type: 'critical',
          icon: '⚠️',
          title: 'Situação Prolongada',
          message: `${negativeStreak} dias consecutivos com saldo negativo. Reorganize suas finanças urgentemente.`,
          priority: 9
        });
      }
    }
    
    return insights;
  }

  analyzeSpendingBehavior(
    data: FinancialData,
    selectedYear: number,
    selectedMonth: number,
    currentDay: number
  ): Insight[] {
    const monthData = data[selectedYear]?.[selectedMonth];
    if (!monthData) return [];
    
    const insights: Insight[] = [];
    const dailyExpenses = [];
    const dailyIncomes = [];
    
    for (let day = Math.max(1, currentDay - 6); day <= currentDay; day++) {
      const dayData = monthData[day];
      if (dayData) {
        const dailySpent = this.parseCurrency(dayData.saida) + this.parseCurrency(dayData.diario);
        const dailyIncome = this.parseCurrency(dayData.entrada);
        dailyExpenses.push({ day, amount: dailySpent });
        dailyIncomes.push({ day, amount: dailyIncome });
      }
    }
    
    if (dailyExpenses.length >= 3) {
      const isIncreasingTrend = dailyExpenses.every((expense, index) => 
        index === 0 || expense.amount >= dailyExpenses[index - 1].amount
      );
      
      if (isIncreasingTrend && dailyExpenses[dailyExpenses.length - 1].amount > 200) {
        insights.push({
          type: 'alert',
          icon: '📈',
          title: 'Gastos Crescentes',
          message: 'Seus gastos aumentaram diariamente. Revise o orçamento antes que saia do controle.',
          priority: 8
        });
      }
    }
    
    const totalRecentIncome = dailyIncomes.reduce((sum, income) => sum + income.amount, 0);
    if (currentDay > 10 && totalRecentIncome === 0) {
      insights.push({
        type: 'warning',
        icon: '💰',
        title: 'Receita Não Registrada',
        message: 'Você não registrou receitas recentemente. Lembre-se de registrar salários e outras fontes.',
        priority: 7
      });
    }
    
    return insights;
  }

  predictMonthEnd(
    data: FinancialData,
    selectedYear: number,
    selectedMonth: number,
    monthlyTotals: MonthlyTotals,
    currentDay: number,
    isCurrentMonth: boolean
  ): Insight[] {
    if (!isCurrentMonth) return [];
    
    const insights: Insight[] = [];
    const monthData = data[selectedYear]?.[selectedMonth];
    
    if (monthData) {
      const recentDays = [];
      for (let day = Math.max(1, currentDay - 7); day <= currentDay; day++) {
        const dayData = monthData[day];
        if (dayData) {
          const dailySpent = this.parseCurrency(dayData.saida) + this.parseCurrency(dayData.diario);
          const dailyIncome = this.parseCurrency(dayData.entrada);
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
          insights.push({
            type: 'critical',
            icon: '🎯',
            title: 'Alto Risco de Endividamento',
            message: `Projeção: ${this.formatCurrency(projectedBalance)} no fim do mês. Corte gastos agora!`,
            priority: 9
          });
        } else if (projectedBalance < 0) {
          insights.push({
            type: 'alert',
            icon: '⚠️',
            title: 'Saldo Negativo Projetado',
            message: `Projeção: ${this.formatCurrency(projectedBalance)}. Ajuste gastos nos próximos ${daysRemaining} dias.`,
            priority: 8
          });
        } else if (projectedBalance > 1000) {
          insights.push({
            type: 'success',
            icon: '🎯',
            title: 'Excelente Gestão',
            message: `Projeção: ${this.formatCurrency(projectedBalance)}. Considere investir o excedente.`,
            priority: 3
          });
        }
      }
    }
    
    return insights;
  }

  generatePersonalizedCoaching(
    monthlyTotals: MonthlyTotals,
    emergencyReserve: EmergencyReserve,
    fixedExpenses: FixedExpenses
  ): Insight[] {
    const insights: Insight[] = [];
    
    const totalIncome = monthlyTotals.totalEntradas;
    const totalExpenses = monthlyTotals.totalSaidas + monthlyTotals.totalDiario;
    
    if (totalIncome > 0) {
      const expenseRatio = (totalExpenses / totalIncome) * 100;
      
      if (expenseRatio > 95) {
        insights.push({
          type: 'critical',
          icon: '🎯',
          title: 'Gasto Crítico',
          message: `${expenseRatio.toFixed(1)}% da renda gasta! Meta: manter abaixo de 80%. Corte gastos urgentemente.`,
          priority: 8
        });
      } else if (expenseRatio > 85) {
        insights.push({
          type: 'alert',
          icon: '📊',
          title: 'Orçamento no Limite',
          message: `${expenseRatio.toFixed(1)}% da renda gasta. Revise despesas não essenciais.`,
          priority: 7
        });
      } else if (expenseRatio < 50) {
        insights.push({
          type: 'success',
          icon: '💪',
          title: 'Disciplina Exemplar',
          message: `Apenas ${expenseRatio.toFixed(1)}% gasto. Você está no caminho da independência financeira!`,
          priority: 2
        });
      }
    }
    
    if (fixedExpenses.totalAmount > 0) {
      const monthsCovered = emergencyReserve.amount / fixedExpenses.totalAmount;
      
      if (emergencyReserve.amount === 0) {
        insights.push({
          type: 'critical',
          icon: '🛡️',
          title: 'Sem Proteção Financeira',
          message: 'Crie uma reserva de emergência. Comece com R$ 500 e aumente gradualmente.',
          priority: 6
        });
      } else if (monthsCovered < 3) {
        insights.push({
          type: 'warning',
          icon: '⚡',
          title: 'Reserva Insuficiente',
          message: `Reserva cobre ${monthsCovered.toFixed(1)} mês(es). Meta: 6 meses. Separe 10% da renda.`,
          priority: 5
        });
      } else if (monthsCovered >= 6) {
        insights.push({
          type: 'success',
          icon: '🏆',
          title: 'Reserva Sólida',
          message: `Reserva cobre ${monthsCovered.toFixed(1)} meses. Foque em investimentos de longo prazo.`,
          priority: 1
        });
      }
    }
    
    return insights;
  }
}
