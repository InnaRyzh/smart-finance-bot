import React from 'react';
import { Transaction, TransactionType } from '../types';
import { getCategoryEmoji, getCategoryColor } from '../utils/categoryEmojis';
import { hapticLight } from '../utils/haptic';

interface TransactionListProps {
  transactions: Transaction[];
  onTransactionClick: (transaction: Transaction) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, onTransactionClick }) => {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-10 text-zinc-500">
        <p>Список пуст.</p>
        <p className="text-sm mt-2">Напиши что-нибудь в чат, например:<br/>"Миша 200 долларов"</p>
      </div>
    );
  }

  // Группировка по датам
  const grouped = transactions.reduce((acc, tx) => {
    const date = tx.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(tx);
    return acc;
  }, {} as Record<string, Transaction[]>);

  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div className="space-y-6 pb-24">
      {sortedDates.map(date => (
        <div key={date}>
          <h3 className="text-zinc-500 text-xs font-semibold mb-3 ml-1 sticky top-0 bg-[#18181b] py-2 z-10 opacity-90 backdrop-blur-sm">
            {new Date(date).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h3>
          <div className="space-y-3">
            {grouped[date].map(tx => (
              <div 
                key={tx.id} 
                onClick={() => {
                  hapticLight();
                  onTransactionClick(tx);
                }}
                className="bg-zinc-800/60 active:bg-zinc-700/80 backdrop-blur-sm rounded-2xl p-4 flex justify-between items-center transition-colors cursor-pointer border border-zinc-700/30 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  {/* Smart Emoji для категории */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${getCategoryColor(tx.category, tx.type === TransactionType.INCOME ? 'income' : 'expense')}`}>
                    {getCategoryEmoji(tx.category)}
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="font-medium text-white text-[15px]">{tx.category}</span>
                    <span className="text-xs text-zinc-400 max-w-[150px] truncate">{tx.description}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className={`font-bold text-[15px] ${tx.type === TransactionType.INCOME ? 'text-emerald-400' : 'text-white'}`}>
                    {tx.type === TransactionType.INCOME ? '+' : ''} {Math.round(tx.amount)} ₴
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
  );
};