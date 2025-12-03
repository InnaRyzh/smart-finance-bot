import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType } from '../types';

interface EditTransactionModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Transaction) => void;
  onDelete: (id: string) => void;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  transaction,
  isOpen,
  onClose,
  onSave,
  onDelete
}) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);

  useEffect(() => {
    if (transaction) {
      setAmount(Math.abs(transaction.amount).toString());
      setDescription(transaction.description);
      setCategory(transaction.category);
      setDate(transaction.date);
      setType(transaction.type);
    }
  }, [transaction]);

  const handleSave = () => {
    if (!transaction) return;
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return;

    // Если расход, делаем сумму отрицательной, если доход — положительной
    const finalAmount = type === TransactionType.EXPENSE ? -Math.abs(numAmount) : Math.abs(numAmount);

    onSave({
      ...transaction,
      amount: finalAmount,
      description,
      category,
      date,
      type
    });
    onClose();
  };

  const handleDelete = () => {
    if (transaction && confirm('Точно удалить эту запись?')) {
      onDelete(transaction.id);
      onClose();
    }
  };

  // Анимация открытия/закрытия через классы
  const overlayClass = isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none";
  const sheetClass = isOpen ? "translate-y-0" : "translate-y-full";

  if (!transaction) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-end justify-center transition-opacity duration-300 ${overlayClass}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className={`relative w-full max-w-md bg-[#1c1c1e] rounded-t-[2rem] p-6 shadow-2xl transition-transform duration-300 ease-out transform ${sheetClass} border-t border-zinc-700/50 pb-[env(safe-area-inset-bottom)]`}>
        
        {/* Handle bar (декоративная полоска) */}
        <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mb-6 opacity-50" />

        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-bold text-white">Редактирование</h2>
          <button onClick={onClose} className="p-1 bg-zinc-800 rounded-full text-zinc-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-5">
          {/* Тип операции (сегментированный контроль) */}
          <div className="bg-zinc-800 p-1 rounded-xl flex">
            <button 
              onClick={() => setType(TransactionType.INCOME)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${type === TransactionType.INCOME ? 'bg-[#1c1c1e] text-emerald-400 shadow-sm' : 'text-zinc-500'}`}
            >
              Доход
            </button>
            <button 
              onClick={() => setType(TransactionType.EXPENSE)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${type === TransactionType.EXPENSE ? 'bg-[#1c1c1e] text-rose-400 shadow-sm' : 'text-zinc-500'}`}
            >
              Расход
            </button>
          </div>

          {/* Сумма */}
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider ml-1">Сумма (₴)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-zinc-800 text-2xl font-bold text-white p-4 rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             {/* Дата */}
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider ml-1">Дата</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-zinc-800 text-white p-3 rounded-xl mt-1 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              />
            </div>
             {/* Категория */}
             <div>
              <label className="text-xs text-zinc-500 uppercase tracking-wider ml-1">Категория</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-zinc-800 text-white p-3 rounded-xl mt-1 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              />
            </div>
          </div>

          {/* Описание */}
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider ml-1">Описание</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-800 text-white p-3 rounded-xl mt-1 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
          </div>

          {/* Кнопки действий */}
          <div className="flex gap-3 pt-2">
            <button 
              onClick={handleDelete}
              className="flex-1 py-3.5 bg-rose-500/10 text-rose-400 font-semibold rounded-xl hover:bg-rose-500/20 active:scale-95 transition-all"
            >
              Удалить
            </button>
            <button 
              onClick={handleSave}
              className="flex-[2] py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-500 active:scale-95 transition-all shadow-lg shadow-blue-900/20"
            >
              Сохранить
            </button>
          </div>
        </div>
        
        {/* Spacer for iPhone home indicator */}
        <div className="h-6" />
      </div>
    </div>
  );
};