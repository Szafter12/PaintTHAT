import { useState } from 'react';
import { ASSETS } from './assets';

interface PlayerMenuProps {
  initialRoomCode: string;
  selectedAvatar: string;
  onJoinLobby: (roomCode: string, nickname: string, avatar: string) => void;
  onBack: () => void;
}

export function PlayerMenu({ initialRoomCode, selectedAvatar, onJoinLobby, onBack }: PlayerMenuProps) {
  const avatars = ASSETS.avatars;
  
  const initialIndex = avatars.indexOf(selectedAvatar) !== -1 ? avatars.indexOf(selectedAvatar) : 0;
  const [index, setIndex] = useState(initialIndex);
  
  const [roomCode, setRoomCode] = useState(initialRoomCode || '');
  const [nickname, setNickname] = useState('');

  const handleStart = () => {
    if (!nickname.trim()) {
      alert('Wpisz swój nick!');
      return;
    }
    if (!roomCode.trim()) {
      alert('Wpisz numer pokoju!');
      return;
    }

    onJoinLobby(roomCode.trim(), nickname.trim(), avatars[index]);
  };

  return (
    <div id="login-section-player" className="menu">
      <div className="avatar-selection">
        <button 
          className="left-avatar-btn" 
          onClick={() => setIndex((index - 1 + avatars.length) % avatars.length)}
        />
        <div className="avatar-display">
          <img src={avatars[index]} alt="Avatar" className="avatar" />
        </div>
        <button 
          className="right-avatar-btn" 
          onClick={() => setIndex((index + 1) % avatars.length)}
        />
      </div>

      <div className="control-group">
        <label htmlFor="player-nick">Twój Nick:</label>
        <input 
          type="text" 
          id="player-nick" 
          className="game-input" 
          placeholder="Wpisz nick..." 
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
      </div>

      <div className="control-group">
        <label htmlFor="room-code">NUMER POKOJU:</label>
        <input 
          type="text" 
          id="room-code" 
          className="game-input" 
          placeholder="Wpisz numer..." 
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
        />
      </div>

      <div className="menu-buttons" style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
        <button className="return-button" onClick={onBack} />
        <button className="start-button" onClick={handleStart} />
      </div>
    </div>
  );
}