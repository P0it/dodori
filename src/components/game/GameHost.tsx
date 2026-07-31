import type { ComponentType } from 'react';
import { Text, View } from 'react-native';
import { color, typeface } from '@/theme/tokens';
import ReactionGame from './games/ReactionGame';
import WhackGame from './games/WhackGame';
import OddColorGame from './games/OddColorGame';
import TenSecGame from './games/TenSecGame';
import TapRushGame from './games/TapRushGame';
import StroopGame from './games/StroopGame';
import SequenceGame from './games/SequenceGame';

export interface GameProps {
  onFinish: (score: number) => void;
}

/** 종목 key → 컴포넌트. 종목 추가 = 여기 한 줄 + GAME_CATALOG 한 줄 (OCP) */
const GAMES: Record<string, ComponentType<GameProps>> = {
  reaction: ReactionGame,
  whack: WhackGame,
  oddcolor: OddColorGame,
  tensec: TenSecGame,
  taprush: TapRushGame,
  stroop: StroopGame,
  sequence: SequenceGame,
};

export function GameHost({ gameKey, onFinish }: { gameKey: string } & GameProps) {
  const G = GAMES[gameKey];
  if (!G) {
    return (
      <View style={{ padding: 24 }}>
        <Text style={{ fontFamily: typeface, color: color.sub }}>준비 중인 종목이에요</Text>
      </View>
    );
  }
  return <G onFinish={onFinish} />;
}
