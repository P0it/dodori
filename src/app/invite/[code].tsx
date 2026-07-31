import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { color } from '@/theme/tokens';
import { savePendingInvite, useRefreshPendingInvite } from '@/api/pendingInvite';

/**
 * 초대 링크 진입점 — 웹은 https://<웹배포>/invite/CODE, 앱이 깔려 있으면 dodori://invite/CODE.
 * 코드만 보관하고 진입 가드(app/index.tsx)로 넘긴다 — 로그인 여부·커플 상태 분기는 가드가 안다.
 */
export default function InviteLink() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const refresh = useRefreshPendingInvite();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const c = (code ?? '').trim().toUpperCase();
    if (!c) {
      setSaved(true);
      return;
    }
    savePendingInvite(c).then(() => {
      refresh();
      setSaved(true);
    });
    // refresh는 매 렌더 새 함수라 의존성에 넣으면 루프가 된다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  if (!saved) {
    return (
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.bg }}
      >
        <ActivityIndicator color={color.accent} />
      </View>
    );
  }
  return <Redirect href="/" />;
}
