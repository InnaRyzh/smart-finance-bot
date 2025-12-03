import React from 'react';

interface StatsCardProps {
  label: string;
  value: number;
  type?: 'neutral' | 'positive' | 'negative';
  onClick?: () => void;
}

export const StatsCard: React.FC<StatsCardProps> = ({ label, value, type = 'neutral', onClick }) => {
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(val);
  };

  const getTextColor = () => {
    switch (type) {
      case 'positive': return 'text-emerald-400';
      case 'negative': return 'text-rose-400';
      default: return 'text-white';
    }
  };

  return (
    <div 
      onClick={onClick}
      className={`bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50 flex flex-col items-start justify-center transition-all ${
        onClick ? 'cursor-pointer hover:bg-zinc-800/70 hover:border-zinc-600 active:scale-[0.98]' : ''
      }`}
    >
      <span className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-1">{label}</span>
      <span className={`text-xl font-bold ${getTextColor()}`}>{formatMoney(value)}</span>
    </div>
  );
};