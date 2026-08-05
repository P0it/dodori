import { useMemo, useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { color, toEventColor, typeface } from '@/theme/tokens';
import { monthCells, addMonths, monthLabel } from '@/lib/calendar';
import { monthKey as toMonthKey, todayKST } from '@/lib/date';
import { assignLanes, daySpan, eventDayRange, spanSegments } from '@/lib/span';
import { occurrenceInMonth } from '@/lib/anniversaries';
import { holidayMapForMonth } from '@/lib/holidays';
import { useMonthEvents } from '@/api/events';
import { useMonthTracks } from '@/api/tracks';
import { useAnniversaries } from '@/api/anniversaries';
import { useCoupleProfiles } from '@/api/couple';
import { useHolidayExtras } from '@/api/holidays';
import { useSession } from '@/api/auth';
import { MonthGrid, type DayMarks, type DaySpan } from '@/components/calendar/MonthGrid';
import { DayAgenda } from '@/components/calendar/DayAgenda';

/** 캘린더 탭 — 월간 뷰 (목업 17·20) */
export default function Calendar() {
  const router = useRouter();
  const [month, setMonth] = useState(() => toMonthKey(todayKST()));
  const [selected, setSelected] = useState(() => todayKST());

  const session = useSession();
  const uid = session.data?.user.id;
  const events = useMonthEvents(month);
  const tracks = useMonthTracks(month);
  const annivs = useAnniversaries();
  const profiles = useCoupleProfiles(); // Realtime은 루트 useCoupleRealtime이 담당 (§7.5)

  const cells = useMemo(() => monthCells(month), [month]);

  const holidayExtras = useHolidayExtras(); // 임시공휴일·선거일 (없으면 계산값만으로 동작)
  const holidays = useMemo(
    () => holidayMapForMonth(month, holidayExtras.data ?? {}),
    [month, holidayExtras.data],
  );

  /** 표시할 일정 — 셀 칩과 막대가 같은 목록을 본다 */
  const visibleEvents = useMemo(
    () => (events.data ?? []).filter((e) => !!e.starts_at),
    [events.data],
  );

  /** 여러 날 일정 → 주별 막대. 이르게 시작하고 긴 것부터 위 칸을 잡는다 */
  const spans = useMemo((): DaySpan[] => {
    const gridDates = cells.map((c) => c.date);
    const multi = visibleEvents
      .map((e) => ({ e, ...eventDayRange(e.starts_at!, e.ends_at) }))
      .filter((x) => daySpan(x.from, x.to) > 1)
      .sort((a, b) => a.from.localeCompare(b.from) || daySpan(b.from, b.to) - daySpan(a.from, a.to));

    return assignLanes(
      multi.map((x) => ({
        key: x.e.id!,
        segments: spanSegments(gridDates, x.from, x.to),
        value: x.e,
      })),
    ).map((p) => ({
      key: p.key,
      title: p.value.title ?? '일정',
      color: toEventColor(p.value.color),
      segment: p.segment,
      lane: p.lane,
    }));
  }, [cells, visibleEvents]);

  const marks = useMemo(() => {
    const map: Record<string, DayMarks> = {};
    const at = (d: string) => (map[d] ??= {});

    for (const [date, name] of Object.entries(holidays)) at(date).holidayLabel = name;

    // released 여부로 나누지 않는다 — 예정 데이트에 사진을 올려도 커버가 안 보이던 원인이었다.
    // 사진이 없으면 그리드가 seed 그라디언트 자켓으로 채운다.
    for (const t of tracks.data ?? []) {
      at(t.date).date = { id: t.id, title: t.title, thumb: t.coverThumbUrl };
    }
    for (const a of annivs.data ?? []) {
      const occ = occurrenceInMonth(a.date, a.repeatYearly, month);
      if (occ) at(occ).annivLabel = a.label;
    }
    // 하루짜리만 셀 안 칩으로 — 여러 날은 아래 spans에서 막대로 간다
    for (const e of visibleEvents) {
      const { from, to } = eventDayRange(e.starts_at!, e.ends_at);
      if (daySpan(from, to) > 1) continue;
      const m = at(from);
      m.events = [...(m.events ?? []), { title: e.title ?? '일정', color: toEventColor(e.color) }];
    }
    return map;
  }, [holidays, tracks.data, annivs.data, visibleEvents, month]);

  const lbl = monthLabel(month);
  const partnerName = profiles.data?.partner?.nickname || '상대';
  const myName = profiles.data?.me?.nickname || '나';

  // 그리드 좌우 스와이프로 달 넘기기 — 화살표는 작아서 조준이 필요하다.
  // 아젠다(세로 스크롤)와 싸우지 않게 그리드 영역에만 붙이고, 세로로 먼저 움직이면 제스처를 포기한다.
  const { width: screenW } = useWindowDimensions();
  const tx = useSharedValue(0);
  const gridStyle = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }] }));
  /**
   * 달 넘기기 — 새 달을 반대편에 세워두고 제자리로 밀어 넣는다.
   * 애니메이션 완료 콜백에서 넘기지 않는다: 콜백 안에서 tx에 다시 대입하면 Reanimated가
   * 직전 애니메이션을 취소로 보고 콜백을 한 번 더 불러 두 달씩 넘어갔다.
   * onEnd는 제스처당 정확히 한 번이므로 여기서 바로 커밋한다.
   */
  const goMonth = (delta: number) => {
    setMonth((m) => addMonths(m, delta));
    tx.value = delta > 0 ? screenW : -screenW;
    tx.value = withTiming(0, { duration: 200 });
  };
  const swipe = Gesture.Pan()
    .activeOffsetX([-14, 14])
    .failOffsetY([-14, 14])
    .onUpdate((e) => {
      tx.value = e.translationX;
    })
    .onEnd((e) => {
      // 충분히 끌었거나 빠르게 튕겼으면 넘긴다
      if (Math.abs(e.translationX) > screenW * 0.22 || Math.abs(e.velocityX) > 700) {
        runOnJS(goMonth)(e.translationX < 0 ? 1 : -1);
      } else {
        tx.value = withSpring(0, { damping: 20, stiffness: 220 });
      }
    });

  const profileOf = (id: string) => (id === uid ? profiles.data?.me : profiles.data?.partner);
  const nameOf = (id: string) => profileOf(id)?.nickname || (id === uid ? myName : partnerName);
  const avatarOf = (id: string) => profileOf(id)?.avatar_url ?? null;

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
        </View>

      <View style={{ flex: 1, marginTop: 8, overflow: 'hidden' }}>
        <GestureDetector gesture={swipe}>
          <Animated.View style={[{ flex: 1 }, gridStyle]}>
            <MonthGrid cells={cells} marks={marks} spans={spans} selected={selected} onSelectDay={setSelected} />
          </Animated.View>
        </GestureDetector>
      </View>

      <View style={{ height: '30%', borderTopWidth: 1, borderTopColor: color.surface2 }}>
        <DayAgenda
          date={selected}
          events={visibleEvents.filter((e) => {
            // 여러 날 일정은 걸친 모든 날의 아젠다에 뜬다 — 시작일에만 뜨면 여행 중엔 빈 날로 보인다
            const { from, to } = eventDayRange(e.starts_at!, e.ends_at);
            return from <= selected && selected <= to;
          })}
          tracks={(tracks.data ?? []).filter((t) => t.date === selected)}
          annivs={(annivs.data ?? []).filter(
            (a) => occurrenceInMonth(a.date, a.repeatYearly, month) === selected,
          )}
          name={(id) => nameOf(id)}
          avatarUrl={(id) => avatarOf(id)}
        />
      </View>

      {/* 선택일에 일정 등록 — 데이트 만들기는 라이브러리 탭의 일이라 여기선 갈래를 두지 않는다 */}
      <Pressable
        accessibilityLabel="일정 추가"
        onPress={() => router.push({ pathname: '/modals/add-event', params: { date: selected } })}
        style={({ pressed }) => ({
          position: 'absolute',
          right: 16,
          bottom: 16,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: color.accent,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.35,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path d="M12 5v14M5 12h14" stroke={color.onPrimary} strokeWidth={2.5} strokeLinecap="round" />
        </Svg>
      </Pressable>
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
