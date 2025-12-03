export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export interface Transaction {
  id: string;
  amount: number; // Всегда в гривне для хранения
  originalAmount?: number; // Сумма в оригинальной валюте
  originalCurrency?: 'UAH' | 'USD';
  category: string;
  description: string;
  date: string; // ISO string
  type: TransactionType;
}

export interface ParsedTransactionData {
  amount: number;
  currency: 'UAH' | 'USD';
  category: string;
  description: string;
  date: string;
  type: TransactionType;
}

export interface MonthlyStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}