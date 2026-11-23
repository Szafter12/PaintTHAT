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
  onPlayerGuessed: (nickname: string, earnedPoints: number, totalPoints?: number) => void;
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

        switch (data.type) {
          case 'LOBBY_UPDATE':
            onLobbyUpdate(data.payload.players || []);
            break;

          case 'GAME_STARTED':
            onGameStarted();
            break;

          case 'CHOOSE_WORD':
            window.dispatchEvent(new CustomEvent('choose-word', { detail: data.payload.words }));
            break;

          case 'WAITING_FOR_WORD':
            window.dispatchEvent(new CustomEvent('waiting-for-word', { detail: data.payload.drawer }));
            break;

          case 'TIME_LEFT':
            window.dispatchEvent(new CustomEvent('time-left', { detail: data.payload.time }));
            break;

          case 'PLAYER_GUESSED_CORRECTLY':
            onPlayerGuessed(
              data.payload.nickname,
              data.payload.pointAwarded,
              data.payload.totalPoints
            );
            break;

          case 'PLAYER_GUESSED_MISS':
            window.dispatchEvent(new CustomEvent('guess-miss', { detail: data.payload }));
            break;

          case 'PLAYER_GUESSED_ALMOST':
            window.dispatchEvent(new CustomEvent('guess-almost', { detail: data.payload }));
            break;

          case 'DRAW_BROADCAST':
            window.dispatchEvent(new CustomEvent('draw-broadcast', { detail: data.payload }));
            break;

          case 'CLEAR_CANVAS':
            window.dispatchEvent(new CustomEvent('clear-canvas'));
            break;

          case 'ROUND_END':
            window.dispatchEvent(new CustomEvent('round-end', { detail: data.payload }));
            break;

          case 'DRAWER_QUIT':
            window.dispatchEvent(new CustomEvent('drawer-quit', { detail: data.payload }));
            break;

          case 'PLAYER_CLOSE':
            window.dispatchEvent(new CustomEvent('player-close', { detail: data.payload }));
            break;

          case 'KICKED':
            window.dispatchEvent(new CustomEvent('kicked', { detail: data.payload }));
            break;

          case 'GAME_OVER':
          case 'GAME_ENDED':
            window.dispatchEvent(new CustomEvent('game-over', { detail: data.payload }));
            break;

          case 'BACK_TO_LOBBY':
            window.dispatchEvent(new CustomEvent('back-to-lobby'));
            break;

          case 'ERROR':
            onRoomError(data.payload.code, data.payload.message);
            break;
        }
      } catch (err) {
        console.error('Błąd parsowania pakietu z C++:', err);
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [roomCode, userRole, playerData?.nickname, playerData?.avatar, sendPacket]);

  return { sendPacket, closeSocket };
}