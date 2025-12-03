import { Transaction } from '../types';

const STORAGE_KEY = 'smart_finance_transactions_v1';
const RATE_KEY = 'smart_finance_usd_rate';

export const getTransactions = (): Transaction[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Ошибка чтения данных", e);
    return [];
  }
};

export const saveTransaction = (transaction: Transaction): Transaction[] => {
  const current = getTransactions();
  const updated = [transaction, ...current];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const updateTransaction = (updatedTx: Transaction): Transaction[] => {
  const current = getTransactions();
  const updated = current.map(tx => tx.id === updatedTx.id ? updatedTx : tx);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const deleteTransaction = (id: string): Transaction[] => {
  const current = getTransactions();
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