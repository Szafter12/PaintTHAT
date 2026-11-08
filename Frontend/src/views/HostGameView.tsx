import { useEffect, useRef } from 'react';
import type { PlayerInfo, ChatMessage } from '../types/game'; 
import type { SendPacketFn } from '../types/websocket';

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

export function HostGameView({ players, currentDrawer, isRoundActive, timeLeft, chatMessages }: HostGameViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Rysowanie z pominięciem Reacta (60 FPS)
    const handleStroke = (e: CustomEvent) => {
      // Odbieramy dokładne dane zgodne z Twoim PacketBuilder.hpp
      const { x, y, prevX, prevY, color, size, isEraser } = e.detail;
      
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
      window.addEventListener('draw-broadcast', handleStroke as EventListener);
      window.removeEventListener('clear-canvas', handleClear);
    };
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#111', color: 'white' }}>
      
      {/* LEWA STRONA: Płótno i Czas */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '1000px', marginBottom: '15px' }}>
          <h2 style={{ color: '#ff0055' }}>
            {!isRoundActive ? `${currentDrawer || 'Rysownik'} wybiera słowo...` : `Rysuje: ${currentDrawer}`}
          </h2>
          <h2 style={{ fontSize: '36px', color: timeLeft <= 10 ? 'red' : 'white' }}>
            ⏱ {timeLeft}s
          </h2>
        </div>

        <canvas
          ref={canvasRef}
          width={1024}
          height={768}
          style={{ width: '100%', maxWidth: '1000px', aspectRatio: '4/3', background: 'white', borderRadius: '15px', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }}
        />
        <div style={{
          width: '100%', maxWidth: '1000px', height: '180px', marginTop: '20px', 
          background: 'rgba(0, 0, 0, 0.5)', borderRadius: '15px', padding: '15px', 
          overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px',
          border: '1px solid #333'
        }}>
          {chatMessages.map(msg => (
            <div key={msg.id} style={{ 
              fontSize: '20px', 
              color: msg.type === 'correct' ? '#00ff00' : (msg.type === 'almost' ? '#ffcc00' : 'white'),
              fontWeight: msg.type === 'correct' ? 'bold' : 'normal'
            }}>
              <span style={{ color: '#888', marginRight: '10px' }}>{msg.nickname}:</span>
              {msg.type === 'almost' ? (
                <span>{msg.text} <em style={{ fontSize: '16px' }}>(Blisko!)</em></span>
              ) : (
                <span>{msg.text}</span>
              )}
            </div>
          ))}
          <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
        </div>
      </div>

      {/* PRAWA STRONA: Tabela Graczy */}
      <div style={{ width: '350px', background: '#1a1a1a', borderLeft: '3px solid #ff0055', padding: '20px', overflowY: 'auto' }}>
        <h3>TABELA WYNIKÓW</h3>
        <ul style={{ listStyleType: 'none', padding: 0, marginTop: '20px' }}>
          {players.sort((a, b) => b.points - a.points).map((p, i) => (
            <li key={i} style={{ 
              display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px', 
              background: p.isGuessed ? 'rgba(0, 255, 0, 0.2)' : '#222',
              padding: '10px', borderRadius: '10px'
            }}>
              <img src={p.avatar} alt="avatar" style={{ width: '50px', height: '50px', borderRadius: '50%' }} />
              <div style={{ flex: '1' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{p.nickname}</div>
                <div style={{ color: '#aaa' }}>{p.points} pkt</div>
              </div>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}