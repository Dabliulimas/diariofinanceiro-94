
import React from 'react';

interface SummaryCardProps {
  title: string;
  value: number;
  icon: string;
  color: 'green' | 'red' | 'blue' | 'purple';
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon, color }) => {
  const colorClasses = {
    green: 'text-green-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600'
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-2 sm:p-3 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate mb-1">{title}</p>
          <p className={`text-sm sm:text-lg md:text-2xl font-bold ${colorClasses[color]} truncate`}>
            {formatCurrency(value)}
          </p>
        </div>
        <span className="text-base sm:text-lg md:text-3xl ml-1 sm:ml-2 flex-shrink-0">{icon}</span>
      </div>
    </div>
  );
};

export default SummaryCard;
