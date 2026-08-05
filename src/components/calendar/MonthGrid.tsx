import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { color, eventColor, typeface, type EventColorKey } from '@/theme/tokens';
import { AlbumJacket } from '@/components/AlbumJacket';
import type { DayCell } from '@/lib/calendar';
import { laneCounts, rowBudget, type SpanSegment } from '@/lib/span';
import { shortHolidayName } from '@/lib/holidays';
import { StarGlyph } from '@/components/glyphs';
import { photoSource } from '@/lib/photoSource';

/** 여러 날 일정 막대 한 토막 — 주 경계에서 끊긴 조각 하나가 항목 하나다 */
export interface DaySpan {
  /** 같은 일정의 여러 토막이 같은 key를 공유한다 (React key는 week를 붙여 만든다) */
  key: string;
  title: string;
  color: EventColorKey;
  segment: SpanSegment;
  lane: number;
}

/** 막대 높이·간격 — 셀 안 마커도 같은 줄 높이를 쓴다 (막대와 칩이 같은 격자에 앉아야 계산이 맞는다) */
const BAR_H = 15;
const BAR_GAP = 2;
const ROW = BAR_H + BAR_GAP;
/** 셀 위쪽 padding(5) + 날짜 숫자(20) + 숨(3) */
const BAR_TOP = 28;
/** 셀 아래쪽 여백 — 마지막 줄이 셀 모서리에 붙지 않게 */
const BAR_BOTTOM = 4;

/** 셀 하나에 표시할 마커 집합 — 화면(조합 계층)에서 만들어 내려준다 */
export interface DayMarks {
  /**
   * 그날의 데이트(트랙) — 칸 배경을 자켓으로 채운다. 지난 날·앞으로의 날을 가리지 않는다
   * (예정 데이트에 사진을 올려도 안 보이던 게 이 구분 때문이었다).
   * thumb이 없으면 라이브러리와 같은 seed 그라디언트로 채운다 — id를 seed로 써야 색이 일치한다.
   */
  date?: { id: string; title: string; thumb: string | null };
  annivLabel?: string;
  /** 공휴일 이름 ('설날', '대체공휴일(광복절)' 등) */
  holidayLabel?: string;
  /** 개인 일정 — 시간순, 제목·색(사람이 아니라 일정의 속성) */
  events?: { title: string; color: EventColorKey }[];
}

/** 셀 안 한 줄 — 줄 수를 세는 쪽과 그리는 쪽이 어긋나지 않게 목록으로 한 번에 만든다 */
type Mark =
  | { kind: 'anniv'; label: string }
  | { kind: 'holiday'; label: string }
  | { kind: 'chip'; bg: string; fg: string; label: string }
  | { kind: 'plain'; label: string };

function markList(m: DayMarks): Mark[] {
  const out: Mark[] = [];
  if (m.annivLabel) out.push({ kind: 'anniv', label: m.annivLabel });
  if (m.holidayLabel) out.push({ kind: 'holiday', label: shortHolidayName(m.holidayLabel) });
  // 데이트는 칩이 아니라 맨 글자 — 칸 배경이 이미 자켓이라 색 블록을 또 얹으면 사진을 가린다.
  // 형태가 다르니 개인 일정 칩과 색이 비슷해도 헷갈리지 않는다.
  if (m.date) out.push({ kind: 'plain', label: m.date.title });
  for (const e of m.events ?? [])
    out.push({ kind: 'chip', bg: eventColor[e.color].bg, fg: eventColor[e.color].fg, label: e.title });
  return out;
}

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];

type Props = {
  cells: DayCell[];
  marks: Record<string, DayMarks>;
  /** 여러 날 일정 — 셀 위를 가로지르는 막대. 하루짜리는 marks.events로 온다 */
  spans?: DaySpan[];
  selected: string;
  onSelectDay: (date: string) => void;
  /** 빈 달 데모용 흐림 처리 */
  dim?: boolean;
};

/** 월간 그리드 (목업 17 — 7열, 라이브러리 없이 자체 구현 §3). 부모가 준 높이를 주 단위 행이 균등하게 나눠 갖는다 */
export function MonthGrid({ cells, marks, spans = [], selected, onSelectDay, dim }: Props) {
  const weeks: DayCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  /** 주마다 막대가 몇 줄인가 — 셀 안 마커를 그만큼 내린다 */
  const lanes = laneCounts(spans, weeks.length);

  // 한 줄에 몇 개가 들어가는지는 실제 셀 높이가 정한다 (달마다 5~6주로 갈린다).
  // 재는 건 주 행 묶음 하나뿐 — 모든 주가 flex:1이라 높이를 균등하게 나눠 갖는다.
  const [rowH, setRowH] = useState(0);
  const maxRows = rowH > 0 ? Math.max(1, Math.floor((rowH - BAR_TOP - BAR_BOTTOM) / ROW)) : 2;

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
      <View
        style={{ flex: 1 }}
        onLayout={(e) => setRowH(e.nativeEvent.layout.height / weeks.length)}
      >
      {weeks.map((week, w) => {
        const cellMarks = week.map((c) => (c.inMonth ? markList(marks[c.date] ?? {}) : []));
        const budget = rowBudget(maxRows, lanes[w], Math.max(0, ...cellMarks.map((l) => l.length)));
        const weekSpans = spans.filter((s) => s.segment.week === w);

        return (
        <View key={week[0].date} style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', flex: 1 }}>
            {week.map((cell, col) => {
              const shown = cellMarks[col].slice(0, budget.marks);
              // 안 보이는 것 = 잘린 칩 + 예산 밖 칸에 앉아 이 날을 지나가는 막대
              const hiddenBars = weekSpans.filter(
                (s) =>
                  s.lane >= budget.lanes && s.segment.startCol <= col && col <= s.segment.endCol,
              ).length;
              return (
                <DayCellView
                  key={cell.date}
                  cell={cell}
                  date={cell.inMonth ? marks[cell.date]?.date : undefined}
                  anniv={cell.inMonth ? !!marks[cell.date]?.annivLabel : false}
                  holiday={cell.inMonth ? !!marks[cell.date]?.holidayLabel : false}
                  shown={shown}
                  hidden={cellMarks[col].length - shown.length + hiddenBars}
                  markTop={budget.lanes * ROW}
                  selected={cell.inMonth && cell.date === selected}
                  onPress={() => cell.inMonth && onSelectDay(cell.date)}
                />
              );
            })}
          </View>
          {/* 막대는 셀 위에 겹쳐 깐다 — 탭은 아래 셀이 받아야 하므로 이벤트를 통과시킨다 */}
          <SpanBars spans={weekSpans.filter((s) => s.lane < budget.lanes)} />
        </View>
        );
      })}
      </View>
    </View>
  );
}

/**
 * 한 주의 막대 층. 칸(lane)마다 가로 한 줄을 깔고, 그 안에서 flex 비율로 열을 맞춘다
 * (7열이 flex:1이라 퍼센트 대신 flex 스페이서를 쓰면 셀 경계와 정확히 떨어진다).
 */
function SpanBars({ spans }: { spans: DaySpan[] }) {
  if (spans.length === 0) return null;
  const byLane = new Map<number, DaySpan[]>();
  for (const s of spans) byLane.set(s.lane, [...(byLane.get(s.lane) ?? []), s]);

  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: BAR_TOP }}>
      {[...byLane.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([lane, items]) => {
          const sorted = [...items].sort((a, b) => a.segment.startCol - b.segment.startCol);
          const row: React.ReactNode[] = [];
          let col = 0;
          for (const s of sorted) {
            const { startCol, endCol, continuesLeft, continuesRight } = s.segment;
            if (startCol > col) row.push(<View key={`gap-${startCol}`} style={{ flex: startCol - col }} />);
            row.push(
              <View
                key={s.key}
                style={{
                  flex: endCol - startCol + 1,
                  height: BAR_H,
                  justifyContent: 'center',
                  backgroundColor: eventColor[s.color].bg,
                  // 이어지는 쪽은 모서리를 세워 붙여둔다 — 다음 주로 계속된다는 신호
                  borderTopLeftRadius: continuesLeft ? 0 : 3,
                  borderBottomLeftRadius: continuesLeft ? 0 : 3,
                  borderTopRightRadius: continuesRight ? 0 : 3,
                  borderBottomRightRadius: continuesRight ? 0 : 3,
                  marginLeft: continuesLeft ? 0 : 2,
                  marginRight: continuesRight ? 0 : 2,
                }}
              >
                {/* 제목은 토막마다 한 번 — 주가 바뀌어 다시 시작해도 무엇인지 알아야 한다 */}
                <Text
                  numberOfLines={1}
                  style={{
                    paddingHorizontal: 4,
                    fontSize: 10,
                    fontFamily: typeface,
                    fontWeight: '700',
                    color: eventColor[s.color].fg,
                  }}
                >
                  {s.title}
                </Text>
              </View>,
            );
            col = endCol + 1;
          }
          if (col <= 6) row.push(<View key="gap-end" style={{ flex: 7 - col }} />);
          return (
            <View
              key={lane}
              style={{ flexDirection: 'row', height: BAR_H, marginBottom: BAR_GAP }}
            >
              {row}
            </View>
          );
        })}
    </View>
  );
}

function DayCellView({
  cell,
  date,
  anniv,
  holiday,
  shown,
  hidden,
  markTop,
  selected,
  onPress,
}: {
  cell: DayCell;
  date?: { id: string; title: string; thumb: string | null };
  anniv: boolean;
  holiday: boolean;
  /** 이 셀이 실제로 그릴 줄들 — 예산 밖은 잘라서 온다 */
  shown: Mark[];
  /** 잘린 줄 + 안 그린 막대 수 */
  hidden: number;
  /** 이 주의 막대가 차지한 높이 — 셀 안 마커를 그만큼 내린다 */
  markTop: number;
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
      {/*
        데이트가 있는 날은 칸 자체가 앨범이 된다 — 사진이 있으면 커버, 없으면 그라디언트 자켓.
        예전처럼 전체를 35% 검정으로 덮지 않는다 (52pt짜리 칸에선 사진이 회색 판이 된다).
        대신 글자가 앉는 위·아래만 스크림으로 눌러 가독성을 챙긴다.
      */}
      {date && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 7, overflow: 'hidden' }}>
          {date.thumb ? (
            <Image source={photoSource(date.thumb)} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          ) : (
            <AlbumJacket seed={date.id} />
          )}
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.12)', 'rgba(0,0,0,0.7)']}
            locations={[0, 0.4, 1]}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
        </View>
      )}
      {/* 날짜 숫자 — 오늘은 배경 원 없이 accent 색으로만 (진입 시 오늘이 선택일이라 테두리로도 강조된다) */}
      <View
        style={{
          alignSelf: 'center',
          height: 20,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontSize: 14.5,
            fontWeight: cell.isToday || anniv || holiday ? '700' : '500',
            color: !cell.inMonth
              ? '#4a4a4a'
              : cell.isToday
                ? color.accent
                : holiday
                  ? color.holiday
                  : cell.weekday === 0
                    ? color.sunday
                    : cell.weekday === 6
                      ? color.saturday
                      : anniv
                        ? color.anniv
                        : color.white,
          }}
        >
          {cell.day}
        </Text>
      </View>

      {/* 마커 — 날짜 숫자 바로 아래 (셀이 커져도 숫자에 붙어 있게). 여러 날 막대가 있으면 그 아래로 */}
      <View style={{ marginTop: 3 + markTop, gap: BAR_GAP }}>
        {shown.map((mk, i) => (
          <MarkRow key={i} mark={mk} />
        ))}
        {hidden > 0 && (
          <Text
            style={{
              height: BAR_H,
              lineHeight: BAR_H,
              paddingHorizontal: 4,
              fontSize: 10,
              fontFamily: typeface,
              fontWeight: '700',
              color: color.sub,
            }}
          >
            +{hidden}
          </Text>
        )}
      </View>

      {/* 선택 표시 — 배경 틴트는 자켓 위에서 안 보인다. 테두리는 레이아웃을 밀지 않게 겹쳐 그린다 */}
      {selected && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 7,
            borderWidth: 1.5,
            borderColor: 'rgba(255,255,255,0.55)',
          }}
        />
      )}
    </Pressable>
  );
}

/** 셀 안 한 줄 — 종류가 달라도 높이는 BAR_H로 같다 (줄 수 계산이 곧 높이여야 한다) */
function MarkRow({ mark }: { mark: Mark }) {
  if (mark.kind === 'anniv') {
    return (
      <View style={{ height: BAR_H, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
        <StarGlyph size={10} />
        <Text
          numberOfLines={1}
          style={{ flex: 1, fontSize: 10, fontFamily: typeface, fontWeight: '700', color: color.anniv }}
        >
          {mark.label}
        </Text>
      </View>
    );
  }
  if (mark.kind === 'chip') {
    return (
      <View style={{ height: BAR_H, justifyContent: 'center', borderRadius: 3, paddingHorizontal: 4, backgroundColor: mark.bg }}>
        <Text numberOfLines={1} style={{ fontSize: 10, fontFamily: typeface, fontWeight: '700', color: mark.fg }}>
          {mark.label}
        </Text>
      </View>
    );
  }
  return (
    <Text
      numberOfLines={1}
      style={{
        height: BAR_H,
        lineHeight: BAR_H,
        fontSize: 10,
        fontFamily: typeface,
        fontWeight: '700',
        color: mark.kind === 'holiday' ? color.holiday : color.white,
      }}
    >
      {mark.label}
    </Text>
  );
}
