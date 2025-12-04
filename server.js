import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware для парсинга JSON
app.use(express.json());

// --- Логика Gemini (прямо здесь, чтобы работать на сервере) ---

// Получаем ключ
const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const SYSTEM_INSTRUCTION = `
Ты — умный финансовый ассистент, встроенный в Telegram-бот. Твоя задача — парсить сообщения пользователя о доходах и расходах.
Основная валюта пользователя: UAH (Гривна). Дополнительная: USD (Доллар).

КРИТИЧЕСКИ ВАЖНО - Правила определения типа транзакции:

РАСХОД (EXPENSE) ТОЛЬКО для:
1. "Мама" или "маме" — ВСЕГДА расход (категория: "Семья" или "Переводы").
2. "Дядя Вова" — ВСЕГДА расход (категория: "Семья" или "Помощь").
3. Покупки, услуги, еда, такси, коммуналка и другие расходы.

ДОХОД (INCOME) для:
1. ВСЕ остальные имена людей (Миша, Саша, Оля, Иван и др.) — ВСЕГДА доход.
2. Если имя человека и сумма — это доход.
3. Зарплата, переводы от людей (кроме Мамы и Дяди Вовы).

Правила парсинга:
1. Определи тип (INCOME/EXPENSE).
2. Выдели сумму.
3. Определи валюту (UAH или USD).
4. Придумай категорию (или выбери из существующих).
5. Создай описание.
6. Определи дату (сегодня: ${new Date().toISOString().split('T')[0]}).
`;

// --- Логика Monobank (прямо здесь, чтобы работать на сервере) ---

const MONOBANK_API_URL = 'https://api.monobank.ua';

// Получить категорию по MCC коду
const getCategoryByMCC = (mcc, type) => {
  const mccMap = {
    5812: 'Ресторан', 5814: 'Ресторан', 5811: 'Ресторан',
    5411: 'Продукты', 5499: 'Продукты',
    4121: 'Такси', 4111: 'Транспорт', 4112: 'Транспорт',
    5912: 'Аптека', 8011: 'Врач', 8021: 'Врач',
    4900: 'Коммуналка', 4814: 'Коммуналка',
    5311: 'Покупки', 5310: 'Покупки',
    7832: 'Кино', 7911: 'Развлечения',
    5542: 'Бензин', 5541: 'Бензин',
  };
  return mccMap[mcc] || (type === 'INCOME' ? 'Доход' : 'Расход');
};

// Преобразовать транзакцию Monobank в формат приложения
const convertMonobankTransaction = (monoTx) => {
  const currency = monoTx.currencyCode === 840 ? 'USD' : 'UAH';
  const amountInUAH = currency === 'USD' 
    ? (monoTx.amount / 100) * 40 // Примерный курс
    : monoTx.amount / 100;
  
  const type = monoTx.amount < 0 ? 'EXPENSE' : 'INCOME';
  const absoluteAmount = Math.abs(amountInUAH);
  const category = getCategoryByMCC(monoTx.mcc, type);
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

// API endpoint для синхронизации Monobank
app.post('/api/sync-monobank', async (req, res) => {
  console.log('📥 Получен запрос на синхронизацию Monobank');
  
  try {
    const { token, days = 30 } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Токен Monobank не предоставлен' });
    }

    // Получаем список счетов
    const accountsResponse = await fetch(`${MONOBANK_API_URL}/personal/client-info`, {
      headers: { 'X-Token': token },
    });

    if (!accountsResponse.ok) {
      if (accountsResponse.status === 403) {
        throw new Error('Неверный токен Monobank. Проверь токен в настройках.');
      }
      throw new Error(`Ошибка Monobank API: ${accountsResponse.status}`);
    }

    const accountsData = await accountsResponse.json();
    const accounts = accountsData.accounts || [];
    
    if (accounts.length === 0) {
      throw new Error('Не найдено счетов в Monobank');
    }

    // Используем первый счет
    const account = accounts[0];
    
    // Вычисляем период
    const to = Math.floor(Date.now() / 1000);
    const from = to - (days * 24 * 60 * 60);

    console.log(`📊 Загрузка транзакций за период: ${new Date(from * 1000).toLocaleDateString()} - ${new Date(to * 1000).toLocaleDateString()}`);

    // Получаем транзакции
    const transactionsResponse = await fetch(
      `${MONOBANK_API_URL}/personal/statement/${account.id}/${from}/${to}`,
      { headers: { 'X-Token': token } }
    );

    if (!transactionsResponse.ok) {
      if (transactionsResponse.status === 403) {
        throw new Error('Неверный токен Monobank');
      }
      if (transactionsResponse.status === 429) {
        throw new Error('Превышен лимит запросов к Monobank API. Подожди немного.');
      }
      throw new Error(`Ошибка Monobank API: ${transactionsResponse.status}`);
    }

    const monoTransactions = await transactionsResponse.json();

    // Преобразуем в формат приложения
    const transactions = monoTransactions.map(tx => convertMonobankTransaction(tx));

    console.log(`✅ Синхронизировано ${transactions.length} транзакций из Monobank`);
    
    res.json({
      success: true,
      transactions,
      count: transactions.length,
    });
  } catch (error) {
    console.error('❌ Ошибка синхронизации Monobank:', error);
    res.status(500).json({ error: error.message || 'Ошибка синхронизации Monobank' });
  }
});

// API endpoint для парсинга
app.post('/api/parse-transaction', async (req, res) => {
  console.log('📥 Получен запрос на парсинг транзакции');
  
  try {
    if (!ai) {
      console.error('❌ API ключ не установлен');
      return res.status(500).json({ error: 'API ключ не настроен на сервере' });
    }

    const { text, existingTransactions } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Текст не предоставлен' });
    }

    // Формируем список категорий
    const categories = new Set();
    if (existingTransactions && Array.isArray(existingTransactions)) {
      existingTransactions.forEach(tx => {
        if (tx.category) categories.add(tx.category);
      });
    }
    const categoriesStr = Array.from(categories).join(', ');
    
    const instructionWithCategories = SYSTEM_INSTRUCTION + 
      (categoriesStr ? `\nСУЩЕСТВУЮЩИЕ КАТЕГОРИИ: ${categoriesStr}` : '');

    console.log(`🤖 Отправка запроса в Gemini: "${text}"`);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: text,
      config: {
        systemInstruction: instructionWithCategories,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER, description: "Сумма" },
            currency: { type: Type.STRING, enum: ["UAH", "USD"], description: "Валюта" },
            category: { type: Type.STRING, description: "Категория" },
            description: { type: Type.STRING, description: "Описание" },
            date: { type: Type.STRING, description: "Дата YYYY-MM-DD" },
            type: { type: Type.STRING, enum: ["INCOME", "EXPENSE"], description: "Тип" }
          },
          required: ["amount", "currency", "category", "description", "date", "type"]
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      console.log('✅ Успешный ответ от Gemini:', data);
      return res.json(data);
    }
    
    throw new Error('Пустой ответ от AI');

  } catch (error) {
    console.error('❌ Ошибка при обработке:', error);
    res.status(500).json({ error: 'Ошибка при распознавании транзакции: ' + error.message });
  }
});

// Раздача статики
app.use(express.static(join(__dirname, 'dist')));

app.get('*', (req, res) => {
  try {
    const html = readFileSync(join(__dirname, 'dist', 'index.html'), 'utf-8');
    res.send(html);
  } catch (error) {
    res.status(500).send('Ошибка загрузки приложения');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=========================================`);
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`🔑 API Key статус: ${apiKey ? '✅ УСТАНОВЛЕН' : '❌ НЕ НАЙДЕН'}`);
  if (apiKey) console.log(`🔑 Длина ключа: ${apiKey.length} символов`);
  console.log(`=========================================`);
});
