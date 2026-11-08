import type { PlayerInfo } from './game';

export interface ClientPacketMap {
  HOST_INIT: Record<string, never>;
  PLAYER_JOIN: { nickname: string; avatar: string };
  START_GAME: { maxRounds: number; roundTime: number; customWords: string[] };
  

  PICKED_WORD: { guessWord: string }; 
  
  SUBMIT_GUESS: { guess: string };
  DRAW_BROADCAST: { x: number; y: number; prevX: number; prevY: number; color: string; size: number; isEraser: boolean };
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

export type ServerPacket =
  | { type: 'ERROR'; payload: { code: string; message: string } }
  | { type: 'LOBBY_UPDATE'; payload: { pin: string; players: PlayerInfo[] } }
  | { type: 'CHOOSE_WORD'; payload: { words: string[] } }
  | { type: 'GAME_STARTED'; payload: Record<string, never> }
  | { type: 'WAITING_FOR_WORD'; payload: { drawer: string } }
  | { type: 'TIME_LEFT'; payload: { time: number } } // u Ciebie to "time", nie "seconds"
  | { type: 'LOBBY_INITIATED'; payload: { maxRounds: number; roundTime: number } }
  | { type: 'PLAYER_GUESSED_CORRECTLY'; payload: { nickname: string; pointAwarded: number; totalPoints: number } }
  | { type: 'PLAYER_GUESSED_MISS'; payload: { nickname: string; guessWord: string } }
  | { type: 'PLAYER_GUESSED_ALMOST'; payload: { nickname: string; guessWord: string } }
  | { type: 'DRAWER_QUIT'; payload: { nickname: string } }
  | { type: 'DRAW_BROADCAST'; payload: ClientPacketMap['DRAW_BROADCAST'] }
  | { type: 'ROUND_END'; payload: { leaderboard: any } };