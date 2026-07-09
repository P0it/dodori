import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { color, role } from '@/theme/tokens';
import { monthCells, addMonths, monthLabel } from '@/lib/calendar';
import { monthKey as toMonthKey, todayKST, isReleased, toKSTDate } from '@/lib/date';
import { occurrenceInMonth } from '@/lib/anniversaries';
import { useMonthEvents } from '@/api/events';
import { useMonthTracks } from '@/api/tracks';
import { useAnniversaries } from '@/api/anniversaries';
import { useCoupleProfiles } from '@/api/couple';
import { useSession } from '@/api/auth';
import { FilterChip } from '@/components/FilterChip';
import { OwnerDot } from '@/components/OwnerDot';
import { StarGlyph } from '@/components/glyphs';
import { Meta } from '@/components/Meta';
import { MonthGrid, type DayMarks } from '@/components/calendar/MonthGrid';
import { DaySheet } from '@/components/calendar/DaySheet';

type Filter = 'us' | 'me' | 'partner';

/** 캘린더 탭 — 월간 뷰 (목업 17·20) */
export default function Calendar() {
  const [month, setMonth] = useState(() => toMonthKey(todayKST()));
  const [filter, setFilter] = useState<Filter>('us');
  const [selected, setSelected] = useState<string | null>(null);

  const session = useSession();
  const uid = session.data?.user.id;
  const events = useMonthEvents(month);
  const tracks = useMonthTracks(month);
  const annivs = useAnniversaries();
  const profiles = useCoupleProfiles(); // Realtime은 루트 useCoupleRealtime이 담당 (§7.5)

  const cells = useMemo(() => monthCells(month), [month]);

  const marks = useMemo(() => {
    const map: Record<string, DayMarks> = {};
    const at = (d: string) => (map[d] ??= {});

    for (const t of tracks.data ?? []) {
      const m = at(t.date);
      if (isReleased(t.date)) {
        if (t.coverThumbUrl) m.releasedThumb = t.coverThumbUrl;
        else m.releasedNoPhoto = true;
      } else {
        m.upcoming = true;
      }
    }
    for (const a of annivs.data ?? []) {
      const occ = occurrenceInMonth(a.date, a.repeatYearly, month);
      if (occ) at(occ).annivLabel = a.label;
    }
    for (const e of events.data ?? []) {
      if (!e.starts_at || !e.owner_id) continue;
      const day = toKSTDate(new Date(e.starts_at));
      const who: 'me' | 'partner' = e.owner_id === uid ? 'me' : 'partner';
      if (filter !== 'us' && filter !== who) continue;
      const m = at(day);
      if (e.title_hidden && who === 'partner') {
        m.busy = true;
      } else {
        m.owners = [...new Set([...(m.owners ?? []), who])];
      }
    }
    return map;
  }, [tracks.data, annivs.data, events.data, month, filter, uid]);

  const isEmpty =
    !tracks.data?.length &&
    !events.data?.length &&
    !(annivs.data ?? []).some((a) => occurrenceInMonth(a.date, a.repeatYearly, month));

  const lbl = monthLabel(month);
  const partnerName = profiles.data?.partner?.nickname || '상대';
  const myName = profiles.data?.me?.nickname || '나';

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* 헤더 */}
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
              <Text
                style={{ fontWeight: '800', fontSize: 26, letterSpacing: -0.5, color: color.white }}
              >
                {lbl.month}
              </Text>
              <Text style={{ fontWeight: '500', fontSize: 15, color: color.sub }}>{lbl.year}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <NavBtn dir="prev" onPress={() => setMonth((m) => addMonths(m, -1))} />
              <Pressable
                onPress={() => setMonth(toMonthKey(todayKST()))}
                style={navBtnStyle({ wide: true })}
              >
                <Text style={{ fontWeight: '700', fontSize: 12, color: color.white }}>오늘</Text>
              </Pressable>
              <NavBtn dir="next" onPress={() => setMonth((m) => addMonths(m, 1))} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <FilterChip selected={filter === 'us'} onPress={() => setFilter('us')}>
              우리
            </FilterChip>
            <FilterChip
              selected={filter === 'me'}
              onPress={() => setFilter('me')}
              leading={<OwnerDot who="me" size={7} />}
            >
              {myName}
            </FilterChip>
            <FilterChip
              selected={filter === 'partner'}
              onPress={() => setFilter('partner')}
              leading={<OwnerDot who="partner" size={7} />}
            >
              {partnerName}
            </FilterChip>
          </View>
        </View>

        <View style={{ marginTop: 8 }}>
          <MonthGrid cells={cells} marks={marks} onSelectDay={setSelected} />
        </View>

        {isEmpty ? <EmptyMonth /> : <Legend partnerName={partnerName} myName={myName} />}
      </ScrollView>

      <DaySheet
        date={selected}
        onClose={() => setSelected(null)}
        events={(events.data ?? []).filter(
          (e) => e.starts_at && toKSTDate(new Date(e.starts_at)) === selected,
        )}
        tracks={(tracks.data ?? []).filter((t) => t.date === selected)}
        annivs={(annivs.data ?? []).filter(
          (a) => occurrenceInMonth(a.date, a.repeatYearly, month) === selected,
        )}
        uid={uid}
      />
    </View>
  );
}

function NavBtn({ dir, onPress }: { dir: 'prev' | 'next'; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={navBtnStyle({})}>
      <Svg
        width={18}
        height={18}
        viewBox="0 0 24 24"
        fill="none"
        style={{ transform: [{ rotate: dir === 'next' ? '180deg' : '0deg' }] }}
      >
        <Path
          d="M15 5l-7 7 7 7"
          stroke={color.sub}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Pressable>
  );
}
const navBtnStyle =
  ({ wide }: { wide?: boolean }) =>
  ({ pressed }: { pressed: boolean }) => ({
    height: 30,
    width: wide ? undefined : 30,
    paddingHorizontal: wide ? 12 : 0,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    opacity: pressed ? 0.7 : 1,
  });

function Legend({ myName, partnerName }: { myName: string; partnerName: string }) {
  const items: [React.ReactNode, string][] = [
    [<OwnerDot key="a" who="me" size={8} />, myName],
    [<OwnerDot key="b" who="partner" size={8} />, partnerName],
    [
      <View
        key="c"
        style={{
          width: 10,
          height: 10,
          borderRadius: 3,
          borderWidth: 1.5,
          borderStyle: 'dashed',
          borderColor: role.me,
        }}
      />,
      '예정 데이트',
    ],
    [<StarGlyph key="d" size={10} />, '기념일'],
    [
      <View
        key="e"
        style={{ width: 12, height: 5, borderRadius: 2, backgroundColor: 'rgba(232,104,143,0.5)' }}
      />,
      '바쁨(숨김)',
    ],
  ];
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        columnGap: 16,
        rowGap: 8,
        paddingHorizontal: 20,
        paddingTop: 14,
      }}
    >
      {items.map(([g, t], i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {g}
          <Text style={{ fontSize: 11, color: color.sub }}>{t}</Text>
        </View>
      ))}
    </View>
  );
}

/** 빈 달 상태 (목업 20) */
function EmptyMonth() {
  const router = useRouter();
  return (
    <View style={{ alignItems: 'center', paddingHorizontal: 40, paddingTop: 24 }}>
      <Text style={{ fontWeight: '700', fontSize: 16, color: color.white }}>
        이번 달은 아직 비어 있어요
      </Text>
      <Meta style={{ marginTop: 8, lineHeight: 20, textAlign: 'center' }}>
        다가오는 날 중 하루를 골라 데이트를 계획해 보세요. 계획한 트랙은 여기에 나타나요.
      </Meta>
      <Pressable
        onPress={() => router.push('/modals/create-track')}
        style={({ pressed }) => ({
          marginTop: 18,
          height: 44,
          paddingHorizontal: 22,
          borderRadius: 999,
          backgroundColor: role.me,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Text style={{ fontWeight: '700', fontSize: 14, color: color.onPrimary }}>
          데이트 계획하기
        </Text>
      </Pressable>
    </View>
  );
}
