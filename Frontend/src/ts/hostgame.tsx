interface HostGameProps {
  roomCode?: string;
  nickname?: string;
  avatar?: string;
  onLeave?: () => void;
}

export function HostGame({}: HostGameProps) {
  return <div>ekran gry hosta głowny duzy</div>;
}