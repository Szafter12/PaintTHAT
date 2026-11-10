export type AppView = 'menu' | 'host' | 'player' | 'playerRoom' | 'playerGuess' | 'hostGame';

export type UserRole = 'host' | 'player';

export interface PlayerInfo {
  nickname: string;
  avatar: string;
  points: number;
  isDrawer: boolean;
  isGuessed: boolean;
}

export interface HostSession {
  username: string;
  avatar: string;
}

export interface PlayerSession {
  nickname: string;
  avatar: string;
}

export interface GameSettings {
  maxRounds: number;
  roundTime: number;
  words: string[];
}

export interface ChatMessage {
  id: number;
  nickname: string;
  text: string;
  type: 'miss' | 'almost' | 'correct';
}