import { useState, useEffect, useRef } from 'react';
import { Menu } from './Menu';
import { Host } from './host';
import { PlayerMenu } from './playerMenu';
import { PlayerRoom } from './playerRoom';
import { PlayerGuess } from './playerGuess';
import { HostGame } from './hostgame';

export interface PlayerInfo {
  nickname: string;
  avatar: string;
  points: number;
  isDrawer: boolean;
  isGuessed: boolean;
}

export function App() {
  const [currentView, setCurrentView] = useState<'menu' | 'host' | 'player' | 'playerRoom' | 'playerGuess' | 'hostGame'>('menu');
  
  const [hostData, setHostData] = useState<{ username: string; avatar: string } | null>(null);
  const [playerData, setPlayerData] = useState<{ nickname: string; avatar: string } | null>(null);
  
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'host' | 'player' | null>(null);
  const [connectedPlayers, setConnectedPlayers] = useState<PlayerInfo[]>([]);
  
  const wsRef = useRef<WebSocket | null>(null);
  
  // Sprawdzanie URLa na start
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('id');
    const pathname = window.location.pathname;

    if (roomId) {
      setRoomCode(roomId);
      if (pathname.includes('host-room')) {
        setUserRole('host');
        setCurrentView('host');
      } else if (pathname.includes('room')) {
        setUserRole('player');
        setCurrentView('player');
      }
    }
  }, []);

  useEffect(() => {
    if (!roomCode || !userRole) return;

    const ws = new WebSocket("ws://localhost:18080/ws");
    wsRef.current = ws;

    ws.onopen = () => {
      console.log(`Połączono z GameServer C++ jako ${userRole}`);
      if (userRole === 'host') {
        sendPacket("HOST_INIT", {});
      } else if (userRole === 'player' && playerData?.nickname) {
        sendPacket("PLAYER_JOIN", { nickname: playerData.nickname, avatar: playerData.avatar });
      }
    };


    // Połączenie z websocket c++
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("C++ wysłał:", data); 
      const { type, payload } = data;

      // Tutaj jak cos to dodasz nowe case
      switch (type) {
        case 'LOBBY_UPDATE':
          setConnectedPlayers(payload.players || []);
          
          // SUKCES
          setCurrentView((prevView) => {
            if (prevView === 'player') {
              window.history.pushState({}, '', `/room?id=${roomCode}`);
              return 'playerRoom';
            }
            return prevView;
          });
          break;

        case 'GAME_STARTED':
          setCurrentView(userRole === 'host' ? 'hostGame' : 'playerGuess');
          break;

        case 'ERROR':
          alert(`Odłączono: ${payload.message}`);
          
          // Wrong PIN
          if (payload.code === 'ROOM_NOT_FOUND' || payload.code === 'ROOM_EXISTS') {
            if (wsRef.current) wsRef.current.close();
            setRoomCode(null);
            setUserRole(null);
          }
          break;
      }
    };

    ws.onclose = () => {
      console.log("Rozłączono z GameServerem.");
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, [roomCode, userRole, playerData?.nickname]); 

  const sendPacket = (type: string, payload: any = {}) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, pin: roomCode, payload }));
    }
  };

  const handleHostCreateRoom = (username: string, avatar: string) => {
    const mockPin = Math.floor(1000 + Math.random() * 9000).toString();
    
    console.log(`Wygenerowano kod pokoju (Mock): ${mockPin}`);
    
    setHostData({ username, avatar });
    setRoomCode(mockPin);
    setUserRole('host');
    
    window.history.pushState({}, '', `/host-room?id=${mockPin}`);
    setCurrentView('host');
  };

  const handleLeaveRoom = () => {
    if (wsRef.current) wsRef.current.close();
    window.history.pushState({}, '', '/');
    setRoomCode(null);
    setUserRole(null);
    setConnectedPlayers([]);
    setCurrentView('menu');
  };

  return (
    <>
      {currentView === 'menu' && (
        <Menu 
          onHOST={(username, avatar) => handleHostCreateRoom(username, avatar)}
          onPLAYER={(code, avatar) => {
            setRoomCode(code);
            setUserRole('player');
            setPlayerData({ nickname: '', avatar }); 
            window.history.pushState({}, '', `/room?id=${code}`);
            setCurrentView('player');
          }}
        />
      )}

      {currentView === 'host' && hostData && roomCode && (
        <Host 
          username={hostData.username}
          selectedAvatar={hostData.avatar}
          players={connectedPlayers}
          roomCode={roomCode}
          onStartGame={() => sendPacket("START_GAME")}
          onLogout={handleLeaveRoom}
        />
      )}

      {currentView === 'player' && (
        <PlayerMenu 
          initialRoomCode={roomCode || ''}
          selectedAvatar={playerData?.avatar || ''} 
          onJoinLobby={(code, nickname, avatar) => {
            setRoomCode(code);
            setPlayerData({ nickname, avatar });
            setUserRole('player');
          }}
          onBack={handleLeaveRoom}
        />
      )}

      {currentView === 'playerRoom' && playerData && roomCode && (
        <PlayerRoom 
          roomCode={roomCode}
          nickname={playerData.nickname}
          avatar={playerData.avatar}
          onLeave={handleLeaveRoom}
        />
      )}

      {currentView === 'playerGuess' && playerData && roomCode && (
        <PlayerGuess 
          roomCode={roomCode}
          nickname={playerData.nickname}
          avatar={playerData.avatar}
          onLeave={handleLeaveRoom}
        />
      )}

      {currentView === 'hostGame' && hostData && roomCode && (
        <HostGame 
          roomCode={roomCode}
          nickname={hostData.username}
          avatar={hostData.avatar}
          onLeave={handleLeaveRoom}
        />
      )}
    </>
  );
}