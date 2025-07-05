
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Brain, TrendingUp, AlertTriangle, Target, Zap, RefreshCw, DollarSign, Shield, Activity, CheckCircle, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../utils/currencyUtils';
import * as tf from '@tensorflow/tfjs';

interface PredictiveAICoachProps {
  data: any;
  selectedYear: number;
  selectedMonth: number;
  monthlyTotals: {
    totalEntradas: number;
    totalSaidas: number;
    totalDiario: number;
    saldoFinal: number;
  };
  emergencyReserve: {
    amount: number;
    months: number;
  };
  fixedExpenses: {
    totalAmount: number;
  };
}

interface PredictionData {
  futureDays: Array<{
    day: number;
    predictedBalance: number;
    confidence: number;
  }>;
  criticalDate?: {
    day: number;
    balance: number;
  };
  recommendations: Array<{
    type: 'critical' | 'warning' | 'success' | 'info';
    title: string;
    message: string;
    icon: string;
  }>;
}

const PredictiveAICoach: React.FC<PredictiveAICoachProps> = ({
  data,
  selectedYear,
  selectedMonth,
  monthlyTotals,
  emergencyReserve,
  fixedExpenses
}) => {
  const [predictions, setPredictions] = useState<PredictionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);

  // Initialize TensorFlow.js
  useEffect(() => {
    const initTensorFlow = async () => {
      try {
        await tf.ready();
        setModelReady(true);
        console.log('🧠 TensorFlow.js ready for predictions');
      } catch (error) {
        console.error('❌ TensorFlow.js initialization failed:', error);
      }
    };
    
    initTensorFlow();
  }, []);

  // Extract historical data for training
  const extractHistoricalData = useCallback(() => {
    const historicalData: Array<{
      entrada: number;
      saida: number;
      diario: number;
      previousBalance: number;
      resultingBalance: number;
    }> = [];

    if (!data[selectedYear]) return historicalData;

    for (let month = 0; month <= selectedMonth; month++) {
      if (data[selectedYear][month]) {
        const monthData = data[selectedYear][month];
        const days = Object.keys(monthData).map(Number).sort();
        
        for (const day of days) {
          const dayData = monthData[day];
          const entrada = parseFloat(dayData.entrada.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
          const saida = parseFloat(dayData.saida.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
          const diario = parseFloat(dayData.diario.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
          
          // Get previous balance
          let previousBalance = 0;
          if (day === 1) {
            if (month === 0) {
              // Get from previous year if available
              if (data[selectedYear - 1] && data[selectedYear - 1][11]) {
                const prevYearLastMonth = data[selectedYear - 1][11];
                const lastDay = Math.max(...Object.keys(prevYearLastMonth).map(Number));
                previousBalance = prevYearLastMonth[lastDay]?.balance || 0;
              }
            } else {
              // Get from previous month
              if (data[selectedYear][month - 1]) {
                const prevMonth = data[selectedYear][month - 1];
                const lastDay = Math.max(...Object.keys(prevMonth).map(Number));
                previousBalance = prevMonth[lastDay]?.balance || 0;
              }
            }
          } else {
            previousBalance = monthData[day - 1]?.balance || 0;
          }

          if (entrada > 0 || saida > 0 || diario > 0) {
            historicalData.push({
              entrada,
              saida,
              diario,
              previousBalance,
              resultingBalance: dayData.balance
            });
          }
        }
      }
    }

    return historicalData;
  }, [data, selectedYear, selectedMonth]);

  // Enhanced prediction algorithm with financial analysis
  const generatePredictions = useCallback(async (): Promise<PredictionData> => {
    const historicalData = extractHistoricalData();
    
    if (historicalData.length < 5) {
      return {
        futureDays: [],
        recommendations: [{
          type: 'info',
          icon: '📊',
          title: 'Dados Insuficientes',
          message: 'Adicione mais lançamentos para receber previsões personalizadas baseadas no seu padrão financeiro.'
        }]
      };
    }

    // Calculate user patterns and financial health metrics
    const avgEntrada = historicalData.reduce((sum, d) => sum + d.entrada, 0) / historicalData.length;
    const avgSaida = historicalData.reduce((sum, d) => sum + d.saida, 0) / historicalData.length;
    const avgDiario = historicalData.reduce((sum, d) => sum + d.diario, 0) / historicalData.length;
    
    // Financial health calculations
    const netFlow = monthlyTotals.totalEntradas - monthlyTotals.totalSaidas - monthlyTotals.totalDiario;
    const recommendedReserve = fixedExpenses.totalAmount * 6;
    const reserveStatus = emergencyReserve.amount >= recommendedReserve;
    const savingsRate = monthlyTotals.totalEntradas > 0 ? (netFlow / monthlyTotals.totalEntradas) * 100 : 0;
    const expenseRatio = monthlyTotals.totalEntradas > 0 ? ((monthlyTotals.totalSaidas + monthlyTotals.totalDiario) / monthlyTotals.totalEntradas) * 100 : 0;
    
    // Get current balance
    const currentDay = new Date().getDate();
    const currentBalance = data[selectedYear]?.[selectedMonth]?.[currentDay]?.balance || monthlyTotals.saldoFinal;
    
    // Predict next 15 days
    const futureDays: Array<{ day: number; predictedBalance: number; confidence: number }> = [];
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    let runningBalance = currentBalance;
    let criticalDate: { day: number; balance: number } | undefined;

    for (let day = currentDay + 1; day <= Math.min(currentDay + 15, daysInMonth); day++) {
      // Apply learned patterns with some randomness
      const dailyChange = avgEntrada - avgSaida - avgDiario;
      const volatility = Math.random() * 0.3 - 0.15; // ±15% variation
      const predictedChange = dailyChange * (1 + volatility);
      
      runningBalance += predictedChange;
      
      const confidence = Math.max(0.5, 1 - (day - currentDay) * 0.05); // Decreasing confidence
      
      futureDays.push({
        day,
        predictedBalance: runningBalance,
        confidence
      });

      // Check for critical negative balance
      if (runningBalance < 0 && !criticalDate) {
        criticalDate = { day, balance: runningBalance };
      }
    }

    // Generate comprehensive intelligent recommendations
    const recommendations: PredictionData['recommendations'] = [];

    // Main financial health insight (combining the old EnhancedInsights logic)
    if (netFlow > 0 && reserveStatus) {
      recommendations.push({
        type: 'success',
        icon: '🎉',
        title: 'Situação Financeira Excelente',
        message: `Fluxo positivo de ${formatCurrency(netFlow)} e reserva adequada. Considere investir o excedente para multiplicar seus ganhos.`
      });
    } else if (netFlow > 0 && !reserveStatus) {
      recommendations.push({
        type: 'info',
        icon: '🎯',
        title: 'Fluxo Positivo - Fortaleça sua Reserva',
        message: `Excelente fluxo de ${formatCurrency(netFlow)}! Priorize completar sua reserva de emergência (atual: ${formatCurrency(emergencyReserve.amount)} | meta: ${formatCurrency(recommendedReserve)}).`
      });
    } else if (netFlow < 0 && reserveStatus) {
      recommendations.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Gastos Altos - Reserva Protegida',
        message: `Déficit de ${formatCurrency(Math.abs(netFlow))}, mas sua reserva está adequada. Revise despesas para voltar ao equilíbrio.`
      });
    } else {
      recommendations.push({
        type: 'critical',
        icon: '🚨',
        title: 'Atenção: Situação Crítica',
        message: `Déficit de ${formatCurrency(Math.abs(netFlow))} e reserva insuficiente. Ação urgente necessária para cortar gastos.`
      });
    }

    // Critical alerts
    if (criticalDate) {
      recommendations.push({
        type: 'critical',
        icon: '🚨',
        title: 'Alerta Crítico de Saldo',
        message: `Previsão: seu saldo ficará negativo no dia ${criticalDate.day} (${formatCurrency(criticalDate.balance)}). Reduza gastos urgentemente!`
      });
    }

    // Savings rate analysis
    if (savingsRate >= 20) {
      recommendations.push({
        type: 'success',
        icon: '💰',
        title: 'Taxa de Poupança Excepcional',
        message: `Parabéns! Você está poupando ${savingsRate.toFixed(1)}% da receita. Continue assim e considere diversificar investimentos.`
      });
    } else if (savingsRate >= 10) {
      recommendations.push({
        type: 'info',
        icon: '📈',
        title: 'Boa Taxa de Poupança',
        message: `Taxa de poupança de ${savingsRate.toFixed(1)}% é saudável. Tente aumentar gradualmente para 20% para acelerar seus objetivos.`
      });
    } else if (savingsRate > 0) {
      recommendations.push({
        type: 'warning',
        icon: '⚡',
        title: 'Taxa de Poupança Baixa',
        message: `Taxa de poupança de ${savingsRate.toFixed(1)}% está abaixo do ideal. Meta: pelo menos 10% da receita.`
      });
    }

    // Expense ratio analysis
    if (expenseRatio > 90) {
      recommendations.push({
        type: 'warning',
        icon: '📊',
        title: 'Gastos Muito Altos',
        message: `Seus gastos representam ${expenseRatio.toFixed(1)}% da receita. Risco alto de endividamento - revise despesas não essenciais.`
      });
    }

    // Emergency reserve analysis
    if (emergencyReserve.amount < fixedExpenses.totalAmount * 3) {
      const currentMonths = emergencyReserve.amount / fixedExpenses.totalAmount;
      recommendations.push({
        type: 'warning',
        icon: '🛡️',
        title: 'Reserva de Emergência Insuficiente',
        message: `Sua reserva cobre apenas ${currentMonths.toFixed(1)} meses de gastos fixos. Meta recomendada: 6 meses (${formatCurrency(recommendedReserve)}).`
      });
    }

    // Spending trend analysis
    const recentData = historicalData.slice(-7); // Last 7 entries
    const olderData = historicalData.slice(-14, -7); // Previous 7 entries
    
    if (recentData.length >= 3 && olderData.length >= 3) {
      const recentAvgSpending = recentData.reduce((sum, d) => sum + d.saida + d.diario, 0) / recentData.length;
      const olderAvgSpending = olderData.reduce((sum, d) => sum + d.saida + d.diario, 0) / olderData.length;
      
      if (recentAvgSpending > olderAvgSpending * 1.2) {
        recommendations.push({
          type: 'warning',
          icon: '📈',
          title: 'Tendência de Gastos Crescente',
          message: `Seus gastos aumentaram ${(((recentAvgSpending / olderAvgSpending) - 1) * 100).toFixed(1)}% recentemente. Avalie se isso é sustentável.`
        });
      } else if (recentAvgSpending < olderAvgSpending * 0.8) {
        recommendations.push({
          type: 'success',
          icon: '📉',
          title: 'Redução Inteligente de Gastos',
          message: `Excelente! Você reduziu gastos em ${(((olderAvgSpending / recentAvgSpending) - 1) * 100).toFixed(1)}% recentemente. Continue assim!`
        });
      }
    }

    return {
      futureDays,
      criticalDate,
      recommendations
    };
  }, [extractHistoricalData, data, selectedYear, selectedMonth, monthlyTotals, emergencyReserve, fixedExpenses]);

  // Generate predictions when data changes
  useEffect(() => {
    if (modelReady && monthlyTotals.totalEntradas > 0) {
      setIsLoading(true);
      generatePredictions()
        .then(setPredictions)
        .finally(() => setIsLoading(false));
    }
  }, [modelReady, generatePredictions, monthlyTotals]);

  const handleRefreshPredictions = () => {
    if (!modelReady) return;
    
    setIsLoading(true);
    generatePredictions()
      .then(setPredictions)
      .finally(() => setIsLoading(false));
  };

  if (!modelReady) {
    return (
      <Card className="mb-6 border-l-4 border-l-purple-500">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-purple-700 font-medium">Inicializando IA Coach...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate financial metrics for quick stats
  const netFlow = monthlyTotals.totalEntradas - monthlyTotals.totalSaidas - monthlyTotals.totalDiario;
  const savingsRate = monthlyTotals.totalEntradas > 0 ? (netFlow / monthlyTotals.totalEntradas) * 100 : 0;
  const expenseRatio = monthlyTotals.totalEntradas > 0 ? ((monthlyTotals.totalSaidas + monthlyTotals.totalDiario) / monthlyTotals.totalEntradas) * 100 : 0;

  return (
    <div className="mb-6 space-y-4">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-7 h-7" />
              <div>
                <h3 className="text-xl font-bold">IA Coach Preditiva</h3>
                <p className="text-purple-100 text-sm">Análise inteligente e previsões financeiras personalizadas</p>
              </div>
            </div>
            <Button
              onClick={handleRefreshPredictions}
              disabled={isLoading}
              variant="secondary"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Quick Financial Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-600 font-medium">Fluxo Mensal</p>
                <p className={`text-lg font-bold ${netFlow >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {formatCurrency(netFlow)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

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

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600 font-medium">Reserva</p>
                <p className="text-lg font-bold text-blue-700">
                  {formatCurrency(emergencyReserve.amount)}
                </p>
              </div>
              <Shield className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Predictions Display */}
      {predictions && (
        <>
          {/* Future Balance Predictions */}
          {predictions.futureDays.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Previsão de Saldo (Próximos 15 dias)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {predictions.futureDays.slice(0, 6).map((prediction) => (
                    <div
                      key={prediction.day}
                      className={`p-3 rounded-lg border ${
                        prediction.predictedBalance < 0 
                          ? 'bg-red-50 border-red-200' 
                          : 'bg-green-50 border-green-200'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">Dia {prediction.day}</span>
                        <span className={`text-sm px-2 py-1 rounded ${
                          prediction.confidence > 0.8 ? 'bg-green-100 text-green-700' :
                          prediction.confidence > 0.6 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {(prediction.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className={`text-lg font-bold ${
                        prediction.predictedBalance < 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {formatCurrency(prediction.predictedBalance)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                Análises e Recomendações Inteligentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {predictions.recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${
                      rec.type === 'critical' ? 'border-l-red-500 bg-red-50' :
                      rec.type === 'warning' ? 'border-l-orange-500 bg-orange-50' :
                      rec.type === 'success' ? 'border-l-green-500 bg-green-50' :
                      'border-l-blue-500 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{rec.icon}</span>
                      <div className="flex-1">
                        <h4 className={`font-semibold ${
                          rec.type === 'critical' ? 'text-red-900' :
                          rec.type === 'warning' ? 'text-orange-900' :
                          rec.type === 'success' ? 'text-green-900' :
                          'text-blue-900'
                        }`}>
                          {rec.title}
                        </h4>
                        <p className={`text-sm mt-1 ${
                          rec.type === 'critical' ? 'text-red-700' :
                          rec.type === 'warning' ? 'text-orange-700' :
                          rec.type === 'success' ? 'text-green-700' :
                          'text-blue-700'
                        }`}>
                          {rec.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {isLoading && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-purple-700 font-medium">Analisando padrões financeiros...</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PredictiveAICoach;
