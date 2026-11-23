import { useEffect, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { SendPacketFn } from '../types/websocket';
import '../styles/menu.css';
import '../styles/game.css';

interface PlayerGuessViewProps {
  currentDrawer: string;
  isRoundActive: boolean;
  hasGuessed: boolean;
  sendPacket: SendPacketFn;
}

export function PlayerGuessView({ currentDrawer, isRoundActive, hasGuessed, sendPacket }: PlayerGuessViewProps) {
  const [guess, setGuess] = useState('');
  const [almostWord, setAlmostWord] = useState<string | null>(null);

  useEffect(() => {
    if (!isRoundActive || hasGuessed) {
      setAlmostWord(null);
    }
  }, [isRoundActive, hasGuessed]);

  useEffect(() => {
    let timer: number | undefined;

    const handleAlmost = (e: Event) => {
      const detail = (e as CustomEvent<{ nickname?: string; guessWord?: string }>).detail;
      setAlmostWord(detail?.guessWord || '');
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        setAlmostWord(null);
      }, 4000);
    };

    window.addEventListener('guess-almost', handleAlmost);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('guess-almost', handleAlmost);
    };
  }, []);

  const submitGuess = () => {
    const trimmed = guess.trim();
    if (trimmed) {
      setAlmostWord(null);
      sendPacket('SUBMIT_GUESS', { guess: trimmed });
      setGuess('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submitGuess();
  };

  if (!isRoundActive) {
    return (
      <div className="menu player-screen">
        <h2>Zaraz zaczynamy!</h2>
        <p className="drawer-name">
          {currentDrawer} wybiera słowo...
        </p>
      </div>
    );
  }

  if (hasGuessed) {
    return (
      <div className="menu player-screen guess-success">
        <h2 className="success-title">Brawo!</h2>
        <p className="success-text">
          Odgadłeś hasło. Oczekiwanie na koniec rundy...
        </p>
      </div>
    );
  }

  return (
    <div className="menu player-screen">
      <h3 className="muted">Obecnie rysuje: {currentDrawer}</h3>

      {almostWord !== null && (
        <div
          role="status"
          style={{
            backgroundColor: 'rgba(255, 193, 7, 0.18)',
            border: '2px solid #ffc107',
            color: '#ffd54f',
            borderRadius: '12px',
            padding: '12px 20px',
            marginBottom: '16px',
            fontSize: '20px',
            fontWeight: 'bold',
          }}
        >
          🔥 Prawie zgadłeś! {almostWord ? `„${almostWord}” jest bardzo blisko!` : 'Jesteś bardzo blisko!'}
        </div>
      )}

      <div className="control-group">
        <label htmlFor="guess-input">Zgadnij hasło:</label>
        <input
          id="guess-input"
          type="text"
          className="game-input wide"
          placeholder="Wpisz hasło..."
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
      </div>
      <button
        className="start-button guess-submit"
        onClick={submitGuess}
      ></button>
    </div>
  );
}