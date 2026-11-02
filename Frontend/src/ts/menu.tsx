import { useState } from 'react';
import { ASSETS } from './assets';
import '../styles/menu.css';

interface MenuProps {
  onHOST: (username: string, avatar: string) => void;
  onPLAYER: (roomCode: string, avatar: string) => void;
}

export function Menu({ onHOST, onPLAYER }: MenuProps) {
  const [index, setIndex] = useState(0);
  const [activeSection, setActiveSection] = useState<'main' | 'host' | 'signin' | 'signup'>('main');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const avatars = ASSETS.avatars;

  return (
    <div className="menu">
      <img src={ASSETS.logo} alt="Logo" className="logo" />

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

      {activeSection === 'main' && (
        <div className="menu-buttons">
          <button className="host-button" onClick={() => setActiveSection('host')} />
          <button className="player-button" onClick={() => onPLAYER('', avatars[index])} />
        </div>
      )}

      {activeSection === 'host' && (
        <div className="host-section">
          <button className="signin-button" onClick={() => setActiveSection('signin')} />
          <button className="signup-button" onClick={() => setActiveSection('signup')} />
          <button className="return-button" onClick={() => setActiveSection('main')} />
        </div>
      )}

      {activeSection === 'signin' && (
        <div id="login-section-host">
          <div className="control-group">
            <label htmlFor="username">Nick/Email:</label>
            <input 
              type="text" 
              id="username" 
              className="game-input" 
              placeholder="Wpisz nick..." 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="control-group">
            <label htmlFor="password">Hasło:</label>
            <input 
              type="password" 
              id="password" 
              className="game-input" 
              placeholder="Wpisz hasło..." 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />	
          </div>
          <button className="return-button" onClick={() => setActiveSection('host')} />
          <button className="start-button" onClick={() => onHOST(username || 'Gracz', avatars[index])} />
        </div>
      )}

      {activeSection === 'signup' && (
        <div id="register-section-host">
          <div className="control-group">
            <label htmlFor="signup-username">Nick/Email:</label>
            <input 
              type="text" 
              id="signup-username" 
              className="game-input" 
              placeholder="Wpisz nick..." 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="control-group">
            <label htmlFor="signup-password">Hasło:</label>
            <input 
              type="password" 
              id="signup-password" 
              className="game-input" 
              placeholder="Wpisz hasło..." 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />	
          </div>
          <button className="return-button" onClick={() => setActiveSection('host')} />
          <button className="start-button" onClick={() => onHOST(username || 'NowyGracz', avatars[index])} />
        </div>
      )}
    </div>
  );
}