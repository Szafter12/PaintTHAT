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
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  
  const isDrawingRef = useRef(false);
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(5);
  const [isEraser, setIsEraser] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(false);

  // Na telefonie blokujemy „pull to refresh” i przewijanie strony podczas rysowania.
  useEffect(() => {
    if (!isRoundActive) return;
    const prev = document.body.style.overscrollBehavior;
    document.body.style.overscrollBehavior = 'none';
    return () => {
      document.body.style.overscrollBehavior = prev;
    };
  }, [isRoundActive]);

  const draw = (x: number, y: number) => {
    if (!canvasRef.current || !lastPosRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prevX = lastPosRef.current.x;
    const prevY = lastPosRef.current.y;

    // Normalizacja do 0.0 - 1.0 dla C++
    const normX = x / canvas.width;
    const normY = y / canvas.height;
    const normPrevX = prevX / canvas.width;
    const normPrevY = prevY / canvas.height;

    sendPacket('DRAW_BROADCAST', { 
      x: normX, 
      y: normY, 
      prevX: normPrevX, 
      prevY: normPrevY, 
      color, 
      size, 
      isEraser 
    });

    // Rysowanie na własnym telefonie
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    
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

    lastPosRef.current = { x, y };
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

  // Pointer Events: jedna obsługa dla palca, rysika i myszy.
  // setPointerCapture – linia nie urywa się, gdy palec wyjedzie poza płótno.
  const startDrawing = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const pos = getPointerPos(e);
    lastPosRef.current = pos;
    draw(pos.x, pos.y);
  };

  const drawMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const pos = getPointerPos(e);
    draw(pos.x, pos.y);
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
    lastPosRef.current = null;
  };

  const handleClear = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    // Host dostaje sygnał jako zwykły DRAW_BROADCAST z x = y = -1 (serwer go przekazuje),
    // dodatkowo wysyłamy osobny pakiet CLEAR_CANVAS na wypadek, gdyby serwer go obsługiwał.
    sendPacket('DRAW_BROADCAST', {
      x: -1, y: -1, prevX: -1, prevY: -1,
      color: '#000000', size: 1, isEraser: false,
    });
    sendPacket('CLEAR_CANVAS', {});
  };

  // ---------------------------------------------------------
  // EKRAN WYBORU SŁOWA (Przed startem rysowania)
  // ---------------------------------------------------------
  if (!isRoundActive) {
    return (
      <div className="menu player-screen">
        <h2>Wybierz hasło:</h2>
        
        <div className="word-choice">
          {/* Zabezpieczenie przed brakiem danych z C++ */}
          {wordOptions && wordOptions.length > 0 ? (
            wordOptions.map((word, index) => (
              <button 
                key={index} 
                className="word-btn"
                onClick={() => sendPacket('PICKED_WORD', { guessWord: word })}
              >
                {word}
              </button>
            ))
          ) : (
            <p className="empty-text">
              Oczekiwanie na słowa od serwera... 
              (Jeśli to trwa długo, upewnij się, że serwer wysłał tablicę słów w pakiecie CHOOSE_WORD).
            </p>
          )}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // EKRAN RYSOWANIA (Aktywuje się, gdy C++ zacznie odliczać czas)
  // ---------------------------------------------------------
  return (
    <div className="draw-screen">
      {/* Widoczne tylko na wąskim ekranie w pionie (patrz CSS) */}
      {!hintDismissed && (
        <div className="rotate-hint">
          <span>📱 Obróć telefon poziomo – będziesz mieć większe płótno</span>
          <button onClick={() => setHintDismissed(true)} aria-label="Zamknij podpowiedź">×</button>
        </div>
      )}

      <div className="canvas-frame draw-canvas-frame">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="game-canvas"
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
          {/* Własny kolor – systemowy wybierak */}
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
