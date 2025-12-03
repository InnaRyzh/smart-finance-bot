# 🚀 Добавление переменных Supabase в Railway - ПРЯМО СЕЙЧАС

## Твои данные Supabase:

**SUPABASE_URL:**
```
https://mnosdnedxevakoxjtvwg.supabase.co
```

**SUPABASE_ANON_KEY:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ub3NkbmVkeGV2YWtveGp0dndnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzUzODksImV4cCI6MjA4MDM1MTM4OX0.-VQQtwqMJsgucwgqS3uQFOjU0RxrdK-NlZ3hJaCskyk
```

## Пошаговая инструкция:

### Шаг 1: Открой Railway
1. Зайди на [railway.app](https://railway.app)
2. Открой проект `smart-finance-bot`

### Шаг 2: Добавь переменные
1. Перейди в **Variables** (вкладка вверху)
2. Нажми **"New Variable"**

### Шаг 3: Добавь первую переменную
- **Key:** `SUPABASE_URL`
- **Value:** `https://mnosdnedxevakoxjtvwg.supabase.co`
- Нажми **"Add"**

### Шаг 4: Добавь вторую переменную
- **Key:** `SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ub3NkbmVkeGV2YWtveGp0dndnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzUzODksImV4cCI6MjA4MDM1MTM4OX0.-VQQtwqMJsgucwgqS3uQFOjU0RxrdK-NlZ3hJaCskyk`
- Нажми **"Add"**

### Шаг 5: Проверь результат
После добавления переменных Railway автоматически пересоберет проект.

В списке переменных должно быть:
- ✅ `GEMINI_API_KEY` (уже есть)
- ✅ `SUPABASE_URL` (только что добавил)
- ✅ `SUPABASE_ANON_KEY` (только что добавил)

## Важно: Создай таблицу в Supabase!

Если еще не создал таблицу:
1. Открой [supabase.com](https://supabase.com) → твой проект
2. Перейди в **SQL Editor**
3. Скопируй SQL из файла `SUPABASE_SETUP.md` (строки 8-71)
4. Вставь в SQL Editor и нажми **Run**

## После настройки:

1. Railway пересоберет проект (2-3 минуты)
2. Открой бота в Telegram
3. Добавь транзакцию
4. Проверь в Supabase: **Table Editor** → таблица `transactions` → должна появиться запись

Готово! 🎉

