import type { SendPacketFn } from '../types/websocket';

interface PlayerGuessViewProps {
  roomCode: string;
  nickname: string;
  avatar: string;
  sendPacket: SendPacketFn;
  onLeave: () => void;
}

export function PlayerGuessView({}: PlayerGuessViewProps) {
  return <div>ekran zgadujacego</div>;
}