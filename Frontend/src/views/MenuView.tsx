import { useState } from 'react';
import { ASSETS } from '../assets';
import { signInWithGoogle } from '../api/googleAuth';
import { showNotice } from '../hooks/notice';
import '../styles/menu.css';
import '../styles/game.css';

interface MenuViewProps {
  onHOST: (username: string, avatar: string) => void;
  onPLAYER: (roomCode: string, avatar: string) => void;
}

type MenuSection = 'main' | 'host' | 'signin' | 'signup';

export function MenuView({ onHOST, onPLAYER }: MenuViewProps) {
  const [index, setIndex] = useState<number>(0);
  const [activeSection, setActiveSection] = useState<MenuSection>('main');

  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const [googleBusy, setGoogleBusy] = useState<boolean>(false);

  const avatars = ASSETS.avatars;

  // Logowanie / rejestracja przez Google (okno popup Google Identity Services).
  const handleGoogle = async (mode: 'signin' | 'signup') => {
    if (googleBusy) return;
    setGoogleBusy(true);
    try {
      const profile = await signInWithGoogle(mode);
      onHOST(profile.name || profile.email, avatars[index]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nie udało się zalogować przez Google.';
      showNotice(message, { title: 'Google' });
    } finally {
      setGoogleBusy(false);
    }
  };

  const avatarPicker = (
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
  );

  // ---------------------------------------------------------
  // MENU GŁÓWNE
  // ---------------------------------------------------------
  if (activeSection === 'main') {
    return (
      <div className="menu">
        <img src={ASSETS.logo} alt="Logo" className="logo" />

        {avatarPicker}

        <div className="menu-buttons">
          <button className="host-button" onClick={() => setActiveSection('host')} />
          <button className="player-button" onClick={() => onPLAYER('', avatars[index])} />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // HOST: wybór logowania.
  // Po lewej Sign in / Sign up (aktywny przycisk świeci grafiką „hover”),
  // po prawej: avatar albo formularz logowania / rejestracji.
  // ---------------------------------------------------------
  const isSignin = activeSection === 'signin';
  const isSignup = activeSection === 'signup';

  return (
    <div className="host-choice">
      <img src={ASSETS.logo} alt="Logo" className="host-choice-logo" />

      <div className="host-choice-buttons">
        <button
          className={`signin-button ${isSignin ? 'active' : ''}`}
          onClick={() => setActiveSection('signin')}
        />
        <button
          className={`signup-button ${isSignup ? 'active' : ''}`}
          onClick={() => setActiveSection('signup')}
        />
      </div>

      <div className="host-choice-content">
        {activeSection === 'host' && avatarPicker}

        {isSignin && (
          <div id="login-section-host" className="auth-section">
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
            <div className="menu-buttons">
              <button className="return-button" onClick={() => setActiveSection('host')} />
              <button
                className="google-button"
                disabled={googleBusy}
                onClick={() => handleGoogle('signin')}
              >
                {googleBusy ? '...' : 'Sign in with Google'}
              </button>
              <button className="signin-button" onClick={() => onHOST(username || 'Gracz', avatars[index])} />
            </div>
          </div>
        )}

        {isSignup && (
          <div id="register-section-host" className="auth-section">
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
            <div className="menu-buttons">
              <button className="return-button" onClick={() => setActiveSection('host')} />
              <button
                className="google-button"
                disabled={googleBusy}
                onClick={() => handleGoogle('signup')}
              >
                {googleBusy ? '...' : 'Sign up with Google'}
              </button>
              <button className="signup-button" onClick={() => onHOST(username || 'NowyGracz', avatars[index])} />
            </div>
          </div>
        )}
      </div>

      <button
        className="return-button host-choice-return"
        onClick={() => setActiveSection('main')}
      />
    </div>
  );
}
