import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware для парсинга JSON
app.use(express.json());

// API endpoint для парсинга транзакций (использует ключ с сервера)
app.post('/api/parse-transaction', async (req, res) => {
  try {
    const { text, existingTransactions } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Текст не предоставлен' });
    }

    // Импортируем функцию парсинга
    const { parseTransactionFromText } = await import('./dist/services/geminiService.js');
    
    // Парсим транзакцию (ключ берется из переменных окружения сервера)
    const result = await parseTransactionFromText(text, existingTransactions || []);
    
    res.json(result);
  } catch (error) {
    console.error('Ошибка парсинга транзакции:', error);
    res.status(500).json({ error: error.message || 'Ошибка при распознавании транзакции' });
  }
});

// Раздача статических файлов из папки dist
app.use(express.static(join(__dirname, 'dist')));

// SPA routing - все запросы на index.html
app.get('*', (req, res) => {
  try {
    const html = readFileSync(join(__dirname, 'dist', 'index.html'), 'utf-8');
    res.send(html);
  } catch (error) {
    res.status(500).send('Ошибка загрузки приложения');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`API ключ: ${process.env.GEMINI_API_KEY ? '✅ установлен' : '❌ не установлен'}`);
});


