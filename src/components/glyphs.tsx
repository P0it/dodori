import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { color } from '@/theme/tokens';

type GlyphProps = { size?: number; filled?: boolean; color?: string };

/** 캘린더 탭 글리프 (목업 CalGlyph — 킷 아이콘셋에 없어 커스텀) */
export function CalGlyph({ size = 24, filled, color: fg = color.white }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x={3}
        y={5}
        width={18}
        height={16}
        rx={2.5}
        stroke={fg}
        strokeWidth={1.7}
        fill={filled ? fg : 'none'}
      />
      <Path d="M3 9.5h18" stroke={filled ? color.bg : fg} strokeWidth={1.7} />
      <Path d="M8 3v4M16 3v4" stroke={fg} strokeWidth={1.7} strokeLinecap="round" />
      {filled && (
        <G fill={color.bg}>
          <Circle cx={8} cy={14} r={1.4} />
          <Circle cx={12} cy={14} r={1.4} />
          <Circle cx={16} cy={14} r={1.4} />
          <Circle cx={8} cy={18} r={1.4} />
          <Circle cx={12} cy={18} r={1.4} />
        </G>
      )}
    </Svg>
  );
}

/** 오늘 탭 글리프 — 서로 주고받는 말풍선 두 개 */
export function TalkGlyph({ size = 24, filled, color: fg = color.white }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 6.5A2.5 2.5 0 015.5 4h8A2.5 2.5 0 0116 6.5v4A2.5 2.5 0 0113.5 13H8l-5 3.5v-10z"
        stroke={fg}
        strokeWidth={1.7}
        strokeLinejoin="round"
        fill={filled ? fg : 'none'}
      />
      <Path
        d="M18.5 9H19a2 2 0 012 2v4.5a2 2 0 01-2 2h-.5L15 20v-3"
        stroke={fg}
        strokeWidth={1.7}
        strokeLinejoin="round"
        fill={filled ? fg : 'none'}
      />
    </Svg>
  );
}

/** 스튜디오 탭 글리프 (목업 DiscGlyph) */
export function DiscGlyph({ size = 24, filled, color: fg = color.white }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={fg} strokeWidth={1.7} fill={filled ? fg : 'none'} />
      <Circle
        cx={12}
        cy={12}
        r={3.2}
        stroke={filled ? color.bg : fg}
        strokeWidth={1.7}
        fill="none"
      />
      <Circle cx={12} cy={12} r={0.9} fill={filled ? color.bg : fg} />
    </Svg>
  );
}

/** 플레이리스트 탭 글리프 — DS LibraryOutline/Solid 대응 커스텀 */
export function LibGlyph({ size = 24, filled, color: fg = color.white }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {filled ? (
        <Path d="M3 3.5c0-.3.2-.5.5-.5h2c.3 0 .5.2.5.5v17c0 .3-.2.5-.5.5h-2a.5.5 0 0 1-.5-.5v-17Zm6 0c0-.3.2-.5.5-.5h2c.3 0 .5.2.5.5v17c0 .3-.2.5-.5.5h-2a.5.5 0 0 1-.5-.5v-17Zm6.1.6a.5.5 0 0 1 .35-.6l1.93-.52a.5.5 0 0 1 .61.35l4.4 16.43a.5.5 0 0 1-.35.61l-1.93.52a.5.5 0 0 1-.61-.35L15.1 4.1Z" fill={fg} />
      ) : (
        <>
          <Path d="M4 3v18M10 3v18" stroke={fg} strokeWidth={1.8} strokeLinecap="round" />
          <Path d="m15.5 3.6 4.6 17" stroke={fg} strokeWidth={1.8} strokeLinecap="round" />
        </>
      )}
    </Svg>
  );
}

/** 기념일 별 글리프 (목업 인라인 svg) */
export function StarGlyph({ size = 12, color: fg = color.anniv }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill={fg}>
      <Path d="M6 0l1.6 3.7 4 .35-3 2.65.9 3.9L6 8.5 2.5 10.6l.9-3.9-3-2.65 4-.35z" />
    </Svg>
  );
}

/** 새 게시물 (+) */
export function PlusGlyph({ size = 24, color: fg = color.white }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={fg} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

/** 관리 메뉴 (≡) */
export function MenuGlyph({ size = 22, color: fg = color.white }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 7h16M4 12h16M4 17h16"
        stroke={fg}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** 더보기 (⋯) */
export function MoreGlyph({ size = 20, color: fg = color.sub }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={fg}>
      <Circle cx={5} cy={12} r={1.6} />
      <Circle cx={12} cy={12} r={1.6} />
      <Circle cx={19} cy={12} r={1.6} />
    </Svg>
  );
}

/** 사진 여러 장 (겹친 사각형) */
export function StackGlyph({ size = 15, color: fg = color.white }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={8} y={3} width={13} height={13} rx={2.5} stroke={fg} strokeWidth={1.9} />
      <Path
        d="M16 20.5H5.5A2.5 2.5 0 013 18V7.5"
        stroke={fg}
        strokeWidth={1.9}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** 카카오 심볼 (목업 KakaoButton 내 svg) */
export function KakaoGlyph({ size = 20, color: fg = color.kakaoText }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={fg}>
      <Path d="M12 3C6.5 3 2 6.6 2 11c0 2.9 1.9 5.4 4.8 6.8-.2.7-.8 2.7-.9 3.1 0 0 0 .3.2.4.2 0 .4-.1.4-.1.5-.3 3.2-2.1 4-2.6.5.1 1 .1 1.5.1 5.5 0 10-3.6 10-8S17.5 3 12 3z" />
    </Svg>
  );
}
