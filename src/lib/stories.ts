/**
 * 스토리 규칙 — 순수 함수만 (React·Supabase 금지).
 *
 * 스토리는 만료 삭제가 없다. 24시간이 지나면 홈 링에서 내려갈 뿐 데이터는 그대로 남아
 * 보관함이 곧 아카이브가 된다. 그래서 "살아있다"는 판정은 저장된 상태가 아니라
 * created_at으로 매번 파생한다 (tracks의 released 판정과 같은 방식).
 */

import { monthKey, toKSTDate, type ISODate } from './date';
import {
  DEFAULT_STORY_TEXT_COLOR,
  STORY_TEXT_COLOR_KEYS,
  type StoryTextColorKey,
} from '@/theme/tokens';

export const STORY_TTL_MS = 24 * 60 * 60 * 1000;

/** 링·보관함 계산에 필요한 최소 모양 — api 레이어의 Story가 이걸 만족한다 */
export interface StoryLike {
  authorId: string;
  createdAt: string;
  /** 상대가 본 시각. 아직 안 봤으면 null */
  seenAt: string | null;
}

/** 24시간 이내인가 = 홈 링에 뜨는가 */
export function isLive(createdAt: string, now: Date = new Date()): boolean {
  return now.getTime() - new Date(createdAt).getTime() < STORY_TTL_MS;
}

/** 링에 뜨는 스토리 — 올린 순(오래된 것부터). 뷰어가 이 순서로 넘긴다 */
export function liveStories<T extends StoryLike>(stories: T[], now: Date = new Date()): T[] {
  return stories
    .filter((s) => isLive(s.createdAt, now))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** 링 상태 — 새 스토리 있음 / 다 봤음 / 24시간 내 스토리 없음 */
export type RingState = 'new' | 'seen' | 'none';

/**
 * `ownerId`가 올린 24시간 내 스토리의 링 상태.
 * seen_at은 "상대가 본 시각"이라 상대 링에선 '아직 안 본 게 있다',
 * 내 링에선 '상대가 아직 안 봤다'로 읽힌다 — 둘 다 accent를 켤 이유다.
 */
export function ringState(
  stories: StoryLike[],
  ownerId: string,
  now: Date = new Date(),
): RingState {
  const live = stories.filter((s) => s.authorId === ownerId && isLive(s.createdAt, now));
  if (!live.length) return 'none';
  return live.some((s) => s.seenAt === null) ? 'new' : 'seen';
}

export interface StoryMonth<T> {
  /** 'YYYY-MM' */
  key: string;
  stories: T[];
}

/**
 * 보관함 월별 섹션 — 최신 월부터, 월 안에서도 최신부터.
 * 월 경계는 KST 기준 (모든 날짜 연산의 규칙).
 */
export function groupByMonth<T extends { createdAt: string }>(stories: T[]): StoryMonth<T>[] {
  const byMonth = new Map<string, T[]>();
  for (const s of stories) {
    const key = monthKey(toKSTDate(new Date(s.createdAt)) as ISODate);
    byMonth.set(key, [...(byMonth.get(key) ?? []), s]);
  }
  return [...byMonth.entries()]
    .map(([key, list]) => ({
      key,
      stories: [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    }))
    .sort((a, b) => b.key.localeCompare(a.key));
}

/** 'YYYY-MM' → '2026년 7월' (보관함 섹션 헤더) */
export function formatMonthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return `${y}년 ${m}월`;
}

// ============================================================
// 텍스트 스티커
// ============================================================

/**
 * 사진 위에 얹는 텍스트 한 개.
 * 좌표·크기는 **사진 기준 비율**이다 — 편집 화면(작은 프레임)과 뷰어(전체화면)의
 * 픽셀 크기가 달라도 같은 자리에 같은 비중으로 찍히게 하는 유일한 방법.
 */
export interface TextOverlay {
  id: string;
  text: string;
  /** 사진 안에서의 중심 (0~1) */
  x: number;
  y: number;
  /** 사진 너비 대비 글자 크기 */
  size: number;
  /** 도(°) */
  rotation: number;
  color: StoryTextColorKey;
}

export const OVERLAY_SIZE_MIN = 0.03;
export const OVERLAY_SIZE_MAX = 0.28;
export const OVERLAY_SIZE_DEFAULT = 0.08;
/** 스토리 하나에 올릴 수 있는 텍스트 수 — 넘치면 사진이 안 보인다 */
export const OVERLAY_MAX = 8;

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** 화면 밖으로 나가거나 읽을 수 없는 크기가 되지 않게 다듬는다 */
export function clampOverlay(o: TextOverlay): TextOverlay {
  return {
    ...o,
    x: clamp(o.x, 0, 1),
    y: clamp(o.y, 0, 1),
    size: clamp(o.size, OVERLAY_SIZE_MIN, OVERLAY_SIZE_MAX),
    rotation: ((o.rotation % 360) + 360) % 360,
  };
}

/** 새 텍스트 — 사진 한가운데에서 시작한다 */
export function createTextOverlay(id: string, text: string, color: StoryTextColorKey): TextOverlay {
  return { id, text, x: 0.5, y: 0.5, size: OVERLAY_SIZE_DEFAULT, rotation: 0, color };
}

function isNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

/**
 * DB의 jsonb → TextOverlay[]. 모양이 어긋난 항목은 조용히 버린다 —
 * 스키마가 자유로운 컬럼이라 읽는 쪽이 유일한 방어선이다.
 */
export function parseOverlays(value: unknown): TextOverlay[] {
  if (!Array.isArray(value)) return [];
  const out: TextOverlay[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue;
    const o = raw as Record<string, unknown>;
    if (typeof o.id !== 'string' || typeof o.text !== 'string' || !o.text) continue;
    if (!isNumber(o.x) || !isNumber(o.y) || !isNumber(o.size) || !isNumber(o.rotation)) continue;
    const color = STORY_TEXT_COLOR_KEYS.includes(o.color as StoryTextColorKey)
      ? (o.color as StoryTextColorKey)
      : DEFAULT_STORY_TEXT_COLOR;
    out.push(clampOverlay({ id: o.id, text: o.text, x: o.x, y: o.y, size: o.size, rotation: o.rotation, color }));
  }
  return out.slice(0, OVERLAY_MAX);
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 프레임 안에 사진을 contain으로 놓았을 때 사진이 실제로 차지하는 사각형.
 * 텍스트는 프레임이 아니라 **사진**에 붙어야 하므로, 편집 화면과 뷰어 양쪽이 이 사각형을 기준으로 찍는다.
 */
export function containedRect(
  photoW: number | null,
  photoH: number | null,
  frameW: number,
  frameH: number,
): Rect {
  if (!photoW || !photoH || photoW <= 0 || photoH <= 0) {
    return { x: 0, y: 0, width: frameW, height: frameH };
  }
  const scale = Math.min(frameW / photoW, frameH / photoH);
  const width = photoW * scale;
  const height = photoH * scale;
  return { x: (frameW - width) / 2, y: (frameH - height) / 2, width, height };
}
