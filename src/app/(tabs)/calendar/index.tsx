import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { color, typeface } from '@/theme/tokens';
import { monthCells, addMonths, monthLabel } from '@/lib/calendar';
import { monthKey as toMonthKey, todayKST, isReleased, toKSTDate } from '@/lib/date';
import { occurrenceInMonth } from '@/lib/anniversaries';
import { holidayMapForMonth } from '@/lib/holidays';
import { useMonthEvents } from '@/api/events';
import { useMonthTracks, useAllTracks } from '@/api/tracks';
import { useAnniversaries } from '@/api/anniversaries';
import { useCoupleProfiles } from '@/api/couple';
import { useHolidayExtras } from '@/api/holidays';
import { useSession } from '@/api/auth';
import { FilterChip } from '@/components/FilterChip';
import { OwnerDot } from '@/components/OwnerDot';
import { MonthGrid, type DayMarks } from '@/components/calendar/MonthGrid';
import { DayAgenda } from '@/components/calendar/DayAgenda';

type Filter = 'us' | 'me' | 'partner';

/** 캘린더 탭 — 월간 뷰 (목업 17·20) */
export default function Calendar() {
  const [month, setMonth] = useState(() => toMonthKey(todayKST()));
  const [filter, setFilter] = useState<Filter>('us');
  const [selected, setSelected] = useState(() => todayKST());

  const session = useSession();
  const uid = session.data?.user.id;
  const events = useMonthEvents(month);
  const tracks = useMonthTracks(month);
  const allTracks = useAllTracks(); // 어젠다의 "다음 일정" 한 줄 — 달을 넘어간 트랙도 봐야 한다
  const annivs = useAnniversaries();
  const profiles = useCoupleProfiles(); // Realtime은 루트 useCoupleRealtime이 담당 (§7.5)

  const cells = useMemo(() => monthCells(month), [month]);

  const holidayExtras = useHolidayExtras(); // 임시공휴일·선거일 (없으면 계산값만으로 동작)
  const holidays = useMemo(
    () => holidayMapForMonth(month, holidayExtras.data ?? {}),
    [month, holidayExtras.data],
  );

  const marks = useMemo(() => {
    const map: Record<string, DayMarks> = {};
    const at = (d: string) => (map[d] ??= {});

    for (const [date, name] of Object.entries(holidays)) at(date).holidayLabel = name;

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
  }, [holidays, tracks.data, annivs.data, events.data, month, filter, uid]);

  const lbl = monthLabel(month);
  const partnerName = profiles.data?.partner?.nickname || '상대';
  const myName = profiles.data?.me?.nickname || '나';

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
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
                style={{ fontFamily: typeface, fontWeight: '800', fontSize: 26, letterSpacing: -0.5, color: color.white }}
              >
                {lbl.month}
              </Text>
              <Text style={{ fontFamily: typeface, fontWeight: '500', fontSize: 15, color: color.sub }}>{lbl.year}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <NavBtn dir="prev" onPress={() => setMonth((m) => addMonths(m, -1))} />
              <Pressable
                onPress={() => setMonth(toMonthKey(todayKST()))}
                style={navBtnStyle({ wide: true })}
              >
                <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 12, color: color.white }}>오늘</Text>
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

      <View style={{ flex: 1, marginTop: 8 }}>
        <MonthGrid cells={cells} marks={marks} selected={selected} onSelectDay={setSelected} />
      </View>

      <View style={{ height: '34%', borderTopWidth: 1, borderTopColor: color.surface2 }}>
        <DayAgenda
          date={selected}
          events={(events.data ?? []).filter(
            (e) => e.starts_at && toKSTDate(new Date(e.starts_at)) === selected,
          )}
          tracks={(tracks.data ?? []).filter((t) => t.date === selected)}
          annivs={(annivs.data ?? []).filter(
            (a) => occurrenceInMonth(a.date, a.repeatYearly, month) === selected,
          )}
          uid={uid}
          allTracks={allTracks.data ?? []}
          allAnnivs={annivs.data ?? []}
        />
      </View>
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
