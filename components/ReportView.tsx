import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { ChartSection } from './ChartSection';
import { StatsCard } from './StatsCard';
import { TransactionsModal } from './TransactionsModal';
import { hapticLight } from '../utils/haptic';
import { getCategoryEmoji } from '../utils/categoryEmojis';

interface ReportViewProps {
  transactions: Transaction[];
}

export const ReportView: React.FC<ReportViewProps> = ({ transactions }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Фильтрация транзакций по выбранному месяцу
  const monthlyData = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });
  }, [transactions, currentDate]);

  // Статистика за месяц
  const stats = useMemo(() => {
    return monthlyData.reduce((acc, t) => {
      if (t.type === TransactionType.INCOME) {
        acc.income += t.amount;
      } else {
        acc.expense += Math.abs(t.amount);
      }
      return acc;
    }, { income: 0, expense: 0 });
  }, [monthlyData]);

  // Разбивка по категориям для списка
  const categories = useMemo(() => {
    const expenseTxs = monthlyData.filter(t => t.type === TransactionType.EXPENSE);
    const categoryMap = expenseTxs.reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
      return acc;
    }, {});

    return Object.entries(categoryMap)
      .map(([name, amount]) => ({ name, amount: Number(amount) }))
      .sort((a, b) => b.amount - a.amount);
  }, [monthlyData]);

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="pb-24 animate-fade-in">
      {/* Навигация по месяцам */}
      <div className="flex items-center justify-between bg-zinc-800 p-4 rounded-xl mb-6 shadow-sm">
        <button onClick={() => changeMonth(-1)} className="p-2 text-zinc-400 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div className="text-center">
          <h2 className="text-lg font-bold text-white capitalize">
            {currentDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
          </h2>
          <p className="text-xs text-zinc-500 font-medium">
            Баланс периода: <span className={stats.income - stats.expense >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {stats.income - stats.expense > 0 ? '+' : ''}{formatMoney(stats.income - stats.expense)}
            </span>
          </p>
        </div>
        <button onClick={() => changeMonth(1)} className="p-2 text-zinc-400 hover:text-white transition-colors" disabled={new Date() < new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)}>
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* Карточки */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatsCard 
          label="Доход" 
          value={stats.income} 
          type="positive" 
          onClick={() => {
            hapticLight();
            setShowIncomeModal(true);
          }}
        />
        <StatsCard 
          label="Расход" 
          value={stats.expense} 
          type="negative"
          onClick={() => {
            hapticLight();
            setShowExpenseModal(true);
          }}
        />
      </div>

      {/* График */}
      {stats.expense > 0 ? (
        <div className="mb-6">
          <ChartSection transactions={monthlyData} />
        </div>
      ) : (
        <div className="text-center py-8 text-zinc-600 bg-zinc-800/30 rounded-xl mb-6 border border-zinc-800">
          Нет расходов за этот месяц
        </div>
      )}

      {/* Список категорий */}
      <div className="space-y-3">
        <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider ml-1">Расходы по категориям</h3>
        {categories.map((cat) => (
          <div key={cat.name} className="flex items-center justify-between bg-zinc-800/80 p-3 rounded-lg border border-zinc-700/50">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-blue-500 rounded-full opacity-60"></div>
              <span className="font-medium text-zinc-200">{cat.name}</span>
            </div>
            <span className="font-bold text-white">{formatMoney(cat.amount)}</span>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="text-zinc-500 text-sm text-center py-4">Категории появятся, когда будут расходы.</p>
        )}
      </div>

      {/* Модальные окна */}
      <TransactionsModal
        isOpen={showIncomeModal}
        onClose={() => setShowIncomeModal(false)}
        transactions={monthlyData}
        type={TransactionType.INCOME}
        title="Доходы"
      />
      <TransactionsModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        transactions={monthlyData}
        type={TransactionType.EXPENSE}
        title="Расходы"
      />
    </div>
  );
};