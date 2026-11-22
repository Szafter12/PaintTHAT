import type { PlayerInfo } from '../types/game';
import '../styles/menu.css';
import '../styles/game.css';

interface PlayerRoomViewProps {
  roomCode: string;
  nickname: string;
  avatar: string;
  players?: PlayerInfo[];
  onLeave: () => void;
}

export function PlayerRoomView({ roomCode, nickname, avatar, players = [], onLeave }: PlayerRoomViewProps) {
  return (
    <div className="menu player-screen">
      <div className="avatar-display">
        <img src={avatar} alt="Avatar gracza" className="avatar" />
      </div>

      <h2>Witaj, {nickname}!</h2>
      <h1 className="room-title">
        Pokój: {roomCode}
      </h1>

      <p className="room-info">
        Czekamy, aż Host rozpocznie grę...
      </p>

      {players.length > 0 && (
        <div className="room-players">
          <h3>Połączeni gracze ({players.length}):</h3>
          <ul>
            {players.map((p) => (
              <li
                key={p.nickname}
                className={`room-player ${p.nickname === nickname ? 'me' : ''}`}
              >
                {p.avatar && <img src={p.avatar} alt="" className="avatar-round sm" />}
                <span>{p.nickname}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        className="return-button room-leave"
        onClick={onLeave}
      ></button>
    </div>
  );
}
