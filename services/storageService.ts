import { Transaction } from '../types';
import { 
  getTransactionsFromSupabase, 
  saveTransactionToSupabase, 
  updateTransactionInSupabase, 
  deleteTransactionFromSupabase 
} from './supabaseService';

const STORAGE_KEY = 'smart_finance_transactions_v1';
const RATE_KEY = 'smart_finance_usd_rate';

// Гибридное хранилище: Supabase (если доступен) + localStorage (fallback)
const useSupabase = () => {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
};

export const getTransactions = async (): Promise<Transaction[]> => {
  if (useSupabase()) {
    try {
      const supabaseData = await getTransactionsFromSupabase();
      if (supabaseData.length > 0) {
        // Синхронизируем с localStorage для офлайн доступа
        localStorage.setItem(STORAGE_KEY, JSON.stringify(supabaseData));
        return supabaseData;
      }
    } catch (error) {
      console.warn('Ошибка загрузки из Supabase, используем localStorage:', error);
    }
  }

  // Fallback на localStorage
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Ошибка чтения данных", e);
    return [];
  }
};

export const saveTransaction = async (transaction: Transaction): Promise<Transaction[]> => {
  // Сохраняем в Supabase если доступен
  if (useSupabase()) {
    await saveTransactionToSupabase(transaction);
  }

  // Всегда сохраняем в localStorage для офлайн доступа
  const current = await getTransactions();
  const updated = [transaction, ...current];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const updateTransaction = async (updatedTx: Transaction): Promise<Transaction[]> => {
  // Обновляем в Supabase если доступен
  if (useSupabase()) {
    await updateTransactionInSupabase(updatedTx);
  }

  // Обновляем в localStorage
  const current = await getTransactions();
  const updated = current.map(tx => tx.id === updatedTx.id ? updatedTx : tx);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const deleteTransaction = async (id: string): Promise<Transaction[]> => {
  // Удаляем из Supabase если доступен
  if (useSupabase()) {
    await deleteTransactionFromSupabase(id);
  }

  // Удаляем из localStorage
  const current = await getTransactions();
  const updated = current.filter(t => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const getUsdRate = (): number => {
  const rate = localStorage.getItem(RATE_KEY);
  return rate ? parseFloat(rate) : 41.5; // Значение по умолчанию
};

export const setUsdRate = (rate: number) => {
  localStorage.setItem(RATE_KEY, rate.toString());
};