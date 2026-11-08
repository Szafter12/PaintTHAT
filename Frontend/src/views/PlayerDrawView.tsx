import { useRef, useState } from 'react';
import type { SendPacketFn } from '../types/websocket';

interface PlayerDrawViewProps {
  nickname: string;
  wordOptions: string[];
  isRoundActive: boolean;
  sendPacket: SendPacketFn;
}

export function PlayerDrawView({ wordOptions, isRoundActive, sendPacket }: PlayerDrawViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(5);
  const [isEraser, setIsEraser] = useState(false);

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

  const getPointerPos = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height
    };
  };

  const startDrawing = (e: any) => {
    setIsDrawing(true);
    const pos = getPointerPos(e);
    lastPosRef.current = pos;
    draw(pos.x, pos.y);
  };

  const drawMove = (e: any) => {
    if (!isDrawing) return;
    const pos = getPointerPos(e);
    draw(pos.x, pos.y);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPosRef.current = null;
  };

  const handleClear = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    sendPacket('CLEAR_CANVAS', {});
  };

  // ---------------------------------------------------------
  // EKRAN WYBORU SŁOWA (Przed startem rysowania)
  // ---------------------------------------------------------
  if (!isRoundActive) {
    return (
      <div className="menu" style={{ textAlign: 'center', padding: '20px', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h2 style={{ color: 'white', marginBottom: '20px' }}>Wybierz hasło:</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {/* Zabezpieczenie przed brakiem danych z C++ */}
          {wordOptions && wordOptions.length > 0 ? (
            wordOptions.map((word, index) => (
              <button 
                key={index} 
                className="game-input" 
                style={{ 
                  cursor: 'pointer', 
                  fontSize: '24px', 
                  padding: '15px',
                  backgroundColor: 'white',
                  color: 'black',
                  border: '3px solid #ff0055',
                  borderRadius: '10px'
                }}
                onClick={() => sendPacket('PICKED_WORD', { guessWord: word })}
              >
                {word}
              </button>
            ))
          ) : (
            <p style={{ color: 'gray', fontSize: '18px' }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#222', minHeight: '100vh', padding: '10px' }}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', width: '100%', justifyContent: 'center' }}>
        <input 
          type="color" 
          value={color} 
          onChange={e => { setColor(e.target.value); setIsEraser(false); }} 
          style={{ width: '50px', height: '40px' }} 
        />
        <input 
          type="range" 
          min="2" max="20" 
          value={size} 
          onChange={e => setSize(Number(e.target.value))} 
        />
        <button 
          onClick={() => setIsEraser(!isEraser)} 
          style={{ background: isEraser ? '#ff0055' : '#555', color: 'white', border: 'none', padding: '0 15px', borderRadius: '5px' }}>
          Gumka
        </button>
        <button 
          onClick={handleClear} 
          style={{ background: 'red', color: 'white', border: 'none', padding: '0 15px', borderRadius: '5px' }}>
          Wyczyść
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{ width: '100%', maxWidth: '800px', aspectRatio: '4/3', background: 'white', borderRadius: '10px', touchAction: 'none' }}
        onMouseDown={startDrawing}
        onMouseMove={drawMove}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={drawMove}
        onTouchEnd={stopDrawing}
      />
    </div>
  );
}