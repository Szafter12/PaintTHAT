import '../styles/menu.css';

interface PlayerRoomProps {
  roomCode: string;
  nickname: string;
  avatar: string;
  onLeave: () => void;
}

export function PlayerRoom({ roomCode, nickname, avatar, onLeave }: PlayerRoomProps) {
  return (
    <div className="menu" style={{ textAlign: 'center', padding: '40px' }}>
      <div className="avatar-display" style={{ margin: '0 auto 20px' }}>
        <img src={avatar} alt="Avatar gracza" className="avatar" />
      </div>

      <h2>Witaj, {nickname}!</h2>
      <h1 style={{ fontSize: '48px', color: '#ff0055', margin: '20px 0' }}>
        Pokój: {roomCode}
      </h1>

      <p style={{ fontSize: '22px', color: '#ccc' }}>
        Czekamy, aż Host rozpocznie grę...
      </p>

      <button 
        className="ready-button"  
        style={{ marginTop: '30px' }}
      >
        Gotowy
      </button>

      <button 
        className="return-button" 
        onClick={onLeave} 
        style={{ marginTop: '30px' }}
      />
    </div>
  );
}