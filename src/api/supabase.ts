import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from '@/types/database.types';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn('[supabase] EXPO_PUBLIC_SUPABASE_URL / ANON_KEY 미설정 — .env를 확인하세요');
}

export const supabase = createClient<Database>(url ?? 'http://localhost:54321', anonKey ?? '', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // 웹은 카카오 OAuth 리다이렉트로 돌아오므로 URL의 토큰을 파싱해야 한다 (네이티브는 idToken 교환)
    detectSessionInUrl: Platform.OS === 'web',
  },
});
