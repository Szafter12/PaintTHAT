import { useState, useEffect, useCallback } from 'react';
import { createRoomRequest } from './api/roomsApi';
import { useGameSocket } from './hooks/useGameSocket';
import { PlayerDrawView } from './views/PlayerDrawView';
import type {
  AppView,
  GameSettings,
  HostSession,
  PlayerInfo,
  PlayerSession,
  UserRole,
  ChatMessage
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
  const [currentDrawer, setCurrentDrawer] = useState<string | null>(null);
  const [wordOptions, setWordOptions] = useState<string[]>([]);
  const [roundTimeLeft, setRoundTimeLeft] = useState<number>(0);
  const [isRoundActive, setIsRoundActive] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const handleChooseWord = (e: any) => {
      setCurrentDrawer(playerData?.nickname || 'Ja'); 
      setWordOptions(e.detail || []); 
      setIsRoundActive(false); 
      // RESET RUNDY (Czyścimy czat i status odgadnięcia przy nowym słowie)
      setChatMessages([]);
      setConnectedPlayers(prev => prev.map(p => ({ ...p, isGuessed: false })));
    };

    const handleWaitingForWord = (e: any) => {
      setCurrentDrawer(e.detail);
      setWordOptions([]);
      setIsRoundActive(false);
      // RESET RUNDY
      setChatMessages([]);
      setConnectedPlayers(prev => prev.map(p => ({ ...p, isGuessed: false })));
    };

    const handleTimeLeft = (e: any) => {
      setRoundTimeLeft(e.detail);
      setIsRoundActive(true);
    };

    // Obsługa nietrafionych haseł
    const handleGuessMiss = (e: any) => {
      setChatMessages(prev => [...prev, { id: Date.now(), nickname: e.detail.nickname, text: e.detail.guessWord, type: 'miss' }]);
    };
    const handleGuessAlmost = (e: any) => {
      setChatMessages(prev => [...prev, { id: Date.now(), nickname: e.detail.nickname, text: e.detail.guessWord, type: 'almost' }]);
    };

    window.addEventListener('choose-word', handleChooseWord);
    window.addEventListener('waiting-for-word', handleWaitingForWord);
    window.addEventListener('time-left', handleTimeLeft);
    window.addEventListener('guess-miss', handleGuessMiss);
    window.addEventListener('guess-almost', handleGuessAlmost);

    return () => {
      window.removeEventListener('choose-word', handleChooseWord);
      window.removeEventListener('waiting-for-word', handleWaitingForWord);
      window.removeEventListener('time-left', handleTimeLeft);
      window.removeEventListener('guess-miss', handleGuessMiss);
      window.removeEventListener('guess-almost', handleGuessAlmost);
    };
  }, [playerData?.nickname]);

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
    setChatMessages((prev) => [...prev, { id: Date.now(), nickname, text: 'Odgadł(a) hasło!', type: 'correct' }]);
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

  const hasLocalPlayerGuessed = connectedPlayers.find(p => p.nickname === playerData?.nickname)?.isGuessed || false;

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
          sendPacket={sendPacket}
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
        !currentDrawer ? (

          <div className="menu" style={{ textAlign: 'center', padding: '40px' }}>
            <h2>Ładowanie rundy...</h2>
            <p style={{ color: '#aaa', fontSize: '20px', marginTop: '15px' }}>
              Maszyna losująca wybiera rysownika...
            </p>
          </div>
        ) : currentDrawer === playerData.nickname ? (
          <PlayerDrawView
            nickname={playerData.nickname}
            wordOptions={wordOptions}
            isRoundActive={isRoundActive}
            sendPacket={sendPacket}
          />
        ) : (
          <PlayerGuessView
            currentDrawer={currentDrawer}
            isRoundActive={isRoundActive}
            hasGuessed={hasLocalPlayerGuessed}
            sendPacket={sendPacket}
          />
        )
      )}

      {currentView === 'hostGame' && hostData && roomCode && (
        <HostGameView
          roomCode={roomCode}
          nickname={hostData.username}
          avatar={hostData.avatar}
          players={connectedPlayers}
          currentDrawer={currentDrawer}
          isRoundActive={isRoundActive}
          timeLeft={roundTimeLeft}
          chatMessages={chatMessages}
          sendPacket={sendPacket}
          onLeave={handleLeaveRoom}
        />
      )}
    </>
  );
}