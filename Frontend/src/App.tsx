import { useState, useEffect, useCallback, useRef } from 'react';
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
  ChatMessage,
  RoundResultPlayer,
  FinalResultPlayer,
} from './types/game';
import { MenuView } from './views/MenuView';
import { HostLobbyView } from './views/HostLobbyView';
import { PlayerMenuView } from './views/PlayerMenuView';
import { PlayerRoomView } from './views/PlayerRoomView';
import { PlayerGuessView } from './views/PlayerGuessView';
import { HostGameView } from './views/HostGameView';
import { HostResultsView } from './views/HostResultsView';
import { NoticeHost } from './views/NoticeHost';
import { showNotice } from './hooks/notice';
import { playSound } from './hooks/sounds';
import { SoundToggle } from './views/SoundToggle';

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
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [maxRounds, setMaxRounds] = useState<number>(3);
  const [playerRoundEndWord, setPlayerRoundEndWord] = useState<string | null>(null);
  const [lastSettings, setLastSettings] = useState<
    { maxRounds: number; roundTime: number; customWords: string[] } | undefined
  >(undefined);

  const userRoleRef = useRef<UserRole | null>(null);
  userRoleRef.current = userRole;
  const playerNicknameRef = useRef('');
  playerNicknameRef.current = playerData?.nickname || '';
  const roundStartedRef = useRef(false);

  useEffect(() => {
    const handleRoundEnd = (e: Event) => {
      const detail = (e as CustomEvent<{ word?: string; leaderboard?: RoundResultPlayer[] }>).detail;
      setIsRoundActive(false);

      if (detail?.leaderboard && Array.isArray(detail.leaderboard)) {
        setConnectedPlayers((prev) =>
          prev.map((p) => {
            const entry = detail.leaderboard!.find((item) => item.nickname === p.nickname);
            return entry ? { ...p, points: entry.score } : p;
          })
        );
      }

      if (userRoleRef.current === 'player') {
        setPlayerRoundEndWord(detail?.word || '');
      }
    };

    const handleGameOver = (e: Event) => {
      const detail = (e as CustomEvent<{ leaderboard?: FinalResultPlayer[] }>).detail;
      setIsRoundActive(false);
      setPlayerRoundEndWord(null);

      if (detail?.leaderboard && Array.isArray(detail.leaderboard)) {
        setConnectedPlayers((prev) =>
          prev.map((p) => {
            const entry = detail.leaderboard!.find((item) => item.nickname === p.nickname);
            return entry ? { ...p, points: entry.score } : p;
          })
        );
      }

      setCurrentView(userRoleRef.current === 'host' ? 'hostResults' : 'playerRoom');
    };

    const handleBackToLobbyEvent = () => {
      setCurrentRound(1);
      setChatMessages([]);
      setCurrentDrawer(null);
      setWordOptions([]);
      setIsRoundActive(false);
      setRoundTimeLeft(0);
      setPlayerRoundEndWord(null);
      setConnectedPlayers((prev) =>
        prev.map((p) => ({ ...p, points: 0, isGuessed: false, isDrawer: false }))
      );
      setCurrentView(userRoleRef.current === 'host' ? 'host' : 'playerRoom');
    };

    const handleDrawerQuit = (e: Event) => {
      const detail = (e as CustomEvent<{ nickname?: string }>).detail;
      showNotice(`Rysownik ${detail?.nickname || ''} opuścił pokój.`, {
        title: 'Koniec rundy',
        type: 'info',
      });
    };

    const handlePlayerClose = (e: Event) => {
      const detail = (e as CustomEvent<{ playerNick?: string }>).detail;
      if (!detail?.playerNick || detail.playerNick === playerNicknameRef.current) return;
      showNotice(`Gracz ${detail.playerNick} opuścił pokój.`, {
        title: 'Gracz wyszedł',
        type: 'info',
      });
    };

    window.addEventListener('round-end', handleRoundEnd);
    window.addEventListener('game-over', handleGameOver);
    window.addEventListener('back-to-lobby', handleBackToLobbyEvent);
    window.addEventListener('drawer-quit', handleDrawerQuit);
    window.addEventListener('player-close', handlePlayerClose);
    return () => {
      window.removeEventListener('round-end', handleRoundEnd);
      window.removeEventListener('game-over', handleGameOver);
      window.removeEventListener('back-to-lobby', handleBackToLobbyEvent);
      window.removeEventListener('drawer-quit', handleDrawerQuit);
      window.removeEventListener('player-close', handlePlayerClose);
    };
  }, []);

  useEffect(() => {
    const handleChooseWord = (e: any) => {
      roundStartedRef.current = false;
      setPlayerRoundEndWord(null);
      setCurrentDrawer(playerData?.nickname || 'Ja');
      setWordOptions(e.detail || []);
      setIsRoundActive(false);
      setCurrentRound((prev) => prev + 1);
      setChatMessages([]);
      setConnectedPlayers((prev) => prev.map((p) => ({ ...p, isGuessed: false })));
    };

    const handleWaitingForWord = (e: any) => {
      roundStartedRef.current = false;
      setPlayerRoundEndWord(null);
      if (e.detail) {
        setCurrentDrawer(e.detail);
      }
      setWordOptions([]);
      setIsRoundActive(false);
      setCurrentRound((prev) => prev + 1);
      setChatMessages([]);
      setConnectedPlayers((prev) => prev.map((p) => ({ ...p, isGuessed: false })));
    };

    const handleTimeLeft = (e: any) => {
      if (!roundStartedRef.current) {
        setChatMessages([]);
        setConnectedPlayers((prev) => prev.map((p) => ({ ...p, isGuessed: false })));
        if (userRoleRef.current === 'host') playSound('start');
      } else if (userRoleRef.current === 'host' && e.detail > 0 && e.detail <= 10) {
        playSound('tick');
      }
      roundStartedRef.current = true;
      setRoundTimeLeft(e.detail);
      setIsRoundActive(true);
    };

    const handleGuessMiss = (e: any) => {
      setChatMessages((prev) => [
        ...prev,
        { id: Date.now() + Math.random(), nickname: e.detail.nickname, text: e.detail.guessWord, type: 'miss' },
      ]);
    };

    const handleGuessAlmost = (e: any) => {
      setChatMessages((prev) => [
        ...prev,
        { id: Date.now() + Math.random(), nickname: e.detail.nickname, text: e.detail.guessWord, type: 'almost' },
      ]);
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
      setConnectedPlayers((prev) =>
        players.map((sp) => {
          const existing = prev.find((p) => p.nickname === sp.nickname);
          return {
            ...sp,
            avatar: sp.avatar || existing?.avatar || '',
            isGuessed: existing?.isGuessed ?? false,
            isDrawer: existing?.isDrawer ?? false,
          };
        })
      );
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
    setCurrentRound(0);
    setPlayerRoundEndWord(null);
    setChatMessages([]);
    setConnectedPlayers((prev) =>
      prev.map((p) => ({ ...p, points: 0, isGuessed: false, isDrawer: false }))
    );
    setCurrentView(userRole === 'host' ? 'hostGame' : 'playerGuess');
  }, [userRole]);

  const handlePlayerGuessed = useCallback(
    (nickname: string, earnedPoints: number, totalPoints?: number) => {
      if (userRoleRef.current === 'host' || nickname === playerNicknameRef.current) {
        playSound('correct');
      }
      setConnectedPlayers((prev) =>
        prev.map((p) =>
          p.nickname === nickname
            ? {
                ...p,
                isGuessed: true,
                points: typeof totalPoints === 'number' ? totalPoints : p.points + earnedPoints,
              }
            : p
        )
      );
      setChatMessages((prev) => [
        ...prev,
        { id: Date.now() + Math.random(), nickname, text: 'Odgadł(a) hasło!', type: 'correct' },
      ]);
    },
    []
  );

  const handleLeaveRoom = useCallback(() => {
    closeSocket();
    window.history.pushState({}, '', '/');
    setRoomCode(null);
    setUserRole(null);
    setConnectedPlayers([]);
    setCurrentView('menu');
  }, []);

  const { sendPacket, closeSocket } = useGameSocket({
    roomCode,
    userRole,
    playerData,
    onLobbyUpdate: handleLobbyUpdate,
    onGameStarted: handleGameStarted,
    onPlayerGuessed: handlePlayerGuessed,
    onRoomError: (code, message) => {
      if (code === 'HOST_LEFT') {
        closeSocket();
        window.history.pushState({}, '', '/');
        setRoomCode(null);
        setUserRole(null);
        setConnectedPlayers([]);
        setCurrentView('menu');
        showNotice(message, { title: 'Pokój zamknięty', type: 'info' });
        return;
      }

      showNotice(message, {
        title: code === 'NOT_ENOUGH_PLAYERS' ? 'Koniec gry' : 'Uwaga!',
        type: code === 'NOT_ENOUGH_PLAYERS' ? 'info' : 'error',
      });
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
    const { customWords, ...packet } = settings;
    setLastSettings({
      maxRounds: settings.maxRounds,
      roundTime: settings.roundTime,
      customWords: customWords ?? [],
    });
    setMaxRounds(settings.maxRounds);
    setCurrentRound(0);
    setChatMessages([]);
    setConnectedPlayers((prev) =>
      prev.map((p) => ({ ...p, points: 0, isGuessed: false, isDrawer: false }))
    );
    sendPacket('START_GAME', packet);
  };

  const handleBackToLobby = () => {
    sendPacket('BACK_TO_LOBBY', {});
    setCurrentRound(1);
    setChatMessages([]);
    setCurrentDrawer(null);
    setWordOptions([]);
    setIsRoundActive(false);
    setRoundTimeLeft(0);
    setPlayerRoundEndWord(null);
    setConnectedPlayers((prev) =>
      prev.map((p) => ({ ...p, points: 0, isGuessed: false, isDrawer: false }))
    );
    setCurrentView('host');
  };

  const handleKickPlayer = (nickname: string) => {
    sendPacket('KICK_PLAYER', { nickname });
    setConnectedPlayers((prev) => prev.filter((p) => p.nickname !== nickname));
  };

  useEffect(() => {
    const handleKicked = () => {
      if (userRoleRef.current !== 'player') return;
      handleLeaveRoom();
      showNotice('Host usunął Cię z pokoju.', { title: 'Wyrzucono' });
    };
    window.addEventListener('kicked', handleKicked);
    return () => window.removeEventListener('kicked', handleKicked);
  }, [handleLeaveRoom]);

  const hasLocalPlayerGuessed =
    connectedPlayers.find((p) => p.nickname === playerData?.nickname)?.isGuessed || false;

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
          initialSettings={lastSettings}
          onKickPlayer={handleKickPlayer}
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
          players={connectedPlayers}
          onLeave={handleLeaveRoom}
        />
      )}

      {currentView === 'playerGuess' && playerData && roomCode && (
        playerRoundEndWord !== null ? (
          <div className="menu player-screen" style={{ textAlign: 'center', padding: '40px' }}>
            <h2>Koniec rundy!</h2>
            <p style={{ fontSize: '24px', margin: '16px 0' }}>
              Hasło to: <strong style={{ color: '#ffd800' }}>{playerRoundEndWord}</strong>
            </p>
            <p style={{ color: '#aaa', fontSize: '18px' }}>
              Oczekiwanie na rozpoczęcie kolejnej rundy przez Hosta...
            </p>
          </div>
        ) : !currentDrawer ? (
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
          currentRound={Math.max(1, currentRound)}
          maxRounds={maxRounds}
          sendPacket={sendPacket}
          onLeave={handleLeaveRoom}
        />
      )}

      {currentView === 'hostResults' && (
        <HostResultsView players={connectedPlayers} onBack={handleBackToLobby} />
      )}

      {userRole === 'host' && currentView !== 'menu' && <SoundToggle />}

      <NoticeHost />
    </>
  );
}