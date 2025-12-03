import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Загружаем переменные из .env файлов
    const env = loadEnv(mode, process.cwd(), '');
    
    // Для Railway: переменные окружения доступны через process.env во время сборки
    // Проверяем все возможные источники
    const geminiApiKey = 
        env.GEMINI_API_KEY || 
        env.VITE_GEMINI_API_KEY ||
        process.env.GEMINI_API_KEY || 
        process.env.VITE_GEMINI_API_KEY ||
        '';
    
    // Логирование для отладки
    console.log('🔍 [Vite Config] Проверка переменных окружения:');
    console.log('  Mode:', mode);
    console.log('  env.GEMINI_API_KEY:', env.GEMINI_API_KEY ? `✅ (${env.GEMINI_API_KEY.substring(0, 10)}...)` : '❌');
    console.log('  process.env.GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? `✅ (${process.env.GEMINI_API_KEY.substring(0, 10)}...)` : '❌');
    console.log('  Итоговый ключ:', geminiApiKey ? `✅ установлен (длина: ${geminiApiKey.length})` : '❌ ПУСТОЙ!');
    
    if (!geminiApiKey && mode === 'production') {
        console.error('⚠️ ВНИМАНИЕ: GEMINI_API_KEY не найден! Проверь переменные в Railway.');
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
