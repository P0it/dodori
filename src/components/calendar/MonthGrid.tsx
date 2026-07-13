import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { color, role, typeface } from '@/theme/tokens';
import type { DayCell } from '@/lib/calendar';
import { shortHolidayName } from '@/lib/holidays';
import { OwnerDot } from '@/components/OwnerDot';
import { StarGlyph } from '@/components/glyphs';

/** 셀 하나에 표시할 마커 집합 — 화면(조합 계층)에서 만들어 내려준다 */
export interface DayMarks {
  /** released 트랙 썸네일 URL (§6.3 캘린더 전용 사이즈) */
  releasedThumb?: string | null;
  /** released인데 커버 없음 */
  releasedNoPhoto?: boolean;
  upcoming?: boolean;
  annivLabel?: string;
  /** 공휴일 이름 ('설날', '대체공휴일(광복절)' 등) */
  holidayLabel?: string;
  owners?: ('me' | 'partner')[];
  /** 상대의 제목 숨김 일정 (빗금 바) */
  busy?: boolean;
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
              fontSize: 11,
              fontFamily: typeface, fontWeight: '600',
              color: i === 0 ? role.partner : i === 6 ? '#8fb4ff' : color.muted,
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
  const released = !!m.releasedThumb || m.releasedNoPhoto;
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
      {m.upcoming && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 7,
            borderWidth: 1.5,
            borderStyle: 'dashed',
            borderColor: role.me,
            backgroundColor: 'rgba(30,215,96,0.06)',
          }}
        />
      )}

      {/* 날짜 숫자 */}
      <View
        style={{
          alignSelf: 'flex-start',
          width: 20,
          height: 20,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: cell.isToday ? role.me : 'transparent',
        }}
      >
        <Text
          style={{
            fontSize: 12.5,
            fontWeight: cell.isToday || m.annivLabel || m.holidayLabel ? '700' : '500',
            color: !cell.inMonth
              ? '#4a4a4a'
              : cell.isToday
                ? color.bg
                : m.annivLabel
                  ? role.anniv
                  : m.holidayLabel
                    ? color.holiday
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
            <StarGlyph size={9} />
            <Text style={{ fontSize: 8.5, fontFamily: typeface, fontWeight: '700', color: role.anniv }}>싱글</Text>
          </View>
        )}
        {m.holidayLabel && (
          <Text
            numberOfLines={1}
            style={{ fontSize: 8.5, fontFamily: typeface, fontWeight: '700', color: color.holiday }}
          >
            {shortHolidayName(m.holidayLabel)}
          </Text>
        )}
        {m.upcoming && (
          <Text style={{ fontSize: 8.5, fontFamily: typeface, fontWeight: '700', color: role.me }}>예정</Text>
        )}
        {released && (
          <Text style={{ fontSize: 8.5, fontFamily: typeface, fontWeight: '700', color: color.white }}>데이트</Text>
        )}
        {m.busy && (
          <View
            style={{
              height: 4,
              borderRadius: 2,
              backgroundColor: 'rgba(232,104,143,0.5)',
            }}
          />
        )}
        {!m.busy && (m.owners?.length ?? 0) > 0 && (
          <View style={{ flexDirection: 'row', gap: 3 }}>
            {m.owners!.map((o, i) => (
              <OwnerDot key={i} who={o} size={7} />
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
}
