
import React from 'react';

interface MonthNavigationProps {
  selectedMonth: number;
  setSelectedMonth: (month: number) => void;
}

const MonthNavigation: React.FC<MonthNavigationProps> = ({
  selectedMonth,
  setSelectedMonth
}) => {
  const monthAbbr = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-2 sm:p-3 md:p-4 mb-4 sm:mb-6 md:mb-8">
      <div className="grid grid-cols-6 lg:grid-cols-12 gap-1 sm:gap-2">
        {monthAbbr.map((month, index) => (
          <button
            key={index}
            onClick={() => setSelectedMonth(index)}
            className={`py-1.5 sm:py-2 px-1 sm:px-2 md:px-3 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              selectedMonth === index
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div>{month}</div>
            <div className="text-xs opacity-75">{index + 1}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MonthNavigation;
