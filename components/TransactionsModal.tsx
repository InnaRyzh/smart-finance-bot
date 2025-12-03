import React from 'react';
import { Transaction, TransactionType } from '../types';
import { getCategoryEmoji, getCategoryColor } from '../utils/categoryEmojis';

interface TransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  type: TransactionType;
  title: string;
}

export const TransactionsModal: React.FC<TransactionsModalProps> = ({ 
  isOpen, 
  onClose, 
  transactions, 
  type,
  title 
}) => {
  if (!isOpen) return null;

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(val);
  };

  // Фильтруем транзакции по типу и группируем по дате
  const filtered = transactions.filter(t => t.type === type);
  
  const grouped = filtered.reduce((acc, tx) => {
    const date = tx.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(tx);
    return acc;
  }, {} as Record<string, Transaction[]>);

  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const total = filtered.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-[#18181b] w-full max-h-[85vh] rounded-t-3xl shadow-2xl border-t border-zinc-800 overflow-hidden flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-4 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-[#18181b] z-10">
          <div>
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Всего: <span className={`font-semibold ${type === TransactionType.INCOME ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatMoney(total)}
              </span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {sortedDates.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <p>Нет транзакций</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedDates.map(date => (
                <div key={date}>
                  <h3 className="text-zinc-500 text-xs font-semibold mb-3 ml-1 sticky top-0 bg-[#18181b] py-2 z-10">
                    {new Date(date).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </h3>
                  <div className="space-y-2">
                    {grouped[date].map(tx => (
                      <div 
                        key={tx.id}
                        className="bg-zinc-800/60 backdrop-blur-sm rounded-xl p-3 flex justify-between items-center border border-zinc-700/30"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${getCategoryColor(tx.category, tx.type === TransactionType.INCOME ? 'income' : 'expense')}`}>
                            {getCategoryEmoji(tx.category)}
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="font-medium text-white text-sm">{tx.category}</span>
                            <span className="text-xs text-zinc-400 truncate">{tx.description}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end ml-2">
                          <span className={`font-bold text-sm ${
                            tx.type === TransactionType.INCOME ? 'text-emerald-400' : 'text-white'
                          }`}>
                            {tx.type === TransactionType.INCOME ? '+' : ''}{formatMoney(tx.amount)}
                          </span>
                          {tx.originalCurrency === 'USD' && (
                            <span className="text-[10px] text-zinc-500 font-medium">
                              ${tx.originalAmount}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

