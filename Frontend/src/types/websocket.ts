import type { PlayerInfo } from './game';

// --- Pakiety wysyłane z Reacta do serwera C++ ---
export interface ClientPacketMap {
  HOST_INIT: Record<string, never>;
  PLAYER_JOIN: {
    nickname: string;
    avatar: string;
  };
  START_GAME: {
    maxRounds: number;
    roundTime: number;
    customWords: string[];
  };
  SUBMIT_GUESS: {
    guess: string;
  };
  DRAW_STROKE: {
    x: number;
    y: number;
    color: string;
    size: number;
    isStarting: boolean;
  };
  CLEAR_CANVAS: Record<string, never>;
}

export type ClientPacketType = keyof ClientPacketMap;

export interface OutgoingPacket<T extends ClientPacketType = ClientPacketType> {
  type: T;
  pin: string;
  payload: ClientPacketMap[T];
}

export type SendPacketFn = <T extends ClientPacketType>(
  type: T,
  payload: ClientPacketMap[T]
) => void;

// --- Pakiety przychodzące z serwera C++ do Reacta ---
export type ServerPacket =
  | { type: 'LOBBY_UPDATE'; payload: { players: PlayerInfo[] } }
  | { type: 'GAME_STARTED'; payload: Record<string, unknown> }
  | { type: 'TIME_LEFT'; payload: { seconds: number } }
  | { type: 'PLAYER_GUESSED'; payload: { nickname: string; earnedPoints: number } }
  | { type: 'ERROR'; payload: { code: string; message: string } };