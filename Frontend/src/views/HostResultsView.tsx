import { useEffect } from 'react';
import { playSound } from '../hooks/sounds';
import type { PlayerInfo } from '../types/game';
import '../styles/host.css';
import '../styles/game.css';

interface HostResultsViewProps {
  players: PlayerInfo[];
  onBack: () => void;
}

const PODIUM_SLOTS = [
  { place: 2, cls: 'second' },
  { place: 1, cls: 'first' },
  { place: 3, cls: 'third' },
];

export function HostResultsView({ players, onBack }: HostResultsViewProps) {
  const ranking = [...players].sort((a, b) => b.points - a.points);

  useEffect(() => {
    const t = window.setTimeout(() => playSound('fanfare'), 1200);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="host results-screen">
      <header className="host-header">
        <div className="logo-area">
          <div className="host-logo" role="img" aria-label="Logo"></div>
        </div>
      </header>

      <main className="results-main">
        <section className="podium">
          {PODIUM_SLOTS.map(({ place, cls }) => {
            const player = ranking[place - 1];
            if (!player) return null;
            return (
              <div key={place} className={`podium-slot ${cls}`}>
                <div className="podium-name">{player.nickname}</div>
                <div className="podium-bar">
                  <span className="podium-place">{place}</span>
                  <span className="podium-points">{player.points} pkt</span>
                </div>
              </div>
            );
          })}
        </section>

        <section className="panel results-panel">
          <h2>Wyniki końcowe:</h2>
          <ol className="results-list">
            {ranking.map((player, index) => (
              <li
                key={`${player.nickname}-${index}`}
                style={{ animationDelay: `${1.4 + index * 0.12}s` }}
              >
                <span className="results-rank">{index + 1}.</span>
                {player.avatar && (
                  <img src={player.avatar} alt="" className="avatar-round md" />
                )}
                <span className="results-name">{player.nickname}</span>
                <span className="results-points">{player.points} pkt</span>
              </li>
            ))}
          </ol>

          <button
            className="return-button results-return"
            onClick={onBack}
            title="Powrót do lobby"
            aria-label="Powrót do lobby"
          />
        </section>
      </main>
    </div>
  );
}