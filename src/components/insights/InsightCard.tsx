
import React from 'react';
import { Insight } from './InsightAnalyzer';

interface InsightCardProps {
  insight: Insight;
}

const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
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

  return (
    <div className={`rounded-xl p-4 border-2 ${getInsightColor(insight.type)} transition-all duration-300 hover:shadow-lg hover:scale-[1.01]`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{insight.icon}</span>
        <div className="flex-1">
          <h4 className="font-bold text-sm mb-2 leading-tight">{insight.title}</h4>
          <p className="text-xs leading-relaxed opacity-90">{insight.message}</p>
        </div>
      </div>
    </div>
  );
};

export default InsightCard;
