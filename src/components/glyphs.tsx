import { View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { color } from '@/theme/tokens';
import { MUSIC_BRAND_LOGO } from '@/lib/musicBrand';
import type { LinkKind } from '@/lib/link';

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
      <G fill={filled ? color.bg : fg}>
        <Circle cx={8} cy={14} r={1.4} />
        <Circle cx={12} cy={14} r={1.4} />
        <Circle cx={16} cy={14} r={1.4} />
        <Circle cx={8} cy={18} r={1.4} />
        <Circle cx={12} cy={18} r={1.4} />
      </G>
    </Svg>
  );
}

/** 시계 — 일정의 때(시작~종료)를 가리키는 줄 앞에 놓는다 */
export function ClockGlyph({ size = 18, color: fg = color.sub }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={8.5} stroke={fg} strokeWidth={1.7} />
      <Path d="M12 7.5V12l3 2" stroke={fg} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** 지도 핀 — 장소를 가리키는 줄 앞에 놓는다 */
export function PinGlyph({ size = 18, color: fg = color.sub }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21c4.5-4.5 7-7.8 7-11a7 7 0 1 0-14 0c0 3.2 2.5 6.5 7 11z"
        stroke={fg}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={10} r={2.6} stroke={fg} strokeWidth={1.7} />
    </Svg>
  );
}

/** 홈 탭 글리프 — 지붕 + 몸통 */
export function HomeGlyph({ size = 24, filled, color: fg = color.white }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3.5 10.2 12 3.5l8.5 6.7V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19v-8.8z"
        stroke={fg}
        strokeWidth={1.7}
        strokeLinejoin="round"
        fill={filled ? fg : 'none'}
      />
      <Path
        d="M9.5 20.5v-6h5v6"
        stroke={filled ? color.bg : fg}
        strokeWidth={1.7}
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

/** 피드 탭 글리프 — 겹친 카드 두 장 */
export function FeedGlyph({ size = 24, filled, color: fg = color.white }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 20.5H6A2.5 2.5 0 0 1 3.5 18V7"
        stroke={fg}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
      <Rect
        x={7.5}
        y={3.5}
        width={13}
        height={13}
        rx={2.5}
        stroke={fg}
        strokeWidth={1.7}
        fill={filled ? fg : 'none'}
      />
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

/** 글자 얹기 (T) — 스토리 편집의 텍스트 도구 */
export function TextToolGlyph({ size = 20, color: fg = color.white }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 6h14M12 6v12" stroke={fg} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

/** 올리기 (↑) */
export function ArrowUpGlyph({ size = 22, color: fg = color.onPrimary }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 19.5V5M5.5 11.5 12 5l6.5 6.5"
        stroke={fg}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** 담김 표시 (✓) — 굵고 둥근 체크 */
export function CheckGlyph({ size = 16, color: fg = color.bg }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12.5 10 17.5 19.5 7"
        stroke={fg}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

/** 스토리 보관함 — 스토리 링을 그대로 축약한 이중 원 */
export function StoryGlyph({ size = 22, color: fg = color.white }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={fg} strokeWidth={1.8} />
      <Circle cx={12} cy={12} r={4.2} stroke={fg} strokeWidth={1.8} />
    </Svg>
  );
}

/** 연결 (체인 링크) — 커플 연결 상태 표시 */
export function LinkGlyph({ size = 20, color: fg = color.white }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10 13.5a3.5 3.5 0 0 0 5 0l2.5-2.5a3.5 3.5 0 1 0-5-5L11 7.5"
        stroke={fg}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
      <Path
        d="M14 10.5a3.5 3.5 0 0 0-5 0L6.5 13a3.5 3.5 0 1 0 5 5l1.5-1.5"
        stroke={fg}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** 로그아웃 (문 밖으로 나가는 화살표) */
export function LogoutGlyph({ size = 20, color: fg = color.danger }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3"
        stroke={fg}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 12h9M17 8l4 4-4 4"
        stroke={fg}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** 오른쪽 꺾쇠 (›) — 목록 행 이동 표시 */
export function ChevronGlyph({ size = 18, color: fg = color.muted }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 6l6 6-6 6" stroke={fg} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** 좋아요 (♥) — 눌렀으면 채움 */
export function HeartGlyph({ size = 24, filled, color: fg = color.white }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? fg : 'none'}>
      <Path
        d="M12 20.3 4.2 12.7a4.6 4.6 0 0 1 0-6.6 4.9 4.9 0 0 1 6.8 0l1 1 1-1a4.9 4.9 0 0 1 6.8 0 4.6 4.6 0 0 1 0 6.6L12 20.3z"
        stroke={fg}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** 댓글 (말풍선) */
export function CommentGlyph({ size = 24, color: fg = color.white }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 11.5c0 4.4-4 8-9 8-1 0-2-.15-2.9-.42L4 20.5l1.5-3.7A7.5 7.5 0 0 1 3 11.5c0-4.4 4-8 9-8s9 3.6 9 8z"
        stroke={fg}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** 재생 (▶) — 오늘의 추천곡 30초 미리듣기 */
export function PlayGlyph({ size = 22, color: fg = color.onPrimary }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={fg}>
      <Path d="M8 4.8v14.4l11.2-7.2z" />
    </Svg>
  );
}

/** 정지 (❚❚) */
export function PauseGlyph({ size = 22, color: fg = color.onPrimary }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={fg}>
      <Rect x={7} y={5} width={3.6} height={14} rx={1.2} />
      <Rect x={13.4} y={5} width={3.6} height={14} rx={1.2} />
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

/**
 * 음원 서비스 로고 — 전곡 듣기 시트에서 "익숙한 로고 골라 누르기"용.
 * 스포티파이·유튜브뮤직·애플뮤직은 공식 벡터(simple-icons, CC0)를 브랜드색 실루엣으로 렌더한다.
 * 멜론은 그 세트에 없어 공식 로고 파일(assets/music/melon.png)을 쓴다 — 지금은 임시 플레이스홀더.
 */
export function MusicServiceIcon({
  id,
  size = 28,
}: {
  id: 'youtube' | 'spotify' | 'apple' | 'melon';
  size?: number;
}) {
  if (id === 'melon') {
    return (
      <Image
        source={require('../../assets/music/melon.png')}
        style={{ width: size, height: size, borderRadius: 6 }}
        contentFit="contain"
      />
    );
  }
  const logo = MUSIC_BRAND_LOGO[id];
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d={logo.path} fill={logo.hex} />
      </Svg>
    </View>
  );
}

/* ── 장소 종류 글리프 (lib/placeKind의 PlaceKind 8종 중 7종 — etc는 PinGlyph 재사용) ── */

/** 음식 — 포크·나이프 */
export function FoodGlyph({ size = 20, color: fg = color.sub }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 3v6.5a2 2 0 0 0 2 2 2 2 0 0 0 2-2V3M9 11.5V21"
        stroke={fg}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 3v5" stroke={fg} strokeWidth={1.7} strokeLinecap="round" />
      <Path
        d="M17 21v-7.5m0 0c1.4 0 2.3-1 2.3-2.6V3.5c-2.3.6-3.6 2.6-3.6 5.4 0 2.1.5 4.6 1.3 4.6z"
        stroke={fg}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** 카페 — 손잡이 달린 컵 */
export function CafeGlyph({ size = 20, color: fg = color.sub }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4.5 8h12v6.5a4.5 4.5 0 0 1-4.5 4.5H9a4.5 4.5 0 0 1-4.5-4.5V8z"
        stroke={fg}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <Path
        d="M16.5 9.5h1.8a2.2 2.2 0 1 1 0 4.4h-1.8"
        stroke={fg}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M8 3v2.2M12 3v2.2" stroke={fg} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

/** 술 — 칵테일 잔 */
export function BarGlyph({ size = 20, color: fg = color.sub }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3.5 4.5h17L12 13 3.5 4.5z"
        stroke={fg}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <Path d="M12 13v7M8 20h8" stroke={fg} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

/** 문화 — 액자 걸린 그림 */
export function CultureGlyph({ size = 20, color: fg = color.sub }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3.5} y={4.5} width={17} height={13} rx={2} stroke={fg} strokeWidth={1.7} />
      <Path
        d="M6 14.5 9.7 10l2.8 3 2-2.2L18 14.5"
        stroke={fg}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 17.5V21M9 21h6" stroke={fg} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

/** 자연 — 나무 */
export function NatureGlyph({ size = 20, color: fg = color.sub }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3 5.5 12h3.2L4.5 17.5h15L15.3 12h3.2L12 3z"
        stroke={fg}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <Path d="M12 17.5V21" stroke={fg} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

/** 쇼핑 — 쇼핑백 */
export function ShoppingGlyph({ size = 20, color: fg = color.sub }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 7.5h14l-1.1 12A1.5 1.5 0 0 1 16.4 21H7.6a1.5 1.5 0 0 1-1.5-1.5L5 7.5z"
        stroke={fg}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <Path
        d="M8.8 10V6.6a3.2 3.2 0 0 1 6.4 0V10"
        stroke={fg}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** 숙박 — 침대 */
export function StayGlyph({ size = 20, color: fg = color.sub }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 19v-4.5h18V19M3 14.5V6M21 14.5v-2a2.5 2.5 0 0 0-2.5-2.5H11v4.5"
        stroke={fg}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={7} cy={11} r={2} stroke={fg} strokeWidth={1.7} />
    </Svg>
  );
}

/** 드래그 그립 — 코스 순서 바꾸기 힌트 */
export function GripGlyph({ size = 20, color: fg = color.sub }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 8h16M4 12h16M4 16h16" stroke={fg} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

/** 닫기·삭제 (×) */
export function CloseGlyph({ size = 18, color: fg = color.sub }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5.5 5.5l13 13M18.5 5.5l-13 13" stroke={fg} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

/**
 * 네이버 지도 마크 — 앱 아이콘 모양(파랑→초록 그라디언트 핀 + 흰 N).
 * 네이버 브랜드 마크(초록 사각형 N)와는 다른 마크다 — 지도로 가는 버튼이니 지도 쪽을 쓴다.
 * hex는 네이버 고유 브랜드색이라 토큰 대상이 아니다 (musicBrand의 서비스 색과 같은 예외).
 */
export function NaverMapGlyph({ size = 16 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <LinearGradient id="naverMap" x1="0.35" y1="0" x2="0.15" y2="1">
          <Stop offset="0" stopColor="#1C7DFF" />
          <Stop offset="0.55" stopColor="#00B7DE" />
          <Stop offset="1" stopColor="#00E026" />
        </LinearGradient>
      </Defs>
      <Path
        d="M12 1.6c-5.08 0-8.9 3.86-8.9 8.7 0 3.3 2.06 6.9 6.16 11.36a3.7 3.7 0 0 0 5.48 0c4.1-4.46 6.16-8.06 6.16-11.36 0-4.84-3.82-8.7-8.9-8.7z"
        fill="url(#naverMap)"
      />
      <G transform="translate(4.56 2.6) scale(0.62)">
        <Path d="M14.4 6.5h3.3v11h-3.9l-3.3-5.2v5.2H6.3v-11h3.9l3.3 5.2V6.5z" fill="#FFFFFF" />
      </G>
    </Svg>
  );
}

/**
 * 업체 링크 글리프 — places.link가 어디로 나가는지(lib/link의 LinkKind) 보여준다.
 * 인스타·유튜브는 공식 로고(simple-icons, CC0) 실루엣 + 브랜드 고유색 — musicBrand와 같은 예외.
 * 블로그·홈페이지는 도메인이 제각각이라 특정 로고를 못 쓴다 → 체인 링크 글리프.
 *
 * 캐치테이블은 흰 C + 주황 타일이라 패스로 그린다. 테이블링은 얼굴 일러스트라 패스로
 * 옮길 수 없어 로고 파일을 쓴다 (MusicServiceIcon의 멜론과 같은 갈래 — 기하학적 마크는
 * 패스, 그림은 파일). 두 브랜드색은 로고 원본에서 뽑았다.
 */
export function LinkKindGlyph({ kind, size = 16 }: { kind: LinkKind; size?: number }) {
  if (kind === 'instagram') {
    // 인스타 로고는 단색이 아니라 왼쪽아래 주황 → 분홍 → 오른쪽위 보라 그라디언트다
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Defs>
          <LinearGradient id="instagram" x1="0" y1="1" x2="1" y2="0">
            <Stop offset="0" stopColor="#FEDA75" />
            <Stop offset="0.2" stopColor="#FA7E1E" />
            <Stop offset="0.5" stopColor="#D62976" />
            <Stop offset="0.85" stopColor="#962FBF" />
            <Stop offset="1" stopColor="#8134AF" />
          </LinearGradient>
        </Defs>
        <Rect x={2.2} y={2.2} width={19.6} height={19.6} rx={5.8} stroke="url(#instagram)" strokeWidth={2.1} />
        <Circle cx={12} cy={12} r={4.3} stroke="url(#instagram)" strokeWidth={2.1} />
        <Circle cx={17.4} cy={6.6} r={1.3} fill="url(#instagram)" />
      </Svg>
    );
  }
  if (kind === 'youtube') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect x={1.5} y={5} width={21} height={14} rx={4} fill="#FF0000" />
        <Path d="M10 8.8v6.4L15.5 12 10 8.8z" fill="#FFFFFF" />
      </Svg>
    );
  }
  if (kind === 'catchtable') {
    // 주황 타일 위 흰 C — 오른쪽이 트인 굵은 호(터미널은 자른 단면 그대로 butt cap)
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect width={24} height={24} rx={5} fill="#FF3D00" />
        <Path
          d="M15.27 15.89A5.08 5.08 0 1 1 15.27 8.11"
          stroke="#FFFFFF"
          strokeWidth={3.77}
        />
      </Svg>
    );
  }
  if (kind === 'tabling') {
    // 얼굴 일러스트 — 흰 바탕이 로고의 일부라 타일째 그린다 (멜론과 같은 처리)
    return (
      <Image
        source={require('../../assets/brand/tabling.png')}
        style={{ width: size, height: size, borderRadius: size * 0.28 }}
        contentFit="contain"
      />
    );
  }
  return <LinkGlyph size={size} color={color.sub} />;
}
