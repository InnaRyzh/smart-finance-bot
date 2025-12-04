import React, { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ParsedTransactionData, Transaction, TransactionType } from './types';
// parseTransactionFromText теперь вызывается через API endpoint на сервере
import { getTransactions, saveTransaction, deleteTransaction, updateTransaction, getUsdRate, setUsdRate } from './services/storageService';
import { TransactionList } from './components/TransactionList';
import { InputArea } from './components/InputArea';
import { ReportView } from './components/ReportView';
import { EditTransactionModal } from './components/EditTransactionModal';
import { MonobankSettings } from './components/MonobankSettings';
import { hapticLight, hapticMedium, hapticSuccess, hapticSelection } from './utils/haptic';

// Расширяем window для TypeScript
declare global {
  interface Window {
    Telegram: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        enableClosingConfirmation: () => void;
        initDataUnsafe: {
          user?: {
            first_name?: string;
            last_name?: string;
            username?: string;
            id?: number;
          };
        };
        themeParams: {
          bg_color?: string;
          text_color?: string;
        };
        isExpanded: boolean;
        HapticFeedback?: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
      };
    };
  }
}

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [usdRate, setUsdRateState] = useState(41.5);
  const [showSettings, setShowSettings] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'history' | 'report'>('history');

  // Modal State
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Инициализация Telegram Web App и данных
  useEffect(() => {
    // Инициализация Telegram
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand(); // Разворачиваем на весь экран
      
      try {
         window.Telegram.WebApp.enableClosingConfirmation();
      } catch (e) {
        console.log("Closing confirmation not supported on this version");
      }

      const user = window.Telegram.WebApp.initDataUnsafe?.user;
      if (user?.first_name) {
        setUserName(user.first_name);
      }
    }

    // Загружаем транзакции асинхронно
    getTransactions().then(data => {
      setTransactions(data);
    });
    setUsdRateState(getUsdRate());
  }, []);

  // Общий баланс за всё время
  const totalBalance = useMemo(() => {
    return transactions.reduce((acc, t) => {
      return t.type === TransactionType.INCOME ? acc + t.amount : acc - Math.abs(t.amount);
    }, 0);
  }, [transactions]);

  // Доходы и расходы за всё время
  const { totalIncome, totalExpense } = useMemo(() => {
    return transactions.reduce((acc, t) => {
      if (t.type === TransactionType.INCOME) {
        acc.totalIncome += t.amount;
      } else {
        acc.totalExpense += Math.abs(t.amount);
      }
      return acc;
    }, { totalIncome: 0, totalExpense: 0 });
  }, [transactions]);

  const handleSendText = async (text: string) => {
    setLoading(true);
    try {
      // Используем API endpoint на сервере для парсинга (ключ берется с сервера)
      const response = await fetch('/api/parse-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          existingTransactions: transactions,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка при распознавании транзакции');
      }

      const parsedData: ParsedTransactionData | null = await response.json();

      if (parsedData) {
        // Конвертация валют
        let finalAmount = parsedData.amount;
        if (parsedData.currency === 'USD') {
          finalAmount = parsedData.amount * usdRate;
        }

        const newTransaction: Transaction = {
          id: uuidv4(),
          amount: finalAmount,
          originalAmount: parsedData.currency === 'USD' ? parsedData.amount : undefined,
          originalCurrency: parsedData.currency,
          category: parsedData.category,
          description: parsedData.description,
          date: parsedData.date,
          type: parsedData.type
        };

        const updated = await saveTransaction(newTransaction);
        setTransactions(updated);
        hapticSuccess();
        setActiveTab('history');
      } else {
        alert("Не удалось распознать данные. Попробуй: 'Миша 200 долларов' или 'Мама перевод'.");
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Ошибка. Проверьте интернет или API ключ.");
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionClick = (tx: Transaction) => {
    hapticLight();
    setEditingTransaction(tx);
    setIsEditModalOpen(true);
  };

  const handleUpdateTransaction = async (updatedTx: Transaction) => {
    const updated = await updateTransaction(updatedTx);
    setTransactions(updated);
  };

  const handleDeleteTransaction = async (id: string) => {
    hapticMedium();
    const updated = await deleteTransaction(id);
    setTransactions(updated);
  };

  const handleRateChange = (newRate: string) => {
    const r = parseFloat(newRate);
    if (!isNaN(r) && r > 0) {
      setUsdRateState(r);
      setUsdRate(r);
    }
  };

  return (
    <div className="min-h-screen bg-[#18181b] text-white font-sans w-full mx-auto relative overflow-hidden flex flex-col">
      
      {/* Header */}
      <header className="px-4 py-3 bg-[#18181b] z-10 sticky top-0 border-b border-zinc-800/50 backdrop-blur-md bg-opacity-80">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              {userName ? `Привет, ${userName} 👋` : 'Мои Финансы'}
            </h1>
          </div>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 bg-zinc-800/50 rounded-full text-zinc-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-zinc-800/80 p-1 rounded-2xl">
          <button 
            onClick={() => {
              hapticSelection();
              setActiveTab('history');
            }}
            className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${
              activeTab === 'history' 
                ? 'bg-zinc-600 text-white shadow-md transform scale-[1.02]' 
                : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            Операции
          </button>
          <button 
            onClick={() => {
              hapticSelection();
              setActiveTab('report');
            }}
            className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${
              activeTab === 'report' 
                ? 'bg-zinc-600 text-white shadow-md transform scale-[1.02]' 
                : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            Отчёт
          </button>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="space-y-3">
          <div className="bg-zinc-800/80 backdrop-blur-sm mx-4 mt-2 mb-4 p-4 rounded-2xl space-y-3 animate-fade-in-down border border-zinc-700/50 shadow-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-300">Курс USD/UAH:</span>
              <input 
                type="number" 
                value={usdRate}
                onChange={(e) => handleRateChange(e.target.value)}
                className="bg-zinc-900 text-white rounded-lg px-3 py-1.5 w-24 text-right focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <div className="text-[10px] text-zinc-500 pt-2 border-t border-zinc-700/50">
               Настройки сохраняются только локально.
            </div>
          </div>

          {/* Monobank Settings */}
          <MonobankSettings 
            onSync={async (newTransactions) => {
              // Добавляем новые транзакции (избегаем дубликатов)
              const current = await getTransactions();
              const existingIds = new Set(current.map(t => t.id));
              const uniqueNew = newTransactions.filter(t => !existingIds.has(t.id));
              
              if (uniqueNew.length > 0) {
                // Сохраняем каждую новую транзакцию
                for (const tx of uniqueNew) {
                  await saveTransaction(tx);
                }
                // Обновляем список
                const updated = await getTransactions();
                setTransactions(updated);
                hapticSuccess();
              }
            }}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-32 space-y-4 scroll-smooth">
        
        {activeTab === 'history' ? (
          <div className="animate-fade-in space-y-4">
             {/* Total Balance Big Card */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl shadow-xl shadow-blue-900/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
              <p className="text-blue-100 text-sm font-medium mb-1 relative z-10">Текущий баланс</p>
              <h2 className="text-4xl font-bold text-white tracking-tight relative z-10 mb-3">
                {new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(totalBalance)}
              </h2>
              <div className="flex gap-4 text-sm relative z-10">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-200">↓</span>
                  <span className="text-blue-100 font-medium">
                    {new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(totalIncome)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-rose-200">↑</span>
                  <span className="text-blue-100 font-medium">
                    {new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 }).format(totalExpense)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="pt-2">
               <TransactionList transactions={transactions} onTransactionClick={handleTransactionClick} />
            </div>
          </div>
        ) : (
          <ReportView transactions={transactions} />
        )}

      </div>

      {/* Input Area (Visible only in History tab) */}
      <div className={`transition-transform duration-300 ease-in-out ${activeTab === 'history' ? 'translate-y-0' : 'translate-y-[150%]'}`}>
         <InputArea onSend={handleSendText} isLoading={loading} />
      </div>

      {/* Edit Modal */}
      <EditTransactionModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        transaction={editingTransaction}
        onSave={handleUpdateTransaction}
        onDelete={handleDeleteTransaction}
      />
      
    </div>
  );
};

export default App;