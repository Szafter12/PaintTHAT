import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { DrawPoint, SendPacketFn } from '../types/websocket';
import '../styles/menu.css';
import '../styles/game.css';

interface PlayerDrawViewProps {
  nickname: string;
  wordOptions: string[];
  isRoundActive: boolean;
  sendPacket: SendPacketFn;
}

const PALETTE = [
  '#000000', '#7f7f7f', '#ffffff', '#ff0000',
  '#ff7f00', '#ffd800', '#00c000', '#00c8c8',
  '#0050ff', '#7a00ff', '#ff4fd8', '#8b4513',
  '#ffb6a0', '#006400', '#800000', '#000080',
];

export function PlayerDrawView({ wordOptions, isRoundActive, sendPacket }: PlayerDrawViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastLocalPosRef = useRef<{ x: number; y: number } | null>(null);
  const pendingPointsRef = useRef<DrawPoint[]>([]);
  const lastSendTimeRef = useRef<number>(0);
  const activePointerIdRef = useRef<number | null>(null);

  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(5);
  const [isEraser, setIsEraser] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string>('');

  useEffect(() => {
    if (!isRoundActive) {
      setSelectedWord('');
      activePointerIdRef.current = null;
      pendingPointsRef.current = [];
      lastLocalPosRef.current = null;
    }
  }, [wordOptions, isRoundActive]);

  useEffect(() => {
    if (!isRoundActive) return;
    const prev = document.body.style.overscrollBehavior;
    document.body.style.overscrollBehavior = 'none';
    return () => {
      document.body.style.overscrollBehavior = prev;
    };
  }, [isRoundActive]);

  const flushBatch = () => {
    const pts = pendingPointsRef.current;
    if (pts.length < 2) return;

    const first = pts[0];
    const last = pts[pts.length - 1];

    sendPacket('DRAW_BROADCAST', {
      prevX: first.x,
      prevY: first.y,
      x: last.x,
      y: last.y,
      color,
      size,
      isEraser,
      points: [...pts],
    });

    // Ostatni punkt staje się punktem startowym kolejnej paczki – zero przerw w linii
    pendingPointsRef.current = [last];
    lastSendTimeRef.current = performance.now();
  };

  const getPointerPos = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startDrawing = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    // Ignorujemy drugi palec / dłoń, jeśli rysowanie jednym palcem już trwa
    if (activePointerIdRef.current !== null) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    activePointerIdRef.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);

    const pos = getPointerPos(e);
    lastLocalPosRef.current = pos;

    // Rysujemy kropkę lokalnie na start dotknięcia
    ctx.save();
    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000000';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = color;
    }
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const normPt: DrawPoint = {
      x: Number((pos.x / canvas.width).toFixed(4)),
      y: Number((pos.y / canvas.height).toFixed(4)),
    };
    pendingPointsRef.current = [normPt, normPt];
    flushBatch();
  };

  const drawMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (e.pointerId !== activePointerIdRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas || !lastLocalPosRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getPointerPos(e);
    const prev = lastLocalPosRef.current;

    // Rysowanie lokalne
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
    }

    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    lastLocalPosRef.current = pos;

    // Dopisujemy punkt do bufora sieciowego
    pendingPointsRef.current.push({
      x: Number((pos.x / canvas.width).toFixed(4)),
      y: Number((pos.y / canvas.height).toFixed(4)),
    });

    if (performance.now() - lastSendTimeRef.current >= 25) {
      flushBatch();
    }
  };

  const stopDrawing = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (e.pointerId !== activePointerIdRef.current) return;
    flushBatch();
    activePointerIdRef.current = null;
    lastLocalPosRef.current = null;
    pendingPointsRef.current = [];
  };

  const handleClear = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    pendingPointsRef.current = [];
    sendPacket('DRAW_BROADCAST', {
      x: -1, y: -1, prevX: -1, prevY: -1,
      color: '#000000', size: 1, isEraser: false,
    });
    sendPacket('CLEAR_CANVAS', {});
  };

  const handlePickWord = (word: string) => {
    setSelectedWord(word);
    sendPacket('PICKED_WORD', { guessWord: word });
  };

  if (!isRoundActive) {
    return (
      <div className="menu player-screen">
        <h2>Wybierz hasło:</h2>

        <div className="word-choice">
          {wordOptions && wordOptions.length > 0 ? (
            wordOptions.map((word, index) => (
              <button
                key={index}
                className="word-btn"
                onClick={() => handlePickWord(word)}
              >
                {word}
              </button>
            ))
          ) : (
            <p className="empty-text">
              Oczekiwanie na słowa od serwera...
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="draw-screen">
      {!hintDismissed && (
        <div className="rotate-hint">
          <span>📱 Obróć telefon poziomo – będziesz mieć większe płótno</span>
          <button onClick={() => setHintDismissed(true)} aria-label="Zamknij podpowiedź">×</button>
        </div>
      )}

      <div
        style={{
          background: 'rgba(0, 0, 0, 0.75)',
          border: '2px solid #ff0055',
          borderRadius: '10px',
          padding: '8px 18px',
          marginBottom: '8px',
          color: '#fff',
          fontSize: '18px',
          textAlign: 'center',
          fontWeight: 'bold',
        }}
      >
        Hasło do narysowania:{' '}
        <span style={{ color: '#ffd800', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {selectedWord || '—'}
        </span>
      </div>

      <div className="canvas-frame draw-canvas-frame">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="game-canvas"
          style={{ touchAction: 'none' }}
          onPointerDown={startDrawing}
          onPointerMove={drawMove}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
        />
      </div>

      <div className="draw-tools">
        <div className="palette">
          {PALETTE.map((c) => (
            <button
              key={c}
              className={`swatch ${!isEraser && color === c ? 'selected' : ''}`}
              style={{ backgroundColor: c }}
              aria-label={`Kolor ${c}`}
              onClick={() => { setColor(c); setIsEraser(false); }}
            />
          ))}
          <label
            className={`swatch custom ${!isEraser && !PALETTE.includes(color) ? 'selected' : ''}`}
            aria-label="Własny kolor"
          >
            <input
              type="color"
              value={color}
              onChange={(e) => { setColor(e.target.value); setIsEraser(false); }}
            />
          </label>
        </div>

        <div className="size-row">
          <div className="size-preview">
            <span
              style={{
                width: Math.min(size, 40),
                height: Math.min(size, 40),
                backgroundColor: isEraser ? '#fff' : color,
              }}
            />
          </div>
          <input
            type="range"
            className="size-input"
            min="2"
            max="40"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
          />
        </div>

        <div className="tool-buttons">
          <button
            className={`game-btn ${isEraser ? 'active' : ''}`}
            onClick={() => setIsEraser(!isEraser)}
          >
            Gumka
          </button>
          <button className="game-btn danger" onClick={handleClear}>
            Wyczyść
          </button>
        </div>
      </div>
    </div>
  );
}