import { useEffect, useRef, useCallback } from 'react';
import { API_CONFIG } from '../api/config';
import type { PlayerInfo, PlayerSession, UserRole } from '../types/game';
import type { ClientPacketMap, ClientPacketType, ServerPacket } from '../types/websocket';

interface UseGameSocketParams {
  roomCode: string | null;
  userRole: UserRole | null;
  playerData: PlayerSession | null;
  onLobbyUpdate: (players: PlayerInfo[]) => void;
  onGameStarted: () => void;
  onPlayerGuessed: (nickname: string, earnedPoints: number) => void;
  onRoomError: (code: string, message: string) => void;
}

export function useGameSocket({
  roomCode,
  userRole,
  playerData,
  onLobbyUpdate,
  onGameStarted,
  onPlayerGuessed,
  onRoomError,
}: UseGameSocketParams) {
  const wsRef = useRef<WebSocket | null>(null);

  const sendPacket = useCallback(
    <T extends ClientPacketType>(type: T, payload: ClientPacketMap[T]) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && roomCode) {
        wsRef.current.send(JSON.stringify({ type, pin: roomCode, payload }));
      }
    },
    [roomCode]
  );

  const closeSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!roomCode || !userRole) return;
    if (userRole === 'player' && !playerData?.nickname) return;

    const ws = new WebSocket(API_CONFIG.CPP_WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log(`Połączono z GameServer C++ jako ${userRole}`);
      if (userRole === 'host') {
        sendPacket('HOST_INIT', {});
      } else if (userRole === 'player' && playerData?.nickname) {
        sendPacket('PLAYER_JOIN', {
          nickname: playerData.nickname,
          avatar: playerData.avatar,
        });
      }
    };

    ws.onmessage = (event: MessageEvent<string>) => {
      try {
        const data = JSON.parse(event.data) as ServerPacket;
        console.log('C++ wysłał:', data);

        switch (data.type) {
          case 'LOBBY_UPDATE':
            onLobbyUpdate(data.payload.players || []);
            break;
          case 'GAME_STARTED':
            onGameStarted();
            break;
            
          // C++ wysyła CHOOSE_WORD (tylko do Rysownika, z listą słów)
          case 'CHOOSE_WORD':
            window.dispatchEvent(new CustomEvent('choose-word', { detail: data.payload.words }));
            break;
            
          // C++ wysyła WAITING_FOR_WORD (do zgadujących, podaje tylko nick)
          case 'WAITING_FOR_WORD':
            window.dispatchEvent(new CustomEvent('waiting-for-word', { detail: data.payload.drawer }));
            break;
            
          case 'TIME_LEFT':
            window.dispatchEvent(new CustomEvent('time-left', { detail: data.payload.time }));
            break;
            
          case 'PLAYER_GUESSED_CORRECTLY':
            onPlayerGuessed(data.payload.nickname, data.payload.pointAwarded);
            break;

          // NOWE: Błędne zgadnięcia lub literówki (przekazujemy do App.tsx)
          case 'PLAYER_GUESSED_MISS':
            window.dispatchEvent(new CustomEvent('guess-miss', { detail: data.payload }));
            break;
            
          case 'PLAYER_GUESSED_ALMOST':
            window.dispatchEvent(new CustomEvent('guess-almost', { detail: data.payload }));
            break;

          // Rysowanie z C++ do TV
          case 'DRAW_BROADCAST':
            window.dispatchEvent(new CustomEvent('draw-broadcast', { detail: data.payload }));
            break;

          case 'ERROR':
            onRoomError(data.payload.code, data.payload.message);
            break;
        }
      } catch (err) {
        console.error('Błąd parsowania pakietu z C++:', err);
      }
    };

    ws.onclose = () => {
      console.log('Rozłączono z GameServerem.');
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [roomCode, userRole, playerData?.nickname, playerData?.avatar, sendPacket]);

  return { sendPacket, closeSocket };
}