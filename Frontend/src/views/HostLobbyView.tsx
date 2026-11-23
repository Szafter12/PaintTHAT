import { useEffect, useRef, useState } from 'react';
import { playSound } from '../hooks/sounds';
import type { KeyboardEvent } from 'react';
import type { GameSettings, PlayerInfo } from '../types/game';
import type { SendPacketFn } from '../types/websocket';
import '../styles/host.css';
import '../styles/game.css';

interface HostLobbyViewProps {
  sendPacket: SendPacketFn;
  username: string;
  selectedAvatar: string;
  players: PlayerInfo[];
  roomCode: string;
  onStartGame: (settings: GameSettings | any) => void;
  onLogout: () => void;
  /** Ustawienia z poprzedniej gry (po powrocie z ekranu wyników). */
  /** Host usuwa gracza z lobby. */
  onKickPlayer?: (nickname: string) => void;
  initialSettings?: { maxRounds: number; roundTime: number; customWords: string[] };
}

export function HostLobbyView({
  username,
  selectedAvatar,
  players = [],
  roomCode,
  onStartGame,
  onLogout,
  initialSettings,
  onKickPlayer,
}: HostLobbyViewProps) {
  const [customWords, setCustomWords] = useState<string[]>(initialSettings?.customWords ?? []);
  const [wordInput, setWordInput] = useState<string>('');

  const [maxRounds, setMaxRounds] = useState<number>(initialSettings?.maxRounds ?? 3);
  const [roundTime, setRoundTime] = useState<number>(initialSettings?.roundTime ?? 60);
  
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [confirmKick, setConfirmKick] = useState<string | null>(null);

  // Dźwięk, gdy ktoś nowy dołączy do pokoju
  const prevCountRef = useRef<number>(players.length);
  useEffect(() => {
    if (players.length > prevCountRef.current) playSound('join');
    prevCountRef.current = players.length;
  }, [players.length]);

  const handleAddWord = () => {
    const trimmed = wordInput.trim();
    if (trimmed !== '') {
      setCustomWords((prev) => [...prev, trimmed]);
      setWordInput('');
    }
  };

  const handleRemoveWord = (index: number) => {
    setCustomWords((prev) => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddWord();
    }
  };

  const handleStartGameClick = async () => {
    setIsStarting(true);

    const rounds = Math.max(1, Math.floor(maxRounds) || 1);
    const time = Math.max(10, Math.floor(roundTime) || 60);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5098/api';
      const response = await fetch(`${API_URL}/words/random?count=15`);
      
      if (!response.ok) {
        throw new Error('Błąd pobierania z bazy danych');
      }
      
      const dbWords: string[] = await response.json();

      const finalWords = [...customWords, ...dbWords];
      
      finalWords.sort(() => Math.random() - 0.5);

      onStartGame({
        maxRounds: rounds,
        roundTime: time,
        words: finalWords,
        customWords,
      });

    } catch (error) {
      console.error("Nie udało się pobrać słów. Start z zestawem awaryjnym:", error);
      
      const fallbackWords = [...customWords, "Pies", "Kot", "Drzewo", "Auto", "Dom", "Programista"];
      fallbackWords.sort(() => Math.random() - 0.5);

      onStartGame({
        maxRounds: rounds,
        roundTime: time,
        words: fallbackWords,
        customWords,
      });
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="host">
      <header className="host-header">
        <div className="logo-area">
          {/* Logo z CSS (--logo-img w assets.css) */}
          <div className="host-logo" role="img" aria-label="Logo"></div>
        </div>
        <div className="user-actions">
          {selectedAvatar && (
            <img
              src={selectedAvatar}
              alt="Avatar Hosta"
              className="avatar-round host-avatar"
            />
          )}
          <div className="host-profile">{username}</div>
          <button id="logout-btn" className="logout-btn" onClick={onLogout}></button>
        </div>
      </header>

      {showSettings ? (
        <main className="settings-main">
          <div className="panel settings-panel">
            <div className="settings-column">
              <h2>Ustawienia:</h2>

              <div className="control-group">
                <label htmlFor="round">Ilość rund:</label>
                <input
                  type="number"
                  id="round"
                  className="game-input"
                  min={1}
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
                  min={10}
                  value={roundTime}
                  onChange={(e) => setRoundTime(Number(e.target.value))}
                  placeholder="Wpisz długość rundy..."
                />
              </div>

              <div className="control-group">
                <label htmlFor="custom-word">Własne słowa (opcjonalnie):</label>
                <div className="add-word-row">
                  <input
                    type="text"
                    id="custom-word"
                    className="game-input"
                    value={wordInput}
                    onChange={(e) => setWordInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Dodaj własne hasło..."
                  />
                  <button className="game-btn" onClick={handleAddWord}>+</button>
                </div>
              </div>
            </div>

            <div className="settings-column">
              <div className="pixel-frame words-frame">
                <h3>LISTA WŁASNYCH SŁÓW:</h3>
                <ul className="word-list">
                  {customWords.map((word, idx) => (
                    <li key={idx}>
                      <span>{word}</span>
                      <button
                        className="word-remove"
                        onClick={() => handleRemoveWord(idx)}
                        title="Usuń słowo"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <button
              className="return-button settings-return"
              onClick={() => setShowSettings(false)}
            />
          </div>
        </main>
      ) : (
      <main className="host-main">
        <div className="panel left-panel">
          <div className="room-code-row">
            <h2>Kod Pokoju: <span className="accent">{roomCode}</span></h2>
            <button className="game-btn" onClick={() => setShowSettings(true)}>
              Ustawienia:
            </button>
          </div>

          {/* Miejsce na kod QR (generowany z kodu pokoju – do dodania później) */}
          <div className="pixel-frame qr-frame">
            <p className="hint-text">
              Podaj kod graczom, aby mogli dołączyć.
            </p>
          </div>
        </div>

        <div className="panel right-panel">
          <h3 className="panel-subtitle">POŁĄCZENI GRACZE ({players.length})</h3>

          <div className="players-list">
            <ul>
              {players.length === 0 ? (
                <li className="empty-text">Oczekiwanie na graczy...</li>
              ) : (
                players.map((player) => (
                  <li key={player.nickname} className="lobby-player">
                    {player.avatar && (
                      <img
                        src={player.avatar}
                        alt={player.nickname}
                        className="avatar-round md"
                      />
                    )}
                    <span className="lobby-player-name">{player.nickname}</span>

                    {onKickPlayer && (
                      confirmKick === player.nickname ? (
                        <span className="kick-confirm">
                          <button
                            className="kick-btn yes"
                            onClick={() => { onKickPlayer(player.nickname); setConfirmKick(null); }}
                          >
                            Wyrzuć
                          </button>
                          <button className="kick-btn" onClick={() => setConfirmKick(null)}>
                            Nie
                          </button>
                        </span>
                      ) : (
                        <button
                          className="kick-btn"
                          title={`Wyrzuć gracza ${player.nickname}`}
                          onClick={() => setConfirmKick(player.nickname)}
                        >
                          ×
                        </button>
                      )
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="lobby-start-area">
            {isStarting && <p className="loading-text">Ładowanie słów...</p>}
            <button
              className="start-button lobby-start"
              id="join-lobby-btn"
              onClick={handleStartGameClick}
              disabled={players.length === 0 || isStarting}
            ></button>
          </div>
        </div>
      </main>
      )}
    </div>
  );
}
