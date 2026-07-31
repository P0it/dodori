import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { color, typeface } from '@/theme/tokens';
import { addMonths, monthCells, parseMonthKey, toMonthKeyString } from '@/lib/calendar';
import { monthKey, todayKST } from '@/lib/date';

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];

type Props = {
  /** 선택된 날짜 (YYYY-MM-DD) — 없으면 오늘이 있는 달을 보여준다 */
  value: string;
  onChange: (date: string) => void;
  /** 보고 있는 달 (YYYY-MM) — 화면이 들고 있어야 선택 후에도 달이 유지된다 */
  month: string;
  onMonthChange: (month: string) => void;
  /** 이 날짜 이후는 고를 수 없다 (기본: 제한 없음). 시작일·생일은 미래일 수 없다 */
  maxDate?: string;
};

/**
 * 날짜 선택 — 캘린더 탭과 같은 월간 그리드 톤. 연·월을 따로 옮길 수 있어
 * 몇 년 전 날짜(생일·시작일)도 몇 번의 탭으로 닿는다. props-only.
 */
export function DatePicker({ value, onChange, month, onMonthChange, maxDate }: Props) {
  const cells = monthCells(month);
  const { year, month: m } = parseMonthKey(month);
  /** 'day'=날짜 그리드, 'year'=연도 목록, 'month'=월 목록. 라벨을 눌러 오간다 */
  const [mode, setMode] = useState<'day' | 'year' | 'month'>('day');
  /** 연도 목록의 페이지 기준 — 12년씩 보여준다 */
  const [yearPageAnchor, setYearPageAnchor] = useState(year);

  const stepYear = (delta: number) => onMonthChange(toMonthKeyString(year + delta, m));
  const stepMonth = (delta: number) => onMonthChange(addMonths(month, delta));
  const maxYear = maxDate ? Number(maxDate.slice(0, 4)) : null;

  return (
    <View
      style={{
        borderRadius: 14,
        backgroundColor: color.surface1,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
        paddingVertical: 12,
        paddingHorizontal: 10,
      }}
    >
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
        <Stepper
          label={`${year}년`}
          active={mode === 'year'}
          onPrev={() => stepYear(-1)}
          onNext={() => stepYear(1)}
          onPressLabel={() => {
            setYearPageAnchor(year);
            setMode((v) => (v === 'year' ? 'day' : 'year'));
          }}
        />
        <Stepper
          label={`${m}월`}
          active={mode === 'month'}
          onPrev={() => stepMonth(-1)}
          onNext={() => stepMonth(1)}
          onPressLabel={() => setMode((v) => (v === 'month' ? 'day' : 'month'))}
        />
      </View>

      {mode === 'year' && (
        <Grid
          items={yearPage(yearPageAnchor).map((y) => ({
            key: String(y),
            label: `${y}`,
            selected: y === year,
            disabled: maxYear !== null && y > maxYear,
            onPress: () => {
              onMonthChange(toMonthKeyString(y, m));
              setMode('day');
            },
          }))}
          onPrevPage={() => setYearPageAnchor((a) => a - 12)}
          onNextPage={() => setYearPageAnchor((a) => a + 12)}
        />
      )}

      {mode === 'month' && (
        <Grid
          items={Array.from({ length: 12 }, (_, i) => i + 1).map((mm) => ({
            key: String(mm),
            label: `${mm}월`,
            selected: mm === m,
            disabled: maxDate ? `${toMonthKeyString(year, mm)}-01` > maxDate : false,
            onPress: () => {
              onMonthChange(toMonthKeyString(year, mm));
              setMode('day');
            },
          }))}
        />
      )}

      {mode === 'day' && (
      <>
      <View style={{ flexDirection: 'row' }}>
        {WEEK.map((w, i) => (
          <Text
            key={w}
            style={{
              flex: 1,
              textAlign: 'center',
              paddingBottom: 6,
              fontSize: 11.5,
              fontFamily: typeface,
              fontWeight: '600',
              color: i === 0 ? color.sunday : i === 6 ? color.saturday : color.muted,
            }}
          >
            {w}
          </Text>
        ))}
      </View>

      {chunk(cells).map((week) => (
        <View key={week[0].date} style={{ flexDirection: 'row' }}>
          {week.map((cell) => {
            const selected = cell.date === value;
            const disabled = maxDate ? cell.date > maxDate : false;
            return (
              <Pressable
                key={cell.date}
                disabled={disabled}
                onPress={() => {
                  onChange(cell.date);
                  // 앞뒤 달 꼬리를 누르면 그 달로 따라간다
                  if (!cell.inMonth) onMonthChange(monthKey(cell.date));
                }}
                style={{ flex: 1, alignItems: 'center', paddingVertical: 3 }}
              >
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: selected ? color.accent : 'transparent',
                    borderWidth: !selected && cell.isToday ? 1 : 0,
                    borderColor: color.surface3,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: typeface,
                      fontWeight: selected ? '800' : '600',
                      fontSize: 14,
                      color: selected
                        ? color.onPrimary
                        : disabled
                          ? color.surface3
                          : !cell.inMonth
                            ? color.muted
                            : cell.weekday === 0
                              ? color.sunday
                              : cell.weekday === 6
                                ? color.saturday
                                : color.white,
                    }}
                  >
                    {cell.day}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
      </>
      )}
    </View>
  );
}

/** 연도 목록 한 페이지 — 기준 연도를 가운데쯤 두고 12년 */
function yearPage(anchor: number): number[] {
  const start = anchor - 7;
  return Array.from({ length: 12 }, (_, i) => start + i);
}

/** 연도·월 고르기 격자 (4열). 연도는 페이지 이동 화살표를 함께 쓴다 */
function Grid({
  items,
  onPrevPage,
  onNextPage,
}: {
  items: {
    key: string;
    label: string;
    selected: boolean;
    disabled: boolean;
    onPress: () => void;
  }[];
  onPrevPage?: () => void;
  onNextPage?: () => void;
}) {
  return (
    <View>
      {onPrevPage && onNextPage && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
          <Arrow dir="prev" onPress={onPrevPage} />
          <Arrow dir="next" onPress={onNextPage} />
        </View>
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {items.map((it) => (
          <Pressable
            key={it.key}
            disabled={it.disabled}
            onPress={it.onPress}
            style={({ pressed }) => ({
              width: '25%',
              paddingVertical: 4,
              paddingHorizontal: 3,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View
              style={{
                height: 40,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: it.selected ? color.accent : color.surface2,
              }}
            >
              <Text
                style={{
                  fontFamily: typeface,
                  fontWeight: it.selected ? '800' : '600',
                  fontSize: 13.5,
                  color: it.selected ? color.onPrimary : it.disabled ? color.surface3 : color.white,
                }}
              >
                {it.label}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/** 선택된 날짜가 있으면 그 달, 없으면 이번 달 — 화면이 month 상태의 초기값으로 쓴다 */
export function initialMonth(value: string): string {
  return value ? monthKey(value) : monthKey(todayKST());
}

function chunk(cells: ReturnType<typeof monthCells>) {
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function Stepper({
  label,
  active,
  onPrev,
  onNext,
  onPressLabel,
}: {
  label: string;
  active: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPressLabel: () => void;
}) {
  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: color.surface2,
        borderRadius: 10,
        paddingHorizontal: 4,
        height: 38,
        borderWidth: 1,
        borderColor: active ? color.accent : 'transparent',
      }}
    >
      <Arrow dir="prev" onPress={onPrev} />
      {/* 라벨을 누르면 목록에서 한 번에 고른다 — 화살표만으로는 몇 년 전까지 가는 데 수십 번 걸린다 */}
      <Pressable onPress={onPressLabel} hitSlop={6} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
        <Text
          style={{
            fontFamily: typeface,
            fontWeight: '700',
            fontSize: 14.5,
            color: active ? color.accent : color.white,
          }}
        >
          {label}
        </Text>
      </Pressable>
      <Arrow dir="next" onPress={onNext} />
    </View>
  );
}

function Arrow({ dir, onPress }: { dir: 'prev' | 'next'; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => ({
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.55 : 1,
      })}
    >
      <Text style={{ fontFamily: typeface, fontWeight: '700', fontSize: 16, color: color.sub }}>
        {dir === 'prev' ? '‹' : '›'}
      </Text>
    </Pressable>
  );
}
