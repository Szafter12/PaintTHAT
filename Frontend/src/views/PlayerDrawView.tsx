import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { SendPacketFn } from '../types/websocket';
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
  const lastSentPosRef = useRef<{ x: number; y: number } | null>(null);
  const lastSendTimeRef = useRef<number>(0);

  const isDrawingRef = useRef(false);
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(5);
  const [isEraser, setIsEraser] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string>('');

  // Reset wybranego hasła przy nowej puli słów
  useEffect(() => {
    if (!isRoundActive) {
      setSelectedWord('');
    }
  }, [wordOptions, isRoundActive]);

  // Blokujemy „pull to refresh” i przewijanie strony podczas rysowania na telefonie
  useEffect(() => {
    if (!isRoundActive) return;
    const prev = document.body.style.overscrollBehavior;
    document.body.style.overscrollBehavior = 'none';
    return () => {
      document.body.style.overscrollBehavior = prev;
    };
  }, [isRoundActive]);

  const sendSegmentToHost = (fromX: number, fromY: number, toX: number, toY: number, canvas: HTMLCanvasElement) => {
    sendPacket('DRAW_BROADCAST', {
      x: toX / canvas.width,
      y: toY / canvas.height,
      prevX: fromX / canvas.width,
      prevY: fromY / canvas.height,
      color,
      size,
      isEraser,
    });
  };

  const draw = (x: number, y: number, forceSend = false) => {
    if (!canvasRef.current || !lastLocalPosRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prevX = lastLocalPosRef.current.x;
    const prevY = lastLocalPosRef.current.y;

    // 1. Natychmiastowe rysowanie lokalne na telefonie (bez opóźnień)
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
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(x, y);
    ctx.stroke();

    lastLocalPosRef.current = { x, y };

    // 2. Kontrolowane wysyłanie do C++ (max ~60 pakietów/s, żeby nie zapchać WebSocketa)
    const now = performance.now();
    const sentFrom = lastSentPosRef.current ?? { x: prevX, y: prevY };

    if (forceSend || now - lastSendTimeRef.current >= 16) {
      sendSegmentToHost(sentFrom.x, sentFrom.y, x, y, canvas);
      lastSentPosRef.current = { x, y };
      lastSendTimeRef.current = now;
    }
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
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const pos = getPointerPos(e);
    lastLocalPosRef.current = pos;
    lastSentPosRef.current = pos;
    draw(pos.x, pos.y, true);
  };

  const drawMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const pos = getPointerPos(e);
    draw(pos.x, pos.y, false);
  };

  const stopDrawing = (e?: ReactPointerEvent<HTMLCanvasElement>) => {
    if (isDrawingRef.current && e && canvasRef.current && lastSentPosRef.current) {
      const pos = getPointerPos(e);
      if (pos.x !== lastSentPosRef.current.x || pos.y !== lastSentPosRef.current.y) {
        sendSegmentToHost(lastSentPosRef.current.x, lastSentPosRef.current.y, pos.x, pos.y, canvasRef.current);
      }
    }
    isDrawingRef.current = false;
    lastLocalPosRef.current = null;
    lastSentPosRef.current = null;
  };

  const handleClear = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
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

  // ---------------------------------------------------------
  // EKRAN WYBORU SŁOWA (Przed startem rysowania)
  // ---------------------------------------------------------
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

  // ---------------------------------------------------------
  // EKRAN RYSOWANIA
  // ---------------------------------------------------------
  return (
    <div className="draw-screen">
      {!hintDismissed && (
        <div className="rotate-hint">
          <span>📱 Obróć telefon poziomo – będziesz mieć większe płótno</span>
          <button onClick={() => setHintDismissed(true)} aria-label="Zamknij podpowiedź">×</button>
        </div>
      )}

      {/* Pasek z wylosowanym hasłem widoczny zawsze obok/nad płótnem */}
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