import { useState } from 'react';
import { isSoundEnabled, setSoundEnabled } from '../hooks/sounds';
import '../styles/game.css';

// Mały przełącznik dźwięku (lewy dolny róg ekranu hosta)
export function SoundToggle() {
  const [on, setOn] = useState<boolean>(isSoundEnabled());

  const toggle = () => {
    setSoundEnabled(!on);
    setOn(!on);
  };

  return (
    <button className="game-btn sound-toggle" onClick={toggle} title="Włącz / wyłącz dźwięki">
      {on ? '🔊 Dźwięk' : '🔇 Wyciszono'}
    </button>
  );
}
