import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { SendPacketFn } from '../types/websocket';

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
      <div className="menu" style={{ textAlign: 'center', padding: '40px' }}>
        <h2>Zaraz zaczynamy!</h2>
        <p style={{ fontSize: '24px', color: '#ff0055', margin: '20px 0' }}>
          {currentDrawer} wybiera słowo...
        </p>
      </div>
    );
  }

  // NOWE: Ekran sukcesu!
  if (hasGuessed) {
    return (
      <div className="menu" style={{ textAlign: 'center', padding: '40px', backgroundColor: 'rgba(0, 255, 0, 0.1)' }}>
        <h2 style={{ color: '#00ff00', fontSize: '36px', marginBottom: '20px' }}>Brawo!</h2>
        <p style={{ fontSize: '22px', color: 'white' }}>
          Odgadłeś hasło. Oczekiwanie na koniec rundy...
        </p>
      </div>
    );
  }

  return (
    <div className="menu" style={{ textAlign: 'center', padding: '40px' }}>
      <h3 style={{ color: '#aaa', marginBottom: '20px' }}>Obecnie rysuje: {currentDrawer}</h3>
      
      <div className="control-group">
        <label>Zgadnij hasło:</label>
        <input 
          type="text" 
          className="game-input" 
          placeholder="Wpisz hasło..." 
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
      </div>
      <button 
        className="start-button" 
        style={{ marginTop: '20px' }} 
        onClick={submitGuess}
      ></button>
    </div>
  );
}