import { useEffect, useRef, useState } from 'react';
import type { PlayerInfo, ChatMessage } from '../types/game'; 
import type { SendPacketFn } from '../types/websocket';
import '../styles/game.css';

interface HostGameViewProps {
  roomCode: string;
  nickname: string; 
  avatar: string;   
  players: PlayerInfo[];
  currentDrawer: string | null;
  isRoundActive: boolean;
  timeLeft: number;
  chatMessages: ChatMessage[];
  sendPacket: SendPacketFn;
  onLeave: () => void;
}

// Avatar z zabezpieczeniem: gdy src jest pusty albo się nie ładuje,
// pokazujemy kółko z pierwszą literą nicka zamiast zepsutego obrazka.
function ScoreAvatar({ src, nickname }: { src?: string; nickname: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="avatar-round lg avatar-fallback">
        {nickname.charAt(0).toUpperCase() || '?'}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={nickname}
      className="avatar-round lg"
      onError={() => {
        console.warn('Nie załadowano avatara gracza', nickname, '→ src =', src);
        setFailed(true);
      }}
    />
  );
}

export function HostGameView({ players, currentDrawer, isRoundActive, timeLeft, chatMessages }: HostGameViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showStart, setShowStart] = useState(false);

  // Krótki napis „START!” w chwili, gdy zaczyna się rysowanie
  useEffect(() => {
    if (!isRoundActive) return;
    setShowStart(true);
    const t = window.setTimeout(() => setShowStart(false), 1400);
    return () => window.clearTimeout(t);
  }, [isRoundActive, currentDrawer]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Rysowanie z pominięciem Reacta (60 FPS)
    const handleStroke = (e: CustomEvent) => {
      // Odbieramy dokładne dane zgodne z Twoim PacketBuilder.hpp
      const { x, y, prevX, prevY, color, size, isEraser } = e.detail;
      
      // Sygnał „wyczyść płótno” – rysownik wysyła go jako DRAW_BROADCAST z x = y = -1,
      // bo ten pakiet serwer na pewno przekazuje do hosta.
      if (x < 0 || y < 0) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }
      
      const realX = x * canvas.width;
      const realY = y * canvas.height;
      const realPrevX = prevX * canvas.width;
      const realPrevY = prevY * canvas.height;

      ctx.lineWidth = size;
      ctx.lineCap = 'round';
      
      if (isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = color;
      }

      ctx.beginPath();
      // Startujemy od poprzedniego punktu (z C++) i rysujemy do obecnego
      ctx.moveTo(realPrevX, realPrevY);
      ctx.lineTo(realX, realY);
      ctx.stroke();
    };

    const handleClear = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    window.addEventListener('draw-broadcast', handleStroke as EventListener);
    window.addEventListener('clear-canvas', handleClear);

    return () => {
      // POPRAWKA: wcześniej było addEventListener (wyciek listenerów)
      window.removeEventListener('draw-broadcast', handleStroke as EventListener);
      window.removeEventListener('clear-canvas', handleClear);
    };
  }, []);

  // POPRAWKA: kopia tablicy, żeby nie mutować propsów
  const sortedPlayers = [...players].sort((a, b) => b.points - a.points);

  // Ostatnie słowo wpisane przez każdego gracza w tej rundzie (czat jest czyszczony przy nowej rundzie)
  const lastByPlayer = new Map<string, ChatMessage>();
  for (const msg of chatMessages) {
    lastByPlayer.set(msg.nickname, msg);
  }

  return (
    <div className="game-host">
      {showStart && <div className="round-start-flash">START!</div>}
      
      {/* LEWA STRONA: Płótno i Czas */}
      <div className="game-host-main">
        
        {/* Scena: pasek + płótno 4:3 skalują się tak, żeby zawsze mieściły się w oknie */}
        <div className="game-stage">
          <div className="game-stage-inner">
            <div className="game-topbar">
              <h2 className="game-status">
                {!isRoundActive ? `${currentDrawer || 'Rysownik'} wybiera słowo...` : `Rysuje: ${currentDrawer}`}
              </h2>
              <h2 className={`game-timer ${timeLeft <= 10 ? 'low' : ''}`}>
                ⏱ {timeLeft}s
              </h2>
            </div>

            <div className="canvas-frame">
              <canvas
                ref={canvasRef}
                width={1024}
                height={768}
                className="game-canvas"
              />
            </div>
          </div>
        </div>
      </div>

      {/* PRAWA STRONA: Tabela Graczy */}
      <aside className="scoreboard">
        <h3 className="scoreboard-title">TABELA WYNIKÓW</h3>
        <ul className="score-list">
          {sortedPlayers.map((p, i) => {
            const last = lastByPlayer.get(p.nickname);
            return (
              <li key={i} className={`score-item ${p.isGuessed ? 'guessed' : ''}`}>
                <ScoreAvatar src={p.avatar} nickname={p.nickname} />
                <div className="score-info">
                  <div className="score-nick">{p.nickname}</div>
                  <div className="score-points">{p.points} pkt</div>
                </div>
                {/* Miejsce na ostatnie słowo wpisane przez gracza */}
                <div className={`score-last-word ${last?.type ?? ''}`} title={last?.text}>
                  {last?.text ?? ''}
                </div>
              </li>
            );
          })}
        </ul>
      </aside>

    </div>
  );
}
