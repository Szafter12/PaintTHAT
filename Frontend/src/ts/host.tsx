import { useState, KeyboardEvent } from 'react';
import '../styles/host.css';

interface PlayerInfo {
  nickname: string;
  avatar: string;
}

interface HostProps {
  username: string;
  selectedAvatar: string;
  players: PlayerInfo[];
  onRoomCreated: (code: string) => void;
  onStartGame: () => void;
  onLogout: () => void;
}

export function Host({ username, selectedAvatar, players = [], onRoomCreated, onStartGame, onLogout }: HostProps) {
  const [customWords, setCustomWords] = useState<string[]>([]);
  const [wordInput, setWordInput] = useState('');
  const [roomCode, setRoomCode] = useState<string | null>(null);

  const handleCreateLobby = () => {
    const generatedCode = Math.floor(1000 + Math.random() * 9000).toString();
    setRoomCode(generatedCode);
    
    if (onRoomCreated) {
      onRoomCreated(generatedCode);
    }
  };

  const handleAddWord = () => {
    const trimmed = wordInput.trim();
    if (trimmed !== '') {
      setCustomWords([...customWords, trimmed]);
      setWordInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddWord();
    }
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
          <h2>Kod Pokoju: {roomCode ? <span style={{ color: '#ff0055' }}>{roomCode}</span> : '----'}</h2>

          {!roomCode ? (
            <button 
              id="create-lobby-btn" 
              className="create-lobby-btn" 
              onClick={handleCreateLobby}
            >
              Stwórz Pokój
            </button>
          ) : (
            <p style={{ fontSize: '18px', color: '#aaa', marginTop: '10px' }}>
              Podaj ten kod graczom, aby mogli dołączyć.
            </p>
          )}

          <h3>Ustawienia:</h3>
          <div className="control-group">
            <label htmlFor="round">ilość rund:</label>
            <input type="text" id="round" className="game-input" placeholder="Wpisz liczbę rund..." />
          </div>
          <div className="control-group">
            <label htmlFor="time">długość rundy:</label>
            <input type="text" id="time" className="game-input" placeholder="Wpisz długość rundy..." />
          </div>
        </div>
        
        <div className="panel right-panel">
          <h3 className="panel-subtitle">POŁĄCZENI GRACZE</h3>

          <div className="players-list-container" style={{ margin: '15px 0', width: '100%', minHeight: '80px' }}>
            <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
              {players.length === 0 ? (
                <li style={{ color: 'gray', fontSize: '18px' }}>Brak połączonych graczy...</li>
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
            onClick={onStartGame}/>
        </div>
      </main>
    </div>
  );
}