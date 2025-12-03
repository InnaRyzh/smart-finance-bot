import { GoogleGenAI, Type } from "@google/genai";
import { ParsedTransactionData, TransactionType } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
Ты — умный финансовый ассистент, встроенный в Telegram-бот. Твоя задача — парсить сообщения пользователя о доходах и расходах.
Основная валюта пользователя: UAH (Гривна). Дополнительная: USD (Доллар).

Контекст пользователя:
- Если упоминается "Мама" или "маме" — это ВСЕГДА расход (категория: "Семья" или "Переводы").
- Если упоминается "Дядя Вова" — это ВСЕГДА расход (категория: "Семья" или "Помощь").
- "Миша" часто присылает деньги (доход), если не указано иное.
- "Коммуналка" — это расход (категория: "Квартира").

Правила:
1. Определи тип транзакции (INCOME или EXPENSE).
2. Выдели сумму.
3. Определи валюту (UAH или USD). Если валюта не указана, используй UAH.
4. Придумай короткую, понятную категорию (Еда, Такси, Работа, Квартира, Семья и т.д.).
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