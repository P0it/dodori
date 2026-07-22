import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { color, role, roleBg, typeface } from '@/theme/tokens';
import type { DayCell } from '@/lib/calendar';
import { shortHolidayName } from '@/lib/holidays';
import { StarGlyph } from '@/components/glyphs';

/** 셀 하나에 표시할 마커 집합 — 화면(조합 계층)에서 만들어 내려준다 */
export interface DayMarks {
  /** released 트랙 썸네일 URL (§6.3 캘린더 전용 사이즈) */
  releasedThumb?: string | null;
  /** released인데 커버 없음 */
  releasedNoPhoto?: boolean;
  /** 예정 데이트(트랙) 제목 */
  upcomingTitle?: string;
  annivLabel?: string;
  /** 공휴일 이름 ('설날', '대체공휴일(광복절)' 등) */
  holidayLabel?: string;
  /** 개인 일정 — 시간순, 제목·역할 */
  events?: { title: string; who: 'me' | 'partner' }[];
}

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];

type Props = {
  cells: DayCell[];
  marks: Record<string, DayMarks>;
  selected: string;
  onSelectDay: (date: string) => void;
  /** 빈 달 데모용 흐림 처리 */
  dim?: boolean;
};

/** 월간 그리드 (목업 17 — 7열, 라이브러리 없이 자체 구현 §3). 부모가 준 높이를 주 단위 행이 균등하게 나눠 갖는다 */
export function MonthGrid({ cells, marks, selected, onSelectDay, dim }: Props) {
  const weeks: DayCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <View style={{ flex: 1, paddingHorizontal: 12, opacity: dim ? 0.35 : 1 }}>
      <View style={{ flexDirection: 'row' }}>
        {WEEK.map((w, i) => (
          <Text
            key={w}
            style={{
              flex: 1,
              textAlign: 'center',
              paddingVertical: 7,
              fontSize: 12,
              fontFamily: typeface, fontWeight: '600',
              color: i === 0 ? color.sunday : i === 6 ? color.saturday : color.muted,
            }}
          >
            {w}
          </Text>
        ))}
      </View>
      {weeks.map((week) => (
        <View key={week[0].date} style={{ flexDirection: 'row', flex: 1 }}>
          {week.map((cell) => (
            <DayCellView
              key={cell.date}
              cell={cell}
              m={cell.inMonth ? (marks[cell.date] ?? {}) : {}}
              selected={cell.inMonth && cell.date === selected}
              onPress={() => cell.inMonth && onSelectDay(cell.date)}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

function DayCellView({
  cell,
  m,
  selected,
  onPress,
}: {
  cell: DayCell;
  m: DayMarks;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        borderRadius: 7,
        overflow: 'hidden',
        padding: 5,
        backgroundColor: selected ? 'rgba(255,255,255,0.10)' : 'transparent',
      }}
    >
      {m.releasedThumb && (
        <>
          <Image
            source={m.releasedThumb}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 7 }}
            contentFit="cover"
          />
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 7,
              backgroundColor: 'rgba(0,0,0,0.35)',
            }}
          />
        </>
      )}
      {/* 날짜 숫자 */}
      <View
        style={{
          alignSelf: 'center',
          width: 24,
          height: 24,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: cell.isToday ? role.me : 'transparent',
        }}
      >
        <Text
          style={{
            fontSize: 14.5,
            fontWeight: cell.isToday || m.annivLabel || m.holidayLabel ? '700' : '500',
            color: !cell.inMonth
              ? '#4a4a4a'
              : cell.isToday
                ? color.bg
                : m.holidayLabel
                  ? color.holiday
                  : cell.weekday === 0
                    ? color.sunday
                    : cell.weekday === 6
                      ? color.saturday
                      : m.annivLabel
                        ? role.anniv
                        : color.white,
          }}
        >
          {cell.day}
        </Text>
      </View>

      {/* 마커 — 날짜 숫자 바로 아래 (셀이 커져도 숫자에 붙어 있게) */}
      <View style={{ marginTop: 3, gap: 3 }}>
        {m.annivLabel && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <StarGlyph size={10} />
            <Text
              numberOfLines={1}
              style={{ flex: 1, fontSize: 10, fontFamily: typeface, fontWeight: '700', color: role.anniv }}
            >
              {m.annivLabel}
            </Text>
          </View>
        )}
        {m.holidayLabel && (
          <Text
            numberOfLines={1}
            style={{ fontSize: 10, fontFamily: typeface, fontWeight: '700', color: color.holiday }}
          >
            {shortHolidayName(m.holidayLabel)}
          </Text>
        )}
        {m.upcomingTitle && (
          <Chip bg={roleBg.date} fg={color.date}>
            {m.upcomingTitle}
          </Chip>
        )}
        {m.releasedThumb && (
          <Text style={{ fontSize: 10, fontFamily: typeface, fontWeight: '700', color: color.white }}>데이트</Text>
        )}
        {m.releasedNoPhoto && <Chip bg={roleBg.date} fg={color.date}>데이트</Chip>}
        {(m.events ?? []).map((e, i) => (
          <Chip key={i} bg={roleBg[e.who]} fg={role[e.who]}>
            {e.title}
          </Chip>
        ))}
      </View>
    </Pressable>
  );
}

/** 셀 안 일정 칩 — 색 블록 + 제목 (셀 폭을 넘으면 한 줄로 잘림) */
function Chip({ bg, fg, children }: { bg: string; fg: string; children: string }) {
  return (
    <View style={{ borderRadius: 3, paddingHorizontal: 4, paddingVertical: 2, backgroundColor: bg }}>
      <Text numberOfLines={1} style={{ fontSize: 10, fontFamily: typeface, fontWeight: '700', color: fg }}>
        {children}
      </Text>
    </View>
  );
}
