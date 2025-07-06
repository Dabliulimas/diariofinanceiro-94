
import React, { useMemo, useEffect, useState } from 'react';
import { FinancialData } from '../hooks/useFinancialData';
import { InsightAnalyzer, MonthlyTotals, EmergencyReserve, FixedExpenses } from './insights/InsightAnalyzer';
import InsightCard from './insights/InsightCard';

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
  const [isAnimating, setIsAnimating] = useState(false);
  const analyzer = useMemo(() => new InsightAnalyzer(), []);

  const insights = useMemo(() => {
    const currentDate = new Date();
    const currentDay = currentDate.getDate();
    const isCurrentMonth = selectedYear === currentDate.getFullYear() && selectedMonth === currentDate.getMonth();
    
    const allInsights = [
      ...analyzer.analyzeNegativeBalance(data, selectedYear, selectedMonth),
      ...analyzer.analyzeSpendingBehavior(data, selectedYear, selectedMonth, currentDay),
      ...analyzer.predictMonthEnd(data, selectedYear, selectedMonth, monthlyTotals, currentDay, isCurrentMonth),
      ...analyzer.generatePersonalizedCoaching(monthlyTotals, emergencyReserve, fixedExpenses)
    ];
    
    return allInsights.sort((a, b) => b.priority - a.priority).slice(0, 6);
  }, [data, selectedYear, selectedMonth, monthlyTotals, emergencyReserve, fixedExpenses, analyzer]);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 300);
    return () => clearTimeout(timer);
  }, [insights]);

  if (insights.length === 0) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-6 border-2 border-green-200 shadow-md">
        <div className="text-center">
          <span className="text-2xl mb-2 block">🤖</span>
          <h3 className="text-lg font-bold text-green-800 mb-1">Coach IA Ativo</h3>
          <p className="text-green-700 text-sm">
            Continue registrando dados para receber insights personalizados em tempo real.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 mb-6 border-2 border-purple-200 shadow-lg transition-all duration-300 ${isAnimating ? 'scale-[1.01] shadow-xl' : ''}`}>
      <div className="text-center mb-4">
        <span className="text-2xl mb-2 block">🤖</span>
        <h3 className="text-lg font-bold text-purple-800 mb-1">Coach IA Preditivo</h3>
        <p className="text-xs text-purple-600 font-medium">
          Análise em Tempo Real • IA Adaptativa • Coaching Personalizado
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {insights.map((insight, index) => (
          <div
            key={index}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <InsightCard insight={insight} />
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t-2 border-purple-200">
        <div className="text-center text-xs text-purple-600 font-medium">
          IA Reativa • Atualização Automática • Previsões Comportamentais
        </div>
      </div>
    </div>
  );
};

export default PredictiveAICoach;
