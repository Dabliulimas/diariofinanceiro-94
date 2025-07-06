
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

  private getCurrentDay(): number {
    return new Date().getDate();
  }

  private isCurrentMonth(year: number, month: number): boolean {
    const now = new Date();
    return year === now.getFullYear() && month === now.getMonth();
  }

  analyzeNegativeBalance(
    data: FinancialData,
    selectedYear: number,
    selectedMonth: number
  ): Insight[] {
    const monthData = data[selectedYear]?.[selectedMonth];
    if (!monthData) return [];
    
    const insights: Insight[] = [];
    let negativeBalance = null;
    let firstNegativeDay = null;
    
    // Verifica apenas os dias que têm dados reais
    const daysWithData = Object.keys(monthData)
      .map(Number)
      .filter(day => {
        const dayData = monthData[day];
        return dayData && (
          this.parseCurrency(dayData.entrada) > 0 || 
          this.parseCurrency(dayData.saida) > 0 || 
          this.parseCurrency(dayData.diario) > 0
        );
      })
      .sort((a, b) => a - b);
    
    // Só analisa se há pelo menos um dia com dados
    if (daysWithData.length === 0) return [];
    
    for (const day of daysWithData) {
      const dayData = monthData[day];
      if (dayData && dayData.balance < 0) {
        if (!firstNegativeDay) {
          firstNegativeDay = day;
          negativeBalance = dayData.balance;
        }
        if (dayData.balance < negativeBalance) {
          negativeBalance = dayData.balance;
        }
      }
    }
    
    if (firstNegativeDay && negativeBalance !== null) {
      insights.push({
        type: 'critical',
        icon: '🚨',
        title: 'Saldo Negativo Detectado',
        message: `Saldo negativo a partir do dia ${firstNegativeDay} (${this.formatCurrency(negativeBalance)}). Revise seus gastos.`,
        priority: 10
      });
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
    const isCurrentMonthActive = this.isCurrentMonth(selectedYear, selectedMonth);
    
    // Coleta dados reais dos últimos 7 dias com transações
    const recentExpenses = [];
    const checkDays = Math.min(currentDay, 7);
    
    for (let i = 0; i < checkDays; i++) {
      const day = currentDay - i;
      if (day >= 1) {
        const dayData = monthData[day];
        if (dayData) {
          const saida = this.parseCurrency(dayData.saida);
          const diario = this.parseCurrency(dayData.diario);
          const totalGasto = saida + diario;
          
          if (totalGasto > 0) {
            recentExpenses.push({ day, amount: totalGasto });
          }
        }
      }
    }
    
    // Só analisa se há pelo menos 2 dias com gastos reais
    if (recentExpenses.length >= 2 && isCurrentMonthActive) {
      const sortedExpenses = recentExpenses.sort((a, b) => a.day - b.day);
      const avgExpense = sortedExpenses.reduce((sum, exp) => sum + exp.amount, 0) / sortedExpenses.length;
      const lastExpense = sortedExpenses[sortedExpenses.length - 1].amount;
      
      if (lastExpense > avgExpense * 1.5 && lastExpense > 50) {
        insights.push({
          type: 'alert',
          icon: '📊',
          title: 'Gasto Acima da Média',
          message: `Gasto de ${this.formatCurrency(lastExpense)} no dia ${sortedExpenses[sortedExpenses.length - 1].day} está ${((lastExpense/avgExpense - 1) * 100).toFixed(0)}% acima da sua média.`,
          priority: 7
        });
      }
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
    if (!isCurrentMonth || currentDay < 5) return []; // Precisa de pelo menos 5 dias de dados
    
    const insights: Insight[] = [];
    const monthData = data[selectedYear]?.[selectedMonth];
    
    if (!monthData) return [];
    
    // Coleta gastos reais dos últimos dias
    const recentDailyExpenses = [];
    let daysAnalyzed = 0;
    
    for (let day = currentDay; day >= 1 && daysAnalyzed < 7; day--) {
      const dayData = monthData[day];
      if (dayData) {
        const saida = this.parseCurrency(dayData.saida);
        const diario = this.parseCurrency(dayData.diario);
        const totalGasto = saida + diario;
        
        if (totalGasto > 0) {
          recentDailyExpenses.push(totalGasto);
          daysAnalyzed++;
        }
      }
    }
    
    // Só faz projeção se tiver pelo menos 3 dias com gastos reais
    if (recentDailyExpenses.length >= 3) {
      const avgDailyExpense = recentDailyExpenses.reduce((sum, exp) => sum + exp, 0) / recentDailyExpenses.length;
      const daysRemaining = new Date(selectedYear, selectedMonth + 1, 0).getDate() - currentDay;
      
      if (daysRemaining > 0) {
        const projectedAdditionalExpenses = avgDailyExpense * daysRemaining;
        const projectedFinalBalance = monthlyTotals.saldoFinal - projectedAdditionalExpenses;
        
        if (projectedFinalBalance < -200) {
          insights.push({
            type: 'alert',
            icon: '🎯',
            title: 'Projeção de Saldo Negativo',
            message: `Baseado nos últimos ${recentDailyExpenses.length} dias de gastos (média: ${this.formatCurrency(avgDailyExpense)}/dia), o saldo pode ficar em ${this.formatCurrency(projectedFinalBalance)}.`,
            priority: 8
          });
        } else if (projectedFinalBalance > 500) {
          insights.push({
            type: 'success',
            icon: '💰',
            title: 'Gestão Eficiente',
            message: `Mantendo o ritmo atual de gastos, você pode terminar o mês com ${this.formatCurrency(projectedFinalBalance)} de saldo positivo.`,
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
    
    // Só analisa se há dados reais de receita ou despesa
    if (totalIncome === 0 && totalExpenses === 0) {
      return [{
        type: 'coaching',
        icon: '📝',
        title: 'Comece a Registrar',
        message: 'Registre suas receitas e despesas para receber análises personalizadas.',
        priority: 5
      }];
    }
    
    if (totalIncome > 0) {
      const expenseRatio = (totalExpenses / totalIncome) * 100;
      
      if (expenseRatio > 90) {
        insights.push({
          type: 'critical',
          icon: '⚠️',
          title: 'Gastos Críticos',
          message: `Você gastou ${expenseRatio.toFixed(0)}% da sua renda. Recomendamos manter abaixo de 80%.`,
          priority: 9
        });
      } else if (expenseRatio > 75) {
        insights.push({
          type: 'warning',
          icon: '📊',
          title: 'Gastos Elevados',
          message: `${expenseRatio.toFixed(0)}% da renda foi gasta. Considere revisar despesas não essenciais.`,
          priority: 6
        });
      } else if (expenseRatio < 60) {
        insights.push({
          type: 'success',
          icon: '🎯',
          title: 'Controle Exemplar',
          message: `Excelente! Apenas ${expenseRatio.toFixed(0)}% da renda gasta. Continue assim.`,
          priority: 2
        });
      }
    }
    
    // Análise de reserva de emergência (mais realista)
    if (emergencyReserve.amount === 0 && totalIncome > 0) {
      const suggestedStart = Math.min(totalIncome * 0.1, 500);
      insights.push({
        type: 'suggestion',
        icon: '🛡️',
        title: 'Crie uma Reserva',
        message: `Comece separando ${this.formatCurrency(suggestedStart)} mensalmente para emergências.`,
        priority: 4
      });
    } else if (emergencyReserve.amount > 0 && fixedExpenses.totalAmount > 0) {
      const monthsCovered = emergencyReserve.amount / fixedExpenses.totalAmount;
      
      if (monthsCovered < 3) {
        insights.push({
          type: 'coaching',
          icon: '📈',
          title: 'Amplie sua Rezerva',
          message: `Sua reserva cobre ${monthsCovered.toFixed(1)} mês(es). Meta ideal: 6 meses de gastos fixos.`,
          priority: 4
        });
      }
    }
    
    return insights;
  }
}
