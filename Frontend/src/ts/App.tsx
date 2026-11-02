import { useState, useEffect } from 'react';
import { Menu } from './Menu';
import { Host } from './host';
import { PlayerMenu } from './playerMenu';
import { PlayerRoom } from './playerRoom';
import { PlayerGuess } from './playerGuess';
import { HostGame } from './hostgame';

export interface PlayerInfo {
  nickname: string;
  avatar: string;
}

const gameChannel = new BroadcastChannel('paint_that_lobby');

export function App() {
  const [currentView, setCurrentView] = useState<'menu' | 'host' | 'player' | 'playerRoom' | 'playerGuess' | 'hostGame'>('menu');
  
  const [hostData, setHostData] = useState<{ username: string; avatar: string } | null>(null);
  const [activeHostCode, setActiveHostCode] = useState<string | null>(null);
  
  const [playerData, setPlayerData] = useState<{ roomCode: string; avatar: string } | null>(null);
  const [connectedPlayers, setConnectedPlayers] = useState<PlayerInfo[]>([]);
  const [joinedPlayer, setJoinedPlayer] = useState<{ roomCode: string; nickname: string; avatar: string } | null>(null);

  useEffect(() => {
    gameChannel.onmessage = (event) => {
      const { type, roomCode, player } = event.data;

      if (type === 'PLAYER_JOINED') {
        setConnectedPlayers((prev) => {
          const exists = prev.some((p) => p.nickname === player.nickname);
          if (exists) return prev;
          return [...prev, player];
        });
      }

      if (type === 'GAME_STARTED') {
        setJoinedPlayer((currentJoined) => {
          if (currentJoined && currentJoined.roomCode === roomCode) {
            setCurrentView('playerGuess');
          }
          return currentJoined;
        });
      }
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('id');
    const pathname = window.location.pathname;

    if (pathname.includes('room') && roomId) {
      setPlayerData({ roomCode: roomId, avatar: '' });
      setCurrentView('player');
    }
  }, []);

  const handleLeaveRoom = () => {
    window.history.pushState({}, '', '/');
    setJoinedPlayer(null);
    setConnectedPlayers([]);
    setActiveHostCode(null);
    setCurrentView('menu');
  };

  const handleStartGame = () => {
    if (!activeHostCode) return;

    gameChannel.postMessage({
      type: 'GAME_STARTED',
      roomCode: activeHostCode
    });

    setCurrentView('hostGame');
  };

  return (
    <>
      {currentView === 'menu' && (
        <Menu 
          onHOST={(username, avatar) => {
            setHostData({ username, avatar });
            setCurrentView('host');
          }}
          onPLAYER={(roomCode, avatar) => {
            setPlayerData({ roomCode, avatar });
            setCurrentView('player');
          }}
        />
      )}

      {currentView === 'host' && hostData && (
        <Host 
          username={hostData.username}
          selectedAvatar={hostData.avatar}
          players={connectedPlayers}
          onRoomCreated={(code) => {
            setActiveHostCode(code);
            window.history.pushState({}, '', `/host-room?id=${code}`);
          }}
          onStartGame={handleStartGame}
          onLogout={handleLeaveRoom}
        />
      )}

      {currentView === 'player' && playerData && (
        <PlayerMenu 
          initialRoomCode={playerData.roomCode}
          selectedAvatar={playerData.avatar} 
          onJoinLobby={(roomCode, nickname, avatar) => {
            const newPlayer = { nickname, avatar };

            gameChannel.postMessage({
              type: 'PLAYER_JOINED',
              roomCode,
              player: newPlayer
            });

            setJoinedPlayer({
              roomCode,
              nickname,
              avatar
            });

            window.history.pushState({}, '', `/room?id=${roomCode}`);
            setCurrentView('playerRoom');
          }}
          onBack={handleLeaveRoom}
        />
      )}

      {currentView === 'playerRoom' && joinedPlayer && (
        <PlayerRoom 
          roomCode={joinedPlayer.roomCode}
          nickname={joinedPlayer.nickname}
          avatar={joinedPlayer.avatar}
          onLeave={handleLeaveRoom}
        />
      )}

      {currentView === 'playerGuess' && (
        <PlayerGuess 
          roomCode={joinedPlayer?.roomCode || ''}
          nickname={joinedPlayer?.nickname || 'Gracz'}
          avatar={joinedPlayer?.avatar || ''}
          onLeave={handleLeaveRoom}
        />
      )}

      {currentView === 'hostGame' && (
        <HostGame 
          roomCode={activeHostCode || ''}
          nickname={hostData?.username || 'Host'}
          avatar={hostData?.avatar || ''}
          onLeave={handleLeaveRoom}
        />
      )}
    </>
  );
}