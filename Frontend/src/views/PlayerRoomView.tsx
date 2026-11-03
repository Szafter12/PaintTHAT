import '../styles/menu.css';

interface PlayerRoomViewProps {
  roomCode: string;
  nickname: string;
  avatar: string;
  onLeave: () => void;
}

export function PlayerRoomView({ roomCode, nickname, avatar, onLeave }: PlayerRoomViewProps) {
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
        className="return-button"
        onClick={onLeave}
        style={{ marginTop: '30px' }}
      >
      </button>
    </div>
  );
}