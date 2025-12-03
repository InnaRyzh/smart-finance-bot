/**
 * Supabase Service для хранения данных
 * Заменяет localStorage на облачное хранилище
 */

import { Transaction } from '../types';

// Эти значения будут установлены через переменные окружения Railway
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const SUPABASE_TABLE = 'transactions';

// Проверка доступности Supabase
const isSupabaseAvailable = () => {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
};

/**
 * Получить user_id из Telegram WebApp
 */
const getUserId = (): string | null => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
    return `tg_${window.Telegram.WebApp.initDataUnsafe.user.id}`;
  }
  return null;
};

/**
 * Получить все транзакции пользователя
 */
export const getTransactionsFromSupabase = async (): Promise<Transaction[]> => {
  if (!isSupabaseAvailable()) {
    console.warn('Supabase не настроен, используем localStorage');
    return [];
  }

  const userId = getUserId();
  if (!userId) {
    console.warn('Не удалось получить user_id из Telegram');
    return [];
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?user_id=eq.${userId}&select=*&order=date.desc`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status}`);
    }

    const data = await response.json();
    return data.map((item: any) => ({
      id: item.id,
      amount: item.amount,
      originalAmount: item.original_amount,
      originalCurrency: item.original_currency,
      category: item.category,
      description: item.description,
      date: item.date,
      type: item.type as 'INCOME' | 'EXPENSE',
    }));
  } catch (error) {
    console.error('Ошибка загрузки из Supabase:', error);
    return [];
  }
};

/**
 * Сохранить транзакцию в Supabase
 */
export const saveTransactionToSupabase = async (transaction: Transaction): Promise<boolean> => {
  if (!isSupabaseAvailable()) {
    console.warn('Supabase не настроен');
    return false;
  }

  const userId = getUserId();
  if (!userId) {
    console.warn('Не удалось получить user_id из Telegram');
    return false;
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        id: transaction.id,
        user_id: userId,
        amount: transaction.amount,
        original_amount: transaction.originalAmount,
        original_currency: transaction.originalCurrency,
        category: transaction.category,
        description: transaction.description,
        date: transaction.date,
        type: transaction.type,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Ошибка сохранения в Supabase:', error);
    return false;
  }
};

/**
 * Обновить транзакцию в Supabase
 */
export const updateTransactionInSupabase = async (transaction: Transaction): Promise<boolean> => {
  if (!isSupabaseAvailable()) {
    return false;
  }

  const userId = getUserId();
  if (!userId) {
    return false;
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?id=eq.${transaction.id}&user_id=eq.${userId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          amount: transaction.amount,
          original_amount: transaction.originalAmount,
          original_currency: transaction.originalCurrency,
          category: transaction.category,
          description: transaction.description,
          date: transaction.date,
          type: transaction.type,
        }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Ошибка обновления в Supabase:', error);
    return false;
  }
};

/**
 * Удалить транзакцию из Supabase
 */
export const deleteTransactionFromSupabase = async (id: string): Promise<boolean> => {
  if (!isSupabaseAvailable()) {
    return false;
  }

  const userId = getUserId();
  if (!userId) {
    return false;
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?id=eq.${id}&user_id=eq.${userId}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Ошибка удаления из Supabase:', error);
    return false;
  }
};

