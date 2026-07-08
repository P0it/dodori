import { Text, View } from 'react-native';
import { color } from '@/theme/tokens';
import { TopBar } from '@/components/TopBar';
import { Meta } from '@/components/Meta';

type Props = { title: string; note?: string; back?: boolean };

/** M0 라우트 골격용 자리 표시 화면 — 각 마일스톤에서 목업 기준 구현으로 교체 */
export function PlaceholderScreen({ title, note, back = true }: Props) {
  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <TopBar title={title} onBack={back} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Text style={{ color: color.white, fontWeight: '700', fontSize: 18 }}>{title}</Text>
        {note ? <Meta>{note}</Meta> : null}
      </View>
    </View>
  );
}
