import { ScrollView, Text, View } from 'react-native';
import { color, role } from '@/theme/tokens';
import { formatDday, todayKST } from '@/lib/date';
import { useAnniversaries } from '@/api/anniversaries';
import { TopBar } from '@/components/TopBar';
import { Meta } from '@/components/Meta';
import { Divider } from '@/components/Divider';
import { AnnivCover } from '@/components/AnnivCover';

/** Singles — 기념일 모음 (목업 09, anniversaries 뷰 §5) */
export default function Singles() {
  const annivs = useAnniversaries();
  const today = todayKST();
  const list = annivs.data ?? [];
  const released = list.filter((a) => !a.repeatYearly && a.date < today).length;
  const auto = list.filter((a) => a.type !== 'custom');
  const custom = list.filter((a) => a.type === 'custom');

  const stateOf = (a: (typeof list)[number]) => {
    if (!a.repeatYearly && a.date < today) return { t: '발매됨', c: role.me };
    if (a.nextDate === today) return { t: 'D-Day', c: role.anniv };
    if (a.repeatYearly && formatDday(a.nextDate).startsWith('D-'))
      return { t: formatDday(a.nextDate), c: role.anniv };
    if (!a.repeatYearly) return { t: formatDday(a.date), c: role.anniv };
    return { t: '매년', c: color.muted };
  };

  const bigOf = (label: string) => label.replace(/[^0-9]/g, '') || label.slice(0, 1);
  const smallOf = (label: string) =>
    /일$/.test(label) && /\d/.test(label) ? '일' : /주년$/.test(label) ? '주년' : /생일/.test(label) ? '생일' : undefined;

  const Row = ({ a }: { a: (typeof list)[number] }) => {
    const st = stateOf(a);
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10 }}>
        <AnnivCover size={56} big={bigOf(a.label)} small={smallOf(a.label)} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '600', fontSize: 15.5, color: color.white }}>{a.label}</Text>
          <Meta style={{ marginTop: 3, fontSize: 12.5 }}>
            {a.repeatYearly ? `매년 ${a.date.slice(5).replace('-', '.')}` : a.date.replaceAll('-', '.')}
          </Meta>
        </View>
        <Text style={{ fontWeight: '700', fontSize: 11.5, color: st.c }}>{st.t}</Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <TopBar title="Singles" />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={{ alignItems: 'center', paddingTop: 4 }}>
          <AnnivCover size={132} disc />
          <Text style={{ fontWeight: '800', fontSize: 22, color: color.white, marginTop: 14 }}>
            Singles
          </Text>
          <Meta style={{ marginTop: 5 }}>
            기념일 모음 · {list.length}곡{released ? ` · ${released} 발매됨` : ''}
          </Meta>
        </View>
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          {auto.map((a) => (
            <Row key={a.id} a={a} />
          ))}
          {custom.length > 0 && <Divider style={{ marginVertical: 10 }} />}
          {custom.map((a) => (
            <Row key={a.id} a={a} />
          ))}
          {list.length === 0 && <Meta style={{ paddingVertical: 12 }}>시작일을 입력하면 기념일이 자동으로 만들어져요</Meta>}
        </View>
      </ScrollView>
    </View>
  );
}
