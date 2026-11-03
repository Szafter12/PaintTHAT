import { useState, useEffect, useCallback } from 'react';
import { createRoomRequest } from './api/roomsApi';
import { useGameSocket } from './hooks/useGameSocket';
import type {
  AppView,
  GameSettings,
  HostSession,
  PlayerInfo,
  PlayerSession,
  UserRole,
} from './types/game';
import { MenuView } from './views/MenuView';
import { HostLobbyView } from './views/HostLobbyView';
import { PlayerMenuView } from './views/PlayerMenuView';
import { PlayerRoomView } from './views/PlayerRoomView';
import { PlayerGuessView } from './views/PlayerGuessView';
import { HostGameView } from './views/HostGameView';

export function App() {
  const [currentView, setCurrentView] = useState<AppView>('menu');
  const [hostData, setHostData] = useState<HostSession | null>(null);
  const [playerData, setPlayerData] = useState<PlayerSession | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [connectedPlayers, setConnectedPlayers] = useState<PlayerInfo[]>([]);

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

  const handleLobbyUpdate = useCallback(
    (players: PlayerInfo[]) => {
      setConnectedPlayers(players);
      setCurrentView((prevView) => {
        if (prevView === 'player' && roomCode) {
          window.history.pushState({}, '', `/room?id=${roomCode}`);
          return 'playerRoom';
        }
        return prevView;
      });
    },
    [roomCode]
  );

  const handleGameStarted = useCallback(() => {
    setCurrentView(userRole === 'host' ? 'hostGame' : 'playerGuess');
  }, [userRole]);

  const handlePlayerGuessed = useCallback((nickname: string, earnedPoints: number) => {
    setConnectedPlayers((prev) =>
      prev.map((p) =>
        p.nickname === nickname
          ? { ...p, isGuessed: true, points: p.points + earnedPoints }
          : p
      )
    );
  }, []);

  const { sendPacket, closeSocket } = useGameSocket({
    roomCode,
    userRole,
    playerData,
    onLobbyUpdate: handleLobbyUpdate,
    onGameStarted: handleGameStarted,
    onPlayerGuessed: handlePlayerGuessed,
    onRoomError: (code, message) => {
      alert(`Odłączono: ${message}`);
      if (code === 'ROOM_NOT_FOUND' || code === 'ROOM_EXISTS') {
        closeSocket();
        setRoomCode(null);
        setUserRole(null);
      }
    },
  });

  const handleHostCreateRoom = async (username: string, avatar: string) => {
    const { pin } = await createRoomRequest(username);

    setHostData({ username, avatar });
    setRoomCode(pin);
    setUserRole('host');

    window.history.pushState({}, '', `/host-room?id=${pin}`);
    setCurrentView('host');
  };

  const handleStartGame = (settings: GameSettings) => {
    sendPacket('START_GAME', settings);
  };

  const handleLeaveRoom = () => {
    closeSocket();
    window.history.pushState({}, '', '/');
    setRoomCode(null);
    setUserRole(null);
    setConnectedPlayers([]);
    setCurrentView('menu');
  };

  return (
    <>
      {currentView === 'menu' && (
        <MenuView
          onHOST={(username, avatar) => handleHostCreateRoom(username, avatar)}
          onPLAYER={(code, avatar) => {
            setRoomCode(code || null);
            setUserRole('player');
            setPlayerData({ nickname: '', avatar });
            setCurrentView('player');
          }}
        />
      )}

      {currentView === 'host' && hostData && roomCode && (
        <HostLobbyView
          username={hostData.username}
          selectedAvatar={hostData.avatar}
          players={connectedPlayers}
          roomCode={roomCode}
          onStartGame={handleStartGame}
          onLogout={handleLeaveRoom}
        />
      )}

      {currentView === 'player' && (
        <PlayerMenuView
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
        <PlayerRoomView
          roomCode={roomCode}
          nickname={playerData.nickname}
          avatar={playerData.avatar}
          onLeave={handleLeaveRoom}
        />
      )}

      {currentView === 'playerGuess' && playerData && roomCode && (
        <PlayerGuessView
          roomCode={roomCode}
          nickname={playerData.nickname}
          avatar={playerData.avatar}
          sendPacket={sendPacket}
          onLeave={handleLeaveRoom}
        />
      )}

      {currentView === 'hostGame' && hostData && roomCode && (
        <HostGameView
          roomCode={roomCode}
          nickname={hostData.username}
          avatar={hostData.avatar}
          players={connectedPlayers}
          sendPacket={sendPacket}
          onLeave={handleLeaveRoom}
        />
      )}
    </>
  );
}