
import React from 'react';

interface InsightCardProps {
  type: 'info' | 'warning' | 'critical' | 'success';
  icon: string;
  title: string;
  message: string;
}

const InsightCard: React.FC<InsightCardProps> = ({ type, icon, title, message }) => {
  const typeStyles = {
    info: {
      border: 'border-l-blue-500',
      bg: 'bg-blue-50',
      titleColor: 'text-blue-900',
      messageColor: 'text-blue-700'
    },
    warning: {
      border: 'border-l-orange-500',
      bg: 'bg-orange-50',
      titleColor: 'text-orange-900',
      messageColor: 'text-orange-700'
    },
    critical: {
      border: 'border-l-red-500',
      bg: 'bg-red-50',
      titleColor: 'text-red-900',
      messageColor: 'text-red-700'
    },
    success: {
      border: 'border-l-green-500',
      bg: 'bg-green-50',
      titleColor: 'text-green-900',
      messageColor: 'text-green-700'
    }
  };

  const style = typeStyles[type];

  return (
    <div className={`p-4 rounded-lg border-l-4 ${style.border} ${style.bg}`}>
      <div className="flex items-start space-x-3">
        <span className="text-xl">{icon}</span>
        <div className="flex-1">
          <h4 className={`font-semibold ${style.titleColor}`}>{title}</h4>
          <p className={`text-sm mt-1 ${style.messageColor}`}>{message}</p>
        </div>
      </div>
    </div>
  );
};

export default InsightCard;
