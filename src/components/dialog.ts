import { Alert, Platform } from 'react-native';

/**
 * 확인·알림 대화상자 — 웹에서도 뜨게 한다.
 *
 * react-native-web의 `Alert.alert`은 **빈 함수**(`static alert() {}`)라 웹에서는 팝업이
 * 뜨지 않고 확인 콜백도 영영 오지 않는다 — 삭제 같은 기능이 "아무 반응 없음"으로 죽는다.
 * 그래서 웹에서는 브라우저 기본 대화상자로 내려간다.
 *
 * RN import가 있어 lib/(순수 함수)가 아니라 여기에 둔다.
 */
export function confirmDialog(
  title: string,
  message?: string,
  confirmText = '확인',
): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(message ? `${title}\n\n${message}` : title));
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: '취소', style: 'cancel', onPress: () => resolve(false) },
        { text: confirmText, style: 'destructive', onPress: () => resolve(true) },
      ],
      // 바깥을 눌러 닫아도 반드시 resolve — 안 그러면 프로미스가 매달린 채 남는다
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

/**
 * 여러 선택지 중 하나 (길게 눌러 뜨는 액션 시트). 고른 항목의 인덱스, 취소면 -1.
 * 웹에는 다중 선택 대화상자가 없어 위에서부터 예/아니오로 물어본다 —
 * 선택지가 하나뿐인 흔한 경우엔 confirm 한 번과 똑같다.
 */
export function chooseDialog(
  title: string,
  choices: { label: string; destructive?: boolean }[],
): Promise<number> {
  if (Platform.OS === 'web') {
    const picked = choices.findIndex((c) => window.confirm(`${title}\n\n${c.label}`));
    return Promise.resolve(picked);
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      undefined,
      [
        { text: '취소', style: 'cancel' as const, onPress: () => resolve(-1) },
        ...choices.map((c, i) => ({
          text: c.label,
          style: c.destructive ? ('destructive' as const) : ('default' as const),
          onPress: () => resolve(i),
        })),
      ],
      { cancelable: true, onDismiss: () => resolve(-1) },
    );
  });
}

/** 단순 알림 (버튼 하나) */
export function alertDialog(title: string, message?: string) {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}
