# 🗄️ Настройка Supabase для облачного хранения данных

## Зачем нужен Supabase?

Supabase заменяет localStorage на облачное хранилище, что дает:
- ✅ Синхронизацию данных между устройствами
- ✅ Резервное копирование в облаке
- ✅ Безопасное хранение данных
- ✅ Офлайн режим (localStorage как fallback)

## Шаг 1: Создание проекта Supabase

1. Зайди на [supabase.com](https://supabase.com)
2. Создай аккаунт или войди
3. Нажми **"New Project"**
4. Заполни данные:
   - **Name:** `smart-finance-bot`
   - **Database Password:** придумай надежный пароль (сохрани его!)
   - **Region:** выбери ближайший
5. Нажми **"Create new project"**
6. Подожди пока проект создастся (2-3 минуты)

## Шаг 2: Создание таблицы

1. В проекте Supabase открой **SQL Editor**
2. Выполни этот SQL запрос:

```sql
-- Создание таблицы транзакций
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  original_amount NUMERIC,
  original_currency TEXT,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индекс для быстрого поиска по user_id
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);

-- Индекс для сортировки по дате
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);

-- Row Level Security (RLS) - пользователи видят только свои данные
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Политика безопасности: пользователи могут читать только свои транзакции
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (user_id = current_setting('app.user_id', true));

-- Политика безопасности: пользователи могут создавать только свои транзакции
CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (user_id = current_setting('app.user_id', true));

-- Политика безопасности: пользователи могут обновлять только свои транзакции
CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  USING (user_id = current_setting('app.user_id', true));

-- Политика безопасности: пользователи могут удалять только свои транзакции
CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  USING (user_id = current_setting('app.user_id', true));
```

3. Нажми **"Run"** (или F5)

## Шаг 3: Получение ключей API

1. В проекте Supabase открой **Settings** → **API**
2. Скопируй:
   - **Project URL** (например: `https://xxxxx.supabase.co`)
   - **anon/public key** (длинная строка)

## Шаг 4: Настройка переменных в Railway

1. Открой проект на Railway
2. Перейди в **Variables**
3. Добавь две новые переменные:
   - **Key:** `SUPABASE_URL`
     **Value:** твой Project URL из Supabase
   - **Key:** `SUPABASE_ANON_KEY`
     **Value:** твой anon/public key из Supabase
4. Сохрани изменения

Railway автоматически пересоберет проект.

## Шаг 5: Проверка работы

1. Открой бота в Telegram
2. Добавь транзакцию
3. Проверь в Supabase:
   - **Table Editor** → таблица `transactions`
   - Должна появиться новая запись

## Важно:

- **Без Supabase:** приложение работает с localStorage (данные только локально)
- **С Supabase:** данные синхронизируются между устройствами
- **Офлайн режим:** если Supabase недоступен, используется localStorage

## Миграция существующих данных:

Если у тебя уже есть данные в localStorage:
1. Открой DevTools → Application → Local Storage
2. Скопируй значение `smart_finance_transactions_v1`
3. После настройки Supabase, добавь транзакции через бота (они автоматически попадут в Supabase)

