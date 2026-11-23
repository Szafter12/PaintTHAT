import { useEffect, useRef, useState } from 'react';
import type { PlayerInfo, ChatMessage, RoundResultPlayer } from '../types/game';
import type { DrawPoint, SendPacketFn } from '../types/websocket';
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
  currentRound: number;
  maxRounds: number;
  sendPacket: SendPacketFn;
  onLeave: () => void;
}

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
      onError={() => setFailed(true)}
    />
  );
}

export function HostGameView({
  players,
  currentDrawer,
  isRoundActive,
  timeLeft,
  chatMessages,
  currentRound,
  maxRounds,
  sendPacket,
}: HostGameViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showStart, setShowStart] = useState(false);
  const [roundEndData, setRoundEndData] = useState<{
    word: string;
    leaderboard: RoundResultPlayer[];
  } | null>(null);

  const clearCanvasBoard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    setRoundEndData(null);
    clearCanvasBoard();
  }, [currentRound, currentDrawer]);

  useEffect(() => {
    if (!isRoundActive) return;
    setRoundEndData(null);
    clearCanvasBoard();
    setShowStart(true);
    const t = window.setTimeout(() => setShowStart(false), 1400);
    return () => window.clearTimeout(t);
  }, [isRoundActive, currentDrawer]);

  useEffect(() => {
    const handleRoundEnd = (e: Event) => {
      const detail = (e as CustomEvent<{ word: string; leaderboard: RoundResultPlayer[] }>).detail;
      clearCanvasBoard();
      if (detail) {
        const sorted = [...(detail.leaderboard || [])].sort((a, b) => b.score - a.score);
        setRoundEndData({
          word: detail.word || '',
          leaderboard: sorted,
        });
      }
    };

    const handleWaiting = () => {
      setRoundEndData(null);
      clearCanvasBoard();
    };

    window.addEventListener('round-end', handleRoundEnd);
    window.addEventListener('waiting-for-word', handleWaiting);
    return () => {
      window.removeEventListener('round-end', handleRoundEnd);
      window.removeEventListener('waiting-for-word', handleWaiting);
    };
  }, []);

  // Odbieranie zgrupowanych ścieżek rysowania
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleStroke = (e: CustomEvent) => {
      const { x, y, prevX, prevY, color, size, isEraser, points } = e.detail as {
        x: number;
        y: number;
        prevX: number;
        prevY: number;
        color: string;
        size: number;
        isEraser: boolean;
        points?: DrawPoint[];
      };

      if (x < 0 || y < 0) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      const scaledSize = size * (canvas.width / 800);
      ctx.lineWidth = scaledSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = '#000000';
        ctx.fillStyle = '#000000';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
      }

      if (Array.isArray(points) && points.length >= 2) {
        const firstX = points[0].x * canvas.width;
        const firstY = points[0].y * canvas.height;
        const lastX = points[points.length - 1].x * canvas.width;
        const lastY = points[points.length - 1].y * canvas.height;

        // Pojedyncze dotknięcie (kropka)
        if (points.length === 2 && firstX === lastX && firstY === lastY) {
          ctx.beginPath();
          ctx.arc(firstX, firstY, scaledSize / 2, 0, Math.PI * 2);
          ctx.fill();
          return;
        }

        ctx.beginPath();
        ctx.moveTo(firstX, firstY);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x * canvas.width, points[i].y * canvas.height);
        }
        ctx.stroke();
      } else {
        const realX = x * canvas.width;
        const realY = y * canvas.height;
        const realPrevX = prevX * canvas.width;
        const realPrevY = prevY * canvas.height;

        ctx.beginPath();
        ctx.moveTo(realPrevX, realPrevY);
        ctx.lineTo(realX, realY);
        ctx.stroke();
      }
    };

    const handleClear = () => {
      clearCanvasBoard();
    };

    window.addEventListener('draw-broadcast', handleStroke as EventListener);
    window.addEventListener('clear-canvas', handleClear);

    return () => {
      window.removeEventListener('draw-broadcast', handleStroke as EventListener);
      window.removeEventListener('clear-canvas', handleClear);
    };
  }, []);

  const handleNextRound = () => {
    setRoundEndData(null);
    clearCanvasBoard();
    sendPacket('NEXT_ROUND', {});
  };

  const sortedPlayers = [...players].sort((a, b) => b.points - a.points);

  const lastByPlayer = new Map<string, ChatMessage>();
  for (const msg of chatMessages) {
    lastByPlayer.set(msg.nickname, msg);
  }

  const drawerLabel = currentDrawer || 'Rysownik';
  const isLastRound = currentRound >= maxRounds;

  return (
    <div className="game-host">
      {showStart && <div className="round-start-flash">START!</div>}

      <div className="game-host-main">
        <div className="game-stage">
          <div className="game-stage-inner">
            <div className="game-topbar">
              <h2 className="game-status">
                {roundEndData
                  ? 'Koniec rundy!'
                  : !isRoundActive
                  ? `${drawerLabel} wybiera słowo...`
                  : `Rysuje: ${drawerLabel}`}
              </h2>
              <h2 className={`game-timer ${timeLeft <= 10 && !roundEndData ? 'low' : ''}`}>
                Runda {currentRound}/{maxRounds} &nbsp;|&nbsp; ⏱ {timeLeft}s
              </h2>
            </div>

            <div className="canvas-frame" style={{ position: 'relative' }}>
              <canvas
                ref={canvasRef}
                width={1024}
                height={768}
                className="game-canvas"
              />

              {roundEndData && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(15, 15, 22, 0.92)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px',
                    borderRadius: 'inherit',
                    zIndex: 10,
                    color: '#fff',
                  }}
                >
                  <h2 style={{ fontSize: '28px', margin: '0 0 8px 0', color: '#aaa' }}>
                    Koniec rundy {currentRound} z {maxRounds}
                  </h2>
                  <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '20px' }}>
                    Hasło to:{' '}
                    <span style={{ color: '#ffd800', textTransform: 'uppercase' }}>
                      {roundEndData.word}
                    </span>
                  </div>

                  <ul
                    style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: '0 0 24px 0',
                      width: '100%',
                      maxWidth: '480px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    {roundEndData.leaderboard.map((entry, idx) => (
                      <li
                        key={entry.nickname}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'rgba(255, 255, 255, 0.08)',
                          padding: '12px 18px',
                          borderRadius: '10px',
                          fontSize: '20px',
                        }}
                      >
                        <span>
                          <strong>{idx + 1}.</strong> {entry.nickname}
                        </span>
                        <span>
                          <span style={{ color: '#00e676', fontWeight: 'bold', marginRight: '14px' }}>
                            +{entry.roundScore} pkt
                          </span>
                          <span style={{ color: '#ccc' }}>({entry.score} pkt)</span>
                        </span>
                      </li>
                    ))}
                  </ul>

                  <button
                    className="game-btn"
                    onClick={handleNextRound}
                    style={{
                      fontSize: '22px',
                      padding: '14px 32px',
                      cursor: 'pointer',
                    }}
                  >
                    {isLastRound ? 'Wyniki końcowe 🏆' : 'Następna runda ➔'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <aside className="scoreboard">
        <h3 className="scoreboard-title">TABELA WYNIKÓW</h3>
        <ul className="score-list">
          {sortedPlayers.map((p, i) => {
            const last = lastByPlayer.get(p.nickname);
            return (
              <li key={p.nickname || i} className={`score-item ${p.isGuessed ? 'guessed' : ''}`}>
                <ScoreAvatar src={p.avatar} nickname={p.nickname} />
                <div className="score-info">
                  <div className="score-nick">{p.nickname}</div>
                  <div className="score-points">{p.points} pkt</div>
                </div>
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