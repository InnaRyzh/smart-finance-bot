import React, { useState } from 'react';
import { hapticLight, hapticSuccess, hapticError } from '../utils/haptic';

interface MonobankSettingsProps {
  onSync: (transactions: any[]) => void;
}

export const MonobankSettings: React.FC<MonobankSettingsProps> = ({ onSync }) => {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  // Загружаем сохраненный токен
  React.useEffect(() => {
    const savedToken = localStorage.getItem('monobank_token');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  const handleSaveToken = () => {
    if (!token.trim()) {
      setError('Введи токен Monobank');
      hapticError();
      return;
    }

    localStorage.setItem('monobank_token', token.trim());
    setSuccess('Токен сохранен');
    setError(null);
    hapticSuccess();
    
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleSync = async () => {
    if (!token.trim()) {
      setError('Сначала сохрани токен Monobank');
      hapticError();
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);
    hapticLight();

    try {
      const response = await fetch('/api/sync-monobank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token.trim(),
          days,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка синхронизации');
      }

      const data = await response.json();
      const { transactions, count } = data;

      if (transactions && transactions.length > 0) {
        onSync(transactions);
        setSuccess(`Синхронизировано ${count} транзакций!`);
        hapticSuccess();
      } else {
        setSuccess('Новых транзакций не найдено');
        hapticSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка синхронизации');
      hapticError();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-zinc-800/80 backdrop-blur-sm mx-4 mt-2 mb-4 p-4 rounded-2xl space-y-4 animate-fade-in-down border border-zinc-700/50 shadow-lg">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🏦</span>
        <h3 className="text-base font-semibold text-white">Monobank</h3>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">Personal Token</label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Вставь токен из приложения Monobank"
            className="w-full bg-zinc-900 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <p className="text-[10px] text-zinc-500 mt-1">
            Получи токен в приложении Monobank: Настройки → Персональный токен
          </p>
        </div>

        <div>
          <label className="text-xs text-zinc-400 mb-1 block">Период синхронизации (дней)</label>
          <input
            type="number"
            value={days}
            onChange={(e) => setDays(Math.max(1, Math.min(365, parseInt(e.target.value) || 30)))}
            min={1}
            max={365}
            className="w-full bg-zinc-900 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs p-2 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs p-2 rounded-lg">
            {success}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSaveToken}
            disabled={!token.trim()}
            className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white text-sm py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Сохранить токен
          </button>
          <button
            onClick={handleSync}
            disabled={!token.trim() || isLoading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Синхронизация...
              </>
            ) : (
              'Синхронизировать'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

