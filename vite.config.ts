import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // Для Railway: используем process.env напрямую, если переменная не найдена в .env файле
    const geminiApiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
    
    // Логирование для отладки (только в production build)
    if (mode === 'production') {
        console.log('🔍 Проверка переменных окружения:');
        console.log('  GEMINI_API_KEY из env:', env.GEMINI_API_KEY ? '✅ установлен' : '❌ не найден');
        console.log('  GEMINI_API_KEY из process.env:', process.env.GEMINI_API_KEY ? '✅ установлен' : '❌ не найден');
        console.log('  Итоговый ключ:', geminiApiKey ? `✅ установлен (длина: ${geminiApiKey.length})` : '❌ ПУСТОЙ!');
    }
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(geminiApiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey),
        'process.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL || ''),
        'process.env.SUPABASE_ANON_KEY': JSON.stringify(process.env.SUPABASE_ANON_KEY || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
