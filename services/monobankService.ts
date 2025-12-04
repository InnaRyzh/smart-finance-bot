/**
 * Monobank API Service
 * Интеграция с Monobank для автоматического импорта транзакций
 */

import { Transaction, TransactionType } from '../types';

const MONOBANK_API_URL = 'https://api.monobank.ua';

export interface MonobankAccount {
  id: string;
  sendId: string;
  balance: number;
  creditLimit: number;
  type: string;
  currencyCode: number;
  cashbackType?: string;
  maskedPan?: string[];
  iban: string;
}

export interface MonobankTransaction {
  id: string;
  time: number; // Unix timestamp в секундах
  description: string;
  mcc: number; // Merchant Category Code
  hold: boolean;
  amount: number; // Сумма в копейках (для UAH) или центах (для USD)
  operationAmount: number; // Сумма операции
  currencyCode: number; // 980 = UAH, 840 = USD
  commissionRate: number;
  cashbackAmount?: number;
  balance: number;
  comment?: string;
}

/**
 * Получить список счетов пользователя
 */
export const getMonobankAccounts = async (token: string): Promise<MonobankAccount[]> => {
  try {
    const response = await fetch(`${MONOBANK_API_URL}/personal/client-info`, {
      headers: {
        'X-Token': token,
      },
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Неверный токен Monobank. Проверь токен в настройках.');
      }
      throw new Error(`Ошибка Monobank API: ${response.status}`);
    }

    const data = await response.json();
    return data.accounts || [];
  } catch (error: any) {
    console.error('Ошибка получения счетов Monobank:', error);
    throw error;
  }
};

/**
 * Получить транзакции за период
 * @param token - Personal token Monobank
 * @param accountId - ID счета
 * @param from - Дата начала (Unix timestamp в секундах)
 * @param to - Дата окончания (Unix timestamp в секундах)
 */
export const getMonobankTransactions = async (
  token: string,
  accountId: string,
  from: number,
  to: number
): Promise<MonobankTransaction[]> => {
  try {
    const response = await fetch(
      `${MONOBANK_API_URL}/personal/statement/${accountId}/${from}/${to}`,
      {
        headers: {
          'X-Token': token,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Неверный токен Monobank');
      }
      if (response.status === 429) {
        throw new Error('Превышен лимит запросов к Monobank API. Подожди немного.');
      }
      throw new Error(`Ошибка Monobank API: ${response.status}`);
    }

    const transactions = await response.json();
    return transactions || [];
  } catch (error: any) {
    console.error('Ошибка получения транзакций Monobank:', error);
    throw error;
  }
};

/**
 * Преобразовать транзакцию Monobank в формат приложения
 */
export const convertMonobankTransaction = (
  monoTx: MonobankTransaction,
  accountCurrency: number = 980
): Transaction => {
  // Коды валют: 980 = UAH, 840 = USD
  const currency = monoTx.currencyCode === 840 ? 'USD' : 'UAH';
  
  // Сумма в гривнах (Monobank возвращает в копейках/центах)
  const amountInUAH = currency === 'USD' 
    ? (monoTx.amount / 100) * 40 // Примерный курс, лучше использовать актуальный
    : monoTx.amount / 100; // UAH в копейках

  // Определяем тип транзакции
  // В Monobank отрицательные суммы = расходы, положительные = доходы
  const type = monoTx.amount < 0 ? TransactionType.EXPENSE : TransactionType.INCOME;
  const absoluteAmount = Math.abs(amountInUAH);

  // Определяем категорию по MCC коду
  const category = getCategoryByMCC(monoTx.mcc, type);

  // Форматируем дату
  const date = new Date(monoTx.time * 1000).toISOString().split('T')[0];

  return {
    id: `mono_${monoTx.id}`,
    amount: absoluteAmount,
    originalAmount: currency === 'USD' ? Math.abs(monoTx.amount / 100) : undefined,
    originalCurrency: currency === 'USD' ? 'USD' : undefined,
    category,
    description: monoTx.description || 'Транзакция Monobank',
    date,
    type,
  };
};

/**
 * Получить категорию по MCC коду
 */
const getCategoryByMCC = (mcc: number, type: TransactionType): string => {
  // MCC коды для разных категорий
  const mccMap: Record<number, string> = {
    // Еда и рестораны
    5812: 'Ресторан',
    5814: 'Ресторан',
    5811: 'Ресторан',
    5411: 'Продукты',
    5499: 'Продукты',
    
    // Транспорт
    4121: 'Такси',
    4111: 'Транспорт',
    4112: 'Транспорт',
    4131: 'Транспорт',
    
    // Здоровье
    5912: 'Аптека',
    8011: 'Врач',
    8021: 'Врач',
    8041: 'Врач',
    
    // Квартира и коммуналка
    4900: 'Коммуналка',
    4814: 'Коммуналка',
    
    // Магазины
    5311: 'Покупки',
    5310: 'Покупки',
    5331: 'Покупки',
    5399: 'Покупки',
    
    // Развлечения
    7832: 'Кино',
    7833: 'Кино',
    7911: 'Развлечения',
    7922: 'Развлечения',
    
    // Бензин
    5542: 'Бензин',
    5541: 'Бензин',
  };

  return mccMap[mcc] || (type === TransactionType.INCOME ? 'Доход' : 'Расход');
};

/**
 * Синхронизировать транзакции из Monobank
 * @param token - Personal token Monobank
 * @param days - Количество дней назад для синхронизации (по умолчанию 30)
 */
export const syncMonobankTransactions = async (
  token: string,
  days: number = 30
): Promise<Transaction[]> => {
  try {
    // Получаем список счетов
    const accounts = await getMonobankAccounts(token);
    
    if (accounts.length === 0) {
      throw new Error('Не найдено счетов в Monobank');
    }

    // Используем первый счет (можно расширить для работы с несколькими)
    const account = accounts[0];
    
    // Вычисляем период
    const to = Math.floor(Date.now() / 1000); // Текущее время в секундах
    const from = to - (days * 24 * 60 * 60); // N дней назад

    // Получаем транзакции
    const monoTransactions = await getMonobankTransactions(token, account.id, from, to);

    // Преобразуем в формат приложения
    const transactions = monoTransactions.map(tx => 
      convertMonobankTransaction(tx, account.currencyCode)
    );

    return transactions;
  } catch (error: any) {
    console.error('Ошибка синхронизации Monobank:', error);
    throw error;
  }
};

