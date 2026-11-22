import { useState } from 'react';
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

  const submitGuess = () => {
    const trimmed = guess.trim();
    if (trimmed) {
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

  // Ekran sukcesu
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
