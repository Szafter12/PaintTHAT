import type { PlayerInfo } from '../types/game';
import type { SendPacketFn } from '../types/websocket';

interface HostGameViewProps {
  roomCode: string;
  nickname: string;
  avatar: string;
  players: PlayerInfo[];
  sendPacket: SendPacketFn;
  onLeave: () => void;
}

export function HostGameView({}: HostGameViewProps) {
  return <div>ekran gry hosta głowny duzy</div>;
}