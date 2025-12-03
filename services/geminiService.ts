import { GoogleGenAI, Type } from "@google/genai";
import { ParsedTransactionData, TransactionType, Transaction } from '../types';

// Получаем API ключ из переменных окружения
const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';

if (!apiKey) {
  console.error('⚠️ GEMINI_API_KEY не установлен! Проверь переменные окружения в Railway.');
}

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

/**
 * Получить список существующих категорий из транзакций
 * Это помогает AI использовать уже существующие категории вместо создания новых
 */
const getExistingCategories = (transactions: Transaction[]): string[] => {
  const categories = new Set<string>();
  transactions.forEach(tx => {
    if (tx.category) {
      categories.add(tx.category.toLowerCase().trim());
    }
  });
  return Array.from(categories).sort();
};

const SYSTEM_INSTRUCTION = `
Ты — умный финансовый ассистент, встроенный в Telegram-бот. Твоя задача — парсить сообщения пользователя о доходах и расходах.
Основная валюта пользователя: UAH (Гривна). Дополнительная: USD (Доллар).

КРИТИЧЕСКИ ВАЖНО - Правила определения типа транзакции:

РАСХОД (EXPENSE) ТОЛЬКО для:
1. "Мама" или "маме" — ВСЕГДА расход (категория: "Семья" или "Переводы").
2. "Дядя Вова" — ВСЕГДА расход (категория: "Семья" или "Помощь").
3. Покупки, услуги, еда, такси, коммуналка и другие расходы (если явно указано что это покупка/услуга).

ДОХОД (INCOME) для:
1. ВСЕ остальные имена людей (Миша, Саша, Оля, Иван, Петр и любые другие имена) — ВСЕГДА доход.
2. Если в сообщении упоминается имя человека (кроме "Мама" и "Дядя Вова") и сумма — это ВСЕГДА доход.
3. Зарплата, переводы от людей (кроме Мамы и Дяди Вовы).

Правила определения типа:
- Если имя человека И это НЕ "Мама" и НЕ "Дядя Вова" → INCOME (доход).
- Если "Мама" или "Дядя Вова" → EXPENSE (расход).
- Если покупка/услуга/коммуналка (без упоминания имени) → EXPENSE (расход).
- Если явно указано "отдал", "потратил", "заплатил" → EXPENSE (расход).

Правила парсинга:
1. Определи тип транзакции (INCOME или EXPENSE) по правилам выше.
2. Выдели сумму.
3. Определи валюту (UAH или USD). Если валюта не указана, используй UAH.
4. Придумай короткую, понятную категорию (Еда, Такси, Работа, Квартира, Семья, Переводы и т.д.).
5. Создай описание транзакции на основе текста.
6. Определи дату. Если дата не указана, используй "сегодня" (текущую дату). Верни дату в формате ISO 8601 (YYYY-MM-DD).

Сегодняшняя дата: ${new Date().toISOString().split('T')[0]}.
`;

export const parseTransactionFromText = async (
  text: string, 
  existingTransactions: Transaction[] = []
): Promise<ParsedTransactionData | null> => {
  if (!ai) {
    throw new Error('API ключ не настроен. Проверь переменную GEMINI_API_KEY в Railway Variables.');
  }

  try {
    // Получаем существующие категории для умной категоризации
    const existingCategories = getExistingCategories(existingTransactions);
    const categoriesContext = existingCategories.length > 0 
      ? `\n\nСУЩЕСТВУЮЩИЕ КАТЕГОРИИ (используй их если подходят): ${existingCategories.join(', ')}\nВАЖНО: Старайся использовать существующие категории вместо создания новых. Это обеспечит консистентность данных.`
      : '';

    const enhancedInstruction = SYSTEM_INSTRUCTION + categoriesContext;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: text,
      config: {
        systemInstruction: enhancedInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER, description: "Сумма транзакции" },
            currency: { type: Type.STRING, enum: ["UAH", "USD"], description: "Валюта транзакции" },
            category: { type: Type.STRING, description: "Категория (1-2 слова). Используй существующие категории если они подходят." },
            description: { type: Type.STRING, description: "Краткое описание" },
            date: { type: Type.STRING, description: "Дата транзакции YYYY-MM-DD" },
            type: { type: Type.STRING, enum: ["INCOME", "EXPENSE"], description: "Тип транзакции" }
          },
          required: ["amount", "currency", "category", "description", "date", "type"]
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text) as ParsedTransactionData;
      return data;
    }
    return null;

  } catch (error: any) {
    console.error("Ошибка при распознавании текста Gemini:", error);
    
    // Более информативные сообщения об ошибках
    if (error?.message?.includes('API_KEY') || error?.message?.includes('api key')) {
      throw new Error('API ключ неверный или не установлен. Проверь переменную GEMINI_API_KEY в Railway Variables.');
    }
    
    if (error?.message?.includes('quota') || error?.message?.includes('limit')) {
      throw new Error('Превышен лимит запросов к API. Попробуй позже.');
    }
    
    throw new Error("Не удалось распознать транзакцию. Попробуйте переформулировать.");
  }
};