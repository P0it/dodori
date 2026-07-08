import { Redirect } from 'expo-router';

/** 진입점 — M1에서 세션·커플 연결 여부에 따라 (auth)/(tabs) 분기 예정 */
export default function Index() {
  const hasSession = false; // TODO(M1): Supabase 세션 확인
  return <Redirect href={hasSession ? '/(tabs)/playlist' : '/(auth)/login'} />;
}
