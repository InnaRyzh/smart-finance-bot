import { GoogleGenAI, Type } from "@google/genai";
import { ParsedTransactionData, TransactionType } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

export const parseTransactionFromText = async (text: string): Promise<ParsedTransactionData | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: text,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER, description: "Сумма транзакции" },
            currency: { type: Type.STRING, enum: ["UAH", "USD"], description: "Валюта транзакции" },
            category: { type: Type.STRING, description: "Категория (1-2 слова)" },
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

  } catch (error) {
    console.error("Ошибка при распознавании текста Gemini:", error);
    throw new Error("Не удалось распознать транзакцию. Попробуйте переформулировать.");
  }
};