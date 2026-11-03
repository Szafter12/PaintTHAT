import { useState, KeyboardEvent } from 'react';
import type { GameSettings, PlayerInfo } from '../types/game'; // <-- DODANE 'type'
import '../styles/host.css';

interface HostLobbyViewProps {
  username: string;
  selectedAvatar: string;
  players: PlayerInfo[];
  roomCode: string;
  onStartGame: (settings: GameSettings) => void;
  onLogout: () => void;
}

export function HostLobbyView({
  username,
  selectedAvatar,
  players = [],
  roomCode,
  onStartGame,
  onLogout,
}: HostLobbyViewProps) {
  const [customWords, setCustomWords] = useState<string[]>([]);
  const [wordInput, setWordInput] = useState<string>('');

  const [maxRounds, setMaxRounds] = useState<number>(3);
  const [roundTime, setRoundTime] = useState<number>(60);

  const handleAddWord = () => {
    const trimmed = wordInput.trim();
    if (trimmed !== '') {
      setCustomWords((prev) => [...prev, trimmed]);
      setWordInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddWord();
    }
  };

  const handleStartGameClick = () => {
    onStartGame({
      maxRounds,
      roundTime,
      customWords,
    });
  };

  return (
    <div className="host">
      <header className="host-header">
        <div className="logo-area">
          <div className="logo"></div>
        </div>
        <div className="user-actions">
          {selectedAvatar && (
            <img
              src={selectedAvatar}
              alt="Avatar Hosta"
              style={{ width: '35px', height: '35px', borderRadius: '50%' }}
            />
          )}
          <div className="host-profile">{username}</div>
          <button id="logout-btn" className="logout-btn" onClick={onLogout}></button>
        </div>
      </header>

      <main className="host-main">
        <div className="panel left-panel">
          <h2>Kod Pokoju: <span style={{ color: '#ff0055' }}>{roomCode}</span></h2>
          <p style={{ fontSize: '18px', color: '#aaa', marginTop: '10px' }}>
            Podaj ten kod graczom, aby mogli dołączyć.
          </p>

          <h3>Ustawienia:</h3>
          <div className="control-group">
            <label htmlFor="round">Ilość rund:</label>
            <input
              type="number"
              id="round"
              className="game-input"
              value={maxRounds}
              onChange={(e) => setMaxRounds(Number(e.target.value))}
              placeholder="Wpisz liczbę rund..."
            />
          </div>
          <div className="control-group">
            <label htmlFor="time">Długość rundy (s):</label>
            <input
              type="number"
              id="time"
              className="game-input"
              value={roundTime}
              onChange={(e) => setRoundTime(Number(e.target.value))}
              placeholder="Wpisz długość rundy..."
            />
          </div>

          <h3>Własne słowa (opcjonalnie):</h3>
          <div className="control-group" style={{ flexDirection: 'row', gap: '10px' }}>
            <input
              type="text"
              className="game-input"
              value={wordInput}
              onChange={(e) => setWordInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Dodaj własne hasło..."
            />
            <button onClick={handleAddWord} style={{ padding: '10px 20px', cursor: 'pointer' }}>+</button>
          </div>
          <ul style={{ listStyleType: 'none', padding: 0, marginTop: '10px', color: 'white' }}>
            {customWords.map((word, idx) => (
              <li key={idx}>- {word}</li>
            ))}
          </ul>
        </div>

        <div className="panel right-panel">
          <h3 className="panel-subtitle">POŁĄCZENI GRACZE ({players.length})</h3>

          <div className="players-list-container" style={{ margin: '15px 0', width: '100%', minHeight: '80px' }}>
            <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
              {players.length === 0 ? (
                <li style={{ color: 'gray', fontSize: '18px' }}>Oczekiwanie na graczy...</li>
              ) : (
                players.map((player, index) => (
                  <li
                    key={index}
                    style={{
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '10px',
                      fontSize: '22px'
                    }}
                  >
                    {player.avatar && (
                      <img
                        src={player.avatar}
                        alt={player.nickname}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'contain' }}
                      />
                    )}
                    <span>{player.nickname}</span>
                  </li>
                ))
              )}
            </ul>
          </div>

          <button
            className="start-button"
            id="join-lobby-btn"
            style={{ marginTop: '20px' }}
            onClick={handleStartGameClick}
            disabled={players.length === 0}
          >
          </button>
        </div>
      </main>
    </div>
  );
}