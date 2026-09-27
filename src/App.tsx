import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { MainMenu } from './components/MainMenu';
import { HowToPlayModal } from './components/HowToPlayModal';
import { LevelSelectModal } from './components/LevelSelectModal';
import { FreePlayModal } from './components/FreePlayModal';
import { OfflineSetup } from './components/OfflineSetup';
import { SecretPicker } from './components/SecretPicker';
import { TurnTransition } from './components/TurnTransition';
import { GameBoard } from './components/GameBoard';
import { GameOverModal } from './components/GameOverModal';
import { OnlineLobby } from './components/OnlineLobby';
import { OnlineGameBoard } from './components/OnlineGameBoard';

import {
  GameMode,
  GameLevel,
  GameState,
  QuestionRecord,
  QuestionVerdict,
  OnlineRoomData
} from './types/game';
import { GAME_LEVELS, DEFAULT_FREEPLAY_LEVEL } from './constants/levels';
import { getSoundEnabled, setSoundEnabled, playTurnChime, playWinFanfare, playNoSound } from './utils/sound';
import { evaluateQuestion } from './utils/helpers';
import { localPeerManager, fetchRoomFromRelay } from './utils/supabase';
import { peerMultiplayer } from './utils/peerMultiplayer';

export const App: React.FC = () => {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('guessr_theme');
    return (saved as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('guessr_theme', theme);
  }, [theme]);

  // Check URL params for room invite (e.g. ?room=XYZ123)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setCurrentMode('online');
    }
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Sound state
  const [soundOn, setSoundOn] = useState<boolean>(() => getSoundEnabled());
  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  };

  // Navigation & Modals
  const [currentMode, setCurrentMode] = useState<GameMode>('menu');
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isLevelsOpen, setIsLevelsOpen] = useState(false);
  const [isFreePlayOpen, setIsFreePlayOpen] = useState(false);

  // Selected Level for next match (default: Level 1 Warm Up)
  const [selectedLevel, setSelectedLevel] = useState<GameLevel>(GAME_LEVELS[0]);

  // Offline Game State
  const [gameState, setGameState] = useState<GameState>({
    mode: 'offline',
    level: GAME_LEVELS[0],
    player1: {
      id: 'player1',
      name: 'Player 1',
      secretNumber: null,
      questionsAsked: 0,
      guessesMade: 0,
      eliminatedNumbers: [],
      pinnedCandidates: []
    },
    player2: {
      id: 'player2',
      name: 'Player 2',
      secretNumber: null,
      questionsAsked: 0,
      guessesMade: 0,
      eliminatedNumbers: [],
      pinnedCandidates: []
    },
    activePlayerId: 'player1',
    phase: 'setup',
    questions: [],
    guesses: [],
    turnNumber: 1,
    winnerId: null,
    winReason: null,
    timerSecondsRemaining: null,
    pendingQuestion: null,
    autoVerifyEnabled: true
  });

  // Online Multiplayer State
  const [onlineRoom, setOnlineRoom] = useState<OnlineRoomData | null>(null);
  const [isOnlineHost, setIsOnlineHost] = useState(true);
  const [onlinePlayerName, setOnlinePlayerName] = useState('Player');

  // Next player transition info
  const [transitionNextPlayerId, setTransitionNextPlayerId] = useState<'player1' | 'player2'>('player1');
  const [transitionTargetPhase, setTransitionTargetPhase] = useState<'secret_picker_p2' | 'playing'>('playing');

  // --- Handlers: Match Setup & Progression ---
  const handleStartOfflineSetup = (level: GameLevel = selectedLevel) => {
    setSelectedLevel(level);
    setCurrentMode('offline');
    setGameState((prev) => ({
      ...prev,
      mode: 'offline',
      level: level,
      phase: 'setup',
      turnNumber: 1,
      questions: [],
      guesses: [],
      winnerId: null,
      winReason: null,
      pendingQuestion: null
    }));
  };

  const handleStartMatchFromSetup = (p1Name: string, p2Name: string, rangeMin: number, rangeMax: number) => {
    const updatedLevel: GameLevel = {
      ...selectedLevel,
      rangeMin,
      rangeMax
    };

    setGameState((prev) => ({
      ...prev,
      level: updatedLevel,
      player1: {
        id: 'player1',
        name: p1Name,
        secretNumber: null,
        questionsAsked: 0,
        guessesMade: 0,
        eliminatedNumbers: [],
        pinnedCandidates: []
      },
      player2: {
        id: 'player2',
        name: p2Name,
        secretNumber: null,
        questionsAsked: 0,
        guessesMade: 0,
        eliminatedNumbers: [],
        pinnedCandidates: []
      },
      activePlayerId: 'player1',
      phase: 'secret_picker_p1'
    }));
  };

  // Secret Number Selected by Player 1
  const handleConfirmP1Secret = (secret: number) => {
    setGameState((prev) => ({
      ...prev,
      player1: { ...prev.player1, secretNumber: secret },
      phase: 'turn_transition'
    }));
    setTransitionNextPlayerId('player2');
    setTransitionTargetPhase('secret_picker_p2');
  };

  // Secret Number Selected by Player 2
  const handleConfirmP2Secret = (secret: number) => {
    setGameState((prev) => ({
      ...prev,
      player2: { ...prev.player2, secretNumber: secret },
      phase: 'turn_transition'
    }));
    setTransitionNextPlayerId('player1');
    setTransitionTargetPhase('playing');
  };

  // Transition Curtain Shield Ready
  const handleTransitionReady = () => {
    if (transitionTargetPhase === 'secret_picker_p2') {
      setGameState((prev) => ({
        ...prev,
        phase: 'secret_picker_p2'
      }));
    } else {
      setGameState((prev) => ({
        ...prev,
        activePlayerId: transitionNextPlayerId,
        phase: 'playing'
      }));
    }
  };

  // Ask Question in active game
  const handleAskQuestion = (record: QuestionRecord) => {
    setGameState((prev) => {
      const active = prev.activePlayerId === 'player1' ? prev.player1 : prev.player2;
      const updatedActive = { ...active, questionsAsked: active.questionsAsked + 1 };

      return {
        ...prev,
        player1: prev.activePlayerId === 'player1' ? updatedActive : prev.player1,
        player2: prev.activePlayerId === 'player2' ? updatedActive : prev.player2,
        pendingQuestion: record,
        phase: 'answering'
      };
    });
  };

  // Opponent answers question (Yes / No)
  const handleAnswerQuestion = (verdict: QuestionVerdict) => {
    if (!gameState.pendingQuestion) return;

    const completedQuestion: QuestionRecord = {
      ...gameState.pendingQuestion,
      verdict
    };

    const nextPlayerId = gameState.activePlayerId === 'player1' ? 'player2' : 'player1';

    setGameState((prev) => ({
      ...prev,
      questions: [...prev.questions, completedQuestion],
      pendingQuestion: null,
      phase: 'turn_transition',
      turnNumber: prev.turnNumber + 1
    }));

    setTransitionNextPlayerId(nextPlayerId);
    setTransitionTargetPhase('playing');
  };

  // Make Exact Guess
  const handleMakeGuess = (guessNumber: number) => {
    const isP1 = gameState.activePlayerId === 'player1';
    const active = isP1 ? gameState.player1 : gameState.player2;
    const opponent = isP1 ? gameState.player2 : gameState.player1;

    const isCorrect = opponent.secretNumber !== null && guessNumber === opponent.secretNumber;

    const newGuess = {
      id: `g_${Date.now()}`,
      guesserId: active.id,
      targetId: opponent.id,
      guessNumber,
      isCorrect,
      turnNumber: gameState.turnNumber,
      timestamp: Date.now()
    };

    const updatedActive = { ...active, guessesMade: active.guessesMade + 1 };

    if (isCorrect) {
      // Game Won!
      setGameState((prev) => ({
        ...prev,
        player1: isP1 ? updatedActive : prev.player1,
        player2: !isP1 ? updatedActive : prev.player2,
        guesses: [...prev.guesses, newGuess],
        phase: 'game_over',
        winnerId: active.id,
        winReason: `Direct Hit! ${active.name} correctly guessed ${opponent.name}'s secret number: ${guessNumber}!`
      }));
    } else {
      // Incorrect Guess
      playNoSound();

      // Check if guesses limit exhausted
      const maxGuesses = gameState.level.maxGuesses;
      if (maxGuesses && updatedActive.guessesMade >= maxGuesses) {
        setGameState((prev) => ({
          ...prev,
          player1: isP1 ? updatedActive : prev.player1,
          player2: !isP1 ? updatedActive : prev.player2,
          guesses: [...prev.guesses, newGuess],
          phase: 'game_over',
          winnerId: opponent.id,
          winReason: `${active.name} used all ${maxGuesses} guesses allowed! ${opponent.name} wins by default!`
        }));
        return;
      }

      // Pass turn to opponent
      const nextPlayerId = isP1 ? 'player2' : 'player1';
      setGameState((prev) => ({
        ...prev,
        player1: isP1 ? updatedActive : prev.player1,
        player2: !isP1 ? updatedActive : prev.player2,
        guesses: [...prev.guesses, newGuess],
        phase: 'turn_transition',
        turnNumber: prev.turnNumber + 1
      }));

      setTransitionNextPlayerId(nextPlayerId);
      setTransitionTargetPhase('playing');
    }
  };

  // Turn Timeout (Timer expired)
  const handleTurnTimeout = () => {
    const nextPlayerId = gameState.activePlayerId === 'player1' ? 'player2' : 'player1';
    setGameState((prev) => ({
      ...prev,
      phase: 'turn_transition',
      turnNumber: prev.turnNumber + 1
    }));
    setTransitionNextPlayerId(nextPlayerId);
    setTransitionTargetPhase('playing');
  };

  // Scratchpad: toggle single number
  const handleToggleScratchpadNumber = (num: number) => {
    const isP1 = gameState.activePlayerId === 'player1';
    const player = isP1 ? gameState.player1 : gameState.player2;

    let newEliminated = [...player.eliminatedNumbers];
    let newPinned = [...player.pinnedCandidates];

    if (newEliminated.includes(num)) {
      newEliminated = newEliminated.filter((n) => n !== num);
      newPinned.push(num);
    } else if (newPinned.includes(num)) {
      newPinned = newPinned.filter((n) => n !== num);
    } else {
      newEliminated.push(num);
    }

    const updatedPlayer = {
      ...player,
      eliminatedNumbers: newEliminated,
      pinnedCandidates: newPinned
    };

    setGameState((prev) => ({
      ...prev,
      player1: isP1 ? updatedPlayer : prev.player1,
      player2: !isP1 ? updatedPlayer : prev.player2
    }));
  };

  // Scratchpad: Auto-eliminate multiple numbers
  const handleAutoEliminateNumbers = (numbers: number[]) => {
    const isP1 = gameState.activePlayerId === 'player1';
    const player = isP1 ? gameState.player1 : gameState.player2;

    const merged = Array.from(new Set([...player.eliminatedNumbers, ...numbers]));
    const updatedPlayer = {
      ...player,
      eliminatedNumbers: merged
    };

    setGameState((prev) => ({
      ...prev,
      player1: isP1 ? updatedPlayer : prev.player1,
      player2: !isP1 ? updatedPlayer : prev.player2
    }));
  };

  // Scratchpad: Reset
  const handleResetScratchpad = () => {
    const isP1 = gameState.activePlayerId === 'player1';
    const player = isP1 ? gameState.player1 : gameState.player2;

    const updatedPlayer = {
      ...player,
      eliminatedNumbers: [],
      pinnedCandidates: []
    };

    setGameState((prev) => ({
      ...prev,
      player1: isP1 ? updatedPlayer : prev.player1,
      player2: !isP1 ? updatedPlayer : prev.player2
    }));
  };

  // Rematch
  const handleRematch = () => {
    setGameState((prev) => ({
      ...prev,
      player1: {
        ...prev.player1,
        secretNumber: null,
        questionsAsked: 0,
        guessesMade: 0,
        eliminatedNumbers: [],
        pinnedCandidates: []
      },
      player2: {
        ...prev.player2,
        secretNumber: null,
        questionsAsked: 0,
        guessesMade: 0,
        eliminatedNumbers: [],
        pinnedCandidates: []
      },
      activePlayerId: 'player1',
      phase: 'secret_picker_p1',
      questions: [],
      guesses: [],
      turnNumber: 1,
      winnerId: null,
      winReason: null,
      pendingQuestion: null
    }));
  };

  // --- Handlers: Online Multiplayer ---
  const handleCreateOnlineRoom = (hostName: string, level: GameLevel, roomCode: string) => {
    const newRoom: OnlineRoomData = {
      roomCode,
      hostPlayerId: `p_${Date.now()}`,
      hostName,
      guestPlayerId: null,
      guestName: null,
      level,
      hostSecret: null,
      guestSecret: null,
      activePlayer: 'host',
      status: 'waiting',
      winner: null,
      questions: [],
      guesses: [],
      pendingQuestion: null,
      updatedAt: Date.now()
    };

    setIsOnlineHost(true);
    setOnlinePlayerName(hostName);
    setOnlineRoom(newRoom);
    setCurrentMode('online');

    // Save and broadcast locally
    localPeerManager.broadcast(newRoom);
  };

  const handleJoinOnlineRoom = async (guestName: string, roomCode: string) => {
    const relayState = await fetchRoomFromRelay(roomCode);
    const existing = relayState || localPeerManager.getSavedState(roomCode);

    const roomData: OnlineRoomData = existing || {
      roomCode,
      hostPlayerId: 'host_player',
      hostName: 'Host Player',
      guestPlayerId: `guest_${Date.now()}`,
      guestName,
      level: selectedLevel,
      hostSecret: null,
      guestSecret: null,
      activePlayer: 'host',
      status: 'picking_secrets',
      winner: null,
      questions: [],
      guesses: [],
      pendingQuestion: null,
      updatedAt: Date.now()
    };

    roomData.guestName = guestName;
    roomData.guestPlayerId = `guest_${Date.now()}`;
    roomData.status = 'picking_secrets';
    roomData.updatedAt = Date.now();

    setIsOnlineHost(false);
    setOnlinePlayerName(guestName);
    setOnlineRoom(roomData);
    setCurrentMode('online');

    // Broadcast updated state to peer manager and Wi-Fi relay
    localPeerManager.broadcast(roomData);
  };

  const handleLeaveOnlineRoom = () => {
    peerMultiplayer.destroy();
    setOnlineRoom(null);
    setCurrentMode('menu');
  };

  const isPlayingActiveGame = currentMode === 'offline' && gameState.phase === 'playing';

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Navbar
        currentMode={currentMode}
        onNavigateHome={() => setCurrentMode('menu')}
        onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
        soundEnabled={soundOn}
        onToggleSound={toggleSound}
        theme={theme}
        onToggleTheme={toggleTheme}
        isPlayingGame={isPlayingActiveGame}
      />

      {/* Main Content Router */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* 1. MAIN MENU */}
        {currentMode === 'menu' && (
          <MainMenu
            onStartOffline={() => handleStartOfflineSetup(selectedLevel)}
            onStartOnline={() => setCurrentMode('online')}
            onOpenLevels={() => setIsLevelsOpen(true)}
            onOpenFreePlay={() => setIsFreePlayOpen(true)}
            onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
          />
        )}

        {/* 2. OFFLINE MODE FLOW */}
        {currentMode === 'offline' && (
          <>
            {gameState.phase === 'setup' && (
              <OfflineSetup
                level={gameState.level}
                onStartMatch={handleStartMatchFromSetup}
                onBackToMenu={() => setCurrentMode('menu')}
                onChangeLevel={() => setIsLevelsOpen(true)}
              />
            )}

            {gameState.phase === 'secret_picker_p1' && (
              <SecretPicker
                player={gameState.player1}
                rangeMin={gameState.level.rangeMin}
                rangeMax={gameState.level.rangeMax}
                level={gameState.level}
                onConfirmSecret={handleConfirmP1Secret}
              />
            )}

            {gameState.phase === 'secret_picker_p2' && (
              <SecretPicker
                player={gameState.player2}
                rangeMin={gameState.level.rangeMin}
                rangeMax={gameState.level.rangeMax}
                level={gameState.level}
                onConfirmSecret={handleConfirmP2Secret}
              />
            )}

            {gameState.phase === 'turn_transition' && (
              <TurnTransition
                nextPlayer={transitionNextPlayerId === 'player1' ? gameState.player1 : gameState.player2}
                onReady={handleTransitionReady}
              />
            )}

            {(gameState.phase === 'playing' || gameState.phase === 'answering') && (
              <GameBoard
                gameState={gameState}
                onAskQuestion={handleAskQuestion}
                onAnswerQuestion={handleAnswerQuestion}
                onMakeGuess={handleMakeGuess}
                onTurnTimeout={handleTurnTimeout}
                onToggleScratchpadNumber={handleToggleScratchpadNumber}
                onAutoEliminateNumbers={handleAutoEliminateNumbers}
                onResetScratchpad={handleResetScratchpad}
              />
            )}

            {gameState.phase === 'game_over' && (
              <GameOverModal
                gameState={gameState}
                onRematch={handleRematch}
                onReturnToMenu={() => setCurrentMode('menu')}
              />
            )}
          </>
        )}

        {/* 3. ONLINE MODE FLOW */}
        {currentMode === 'online' && (
          !onlineRoom ? (
            <OnlineLobby
              onCreateRoom={handleCreateOnlineRoom}
              onJoinRoom={handleJoinOnlineRoom}
              onBackToMenu={() => setCurrentMode('menu')}
            />
          ) : (
            <OnlineGameBoard
              initialRoomData={onlineRoom}
              isHost={isOnlineHost}
              playerName={onlinePlayerName}
              onLeaveRoom={handleLeaveOnlineRoom}
            />
          )
        )}
      </main>

      {/* Global Modals */}
      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />

      <LevelSelectModal
        isOpen={isLevelsOpen}
        onClose={() => setIsLevelsOpen(false)}
        onSelectLevel={(level) => {
          setSelectedLevel(level);
          setIsLevelsOpen(false);
          handleStartOfflineSetup(level);
        }}
        onOpenFreePlay={() => {
          setIsLevelsOpen(false);
          setIsFreePlayOpen(true);
        }}
      />

      <FreePlayModal
        isOpen={isFreePlayOpen}
        onClose={() => setIsFreePlayOpen(false)}
        onStartCustomGame={(customLevel) => {
          setSelectedLevel(customLevel);
          setIsFreePlayOpen(false);
          handleStartOfflineSetup(customLevel);
        }}
      />
    </div>
  );
};

export default App;

