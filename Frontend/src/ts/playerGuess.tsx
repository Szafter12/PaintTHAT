interface PlayerGuessProps {
  roomCode?: string;
  nickname?: string;
  avatar?: string;
  onLeave?: () => void;
}

export function PlayerGuess({}: PlayerGuessProps) {
  return <div>ekran zgadujacego</div>;
}