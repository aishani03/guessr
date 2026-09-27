import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Globe,
  Copy,
  Check,
  Users,
  Shield,
  Clock,
  HelpCircle,
  Target,
  Sparkles,
  Send,
  RotateCcw,
  Flame,
  Home,
  RefreshCw,
  Trophy,
  X,
  Wifi,
  Share2,
  QrCode,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { OnlineRoomData, GameLevel, QuestionType, QuestionVerdict } from '../types/game';
import { evaluateQuestion, getNumbersToEliminate, formatTime } from '../utils/helpers';
import { getSupabaseClient, localPeerManager, fetchRoomFromRelay, postRoomToRelay } from '../utils/supabase';
import { peerMultiplayer, ConnectionStatus } from '../utils/peerMultiplayer';
import {
  playTapSound,
  playYesSound,
  playNoSound,
  playTurnChime,
  playWinFanfare,
  playTickSound
} from '../utils/sound';

interface OnlineGameBoardProps {
  initialRoomData: OnlineRoomData;
  isHost: boolean;
  playerName: string;
  onLeaveRoom: () => void;
}

export const OnlineGameBoard: React.FC<OnlineGameBoardProps> = ({
  initialRoomData,
  isHost,
  playerName,
  onLeaveRoom
}) => {
  const [room, setRoom] = useState<OnlineRoomData>(initialRoomData);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [webrtcStatus, setWebrtcStatus] = useState<ConnectionStatus>('connecting');

  // Private secret number for this device
  const [mySecretInput, setMySecretInput] = useState<string>('');
  const [hasLockedSecret, setHasLockedSecret] = useState(false);
  const [secretError, setSecretError] = useState<string | null>(null);

  // Active turn action tab
  const [actionTab, setActionTab] = useState<'question' | 'guess'>('question');

  // Question Form State
  const [questionType, setQuestionType] = useState<QuestionType>('greater');
  const [paramA, setParamA] = useState<number>(Math.floor((room.level.rangeMin + room.level.rangeMax) / 2));
  const [paramB, setParamB] = useState<number>(room.level.rangeMax);
  const [customQuestionText, setCustomQuestionText] = useState<string>('');

  // Guess Form State
  const [guessInput, setGuessInput] = useState<string>('');
  const [guessError, setGuessError] = useState<string | null>(null);

  // Scratchpad state for this player
  const [eliminatedNumbers, setEliminatedNumbers] = useState<number[]>([]);
  const [pinnedCandidates, setPinnedCandidates] = useState<number[]>([]);

  // Turn timer
  const [timerLeft, setTimerLeft] = useState<number | null>(room.level.timerSeconds);
  const timerRef = useRef<number | null>(null);

  const myRole = isHost ? 'host' : 'guest';
  const isMyTurn = room.activePlayer === myRole && room.status === 'playing';

  const roomRef = useRef<OnlineRoomData>(room);
  roomRef.current = room;

  // 1. Sync setup via WebRTC (Any network / 4G / 5G), Wi-Fi Relay, and Local BroadcastChannel
  useEffect(() => {
    // Setup WebRTC Direct Peer Connection across any network
    if (isHost) {
      peerMultiplayer.initHost(room.roomCode, room, {
        onStatusChange: (status) => setWebrtcStatus(status),
        onRoomSync: (updatedRoom) => {
          setRoom(updatedRoom);
        },
        onGuestJoin: (guestName, guestId) => {
          setRoom((prev) => {
            const updated: OnlineRoomData = {
              ...prev,
              guestName,
              guestPlayerId: guestId,
              status: 'picking_secrets',
              updatedAt: Date.now()
            };
            peerMultiplayer.broadcastRoomUpdate(updated);
            localPeerManager.broadcast(updated);
            postRoomToRelay(updated);
            return updated;
          });
        }
      });
    } else {
      peerMultiplayer.initGuest(room.roomCode, playerName, `guest_${Date.now()}`, {
        onStatusChange: (status) => setWebrtcStatus(status),
        onRoomSync: (updatedRoom) => {
          setRoom(updatedRoom);
        }
      });
    }

    const supabase = getSupabaseClient();
    let channel: ReturnType<NonNullable<typeof supabase>['channel']> | null = null;

    if (supabase) {
      // Connect to Supabase Realtime Broadcast channel
      channel = supabase.channel(`guessr_online_${room.roomCode}`)
        .on('broadcast', { event: 'room_update' }, ({ payload }) => {
          if (payload) {
            setRoom(payload as OnlineRoomData);
          }
        })
        .subscribe();
    }

    // Also connect to Local BroadcastChannel for instant testing
    localPeerManager.init(room.roomCode, (updatedRoom) => {
      setRoom(updatedRoom);
    });

    // Poll local Wi-Fi relay every 800ms for local testing
    const relayPoll = window.setInterval(async () => {
      const latest = await fetchRoomFromRelay(room.roomCode);
      if (latest && latest.updatedAt > (roomRef.current?.updatedAt || 0)) {
        setRoom(latest);
      }
    }, 800);

    return () => {
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
      peerMultiplayer.destroy();
      localPeerManager.destroy();
      clearInterval(relayPoll);
    };
  }, [room.roomCode]);

  // Broadcast room updates
  const syncRoomUpdate = (updated: OnlineRoomData) => {
    setRoom(updated);
    // Broadcast via WebRTC directly to peer across internet / cellular 4G/5G
    peerMultiplayer.broadcastRoomUpdate(updated);
    // Broadcast locally
    localPeerManager.broadcast(updated);
    // Push to Wi-Fi relay
    postRoomToRelay(updated);
    // Broadcast via Supabase
    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.channel(`guessr_online_${updated.roomCode}`).send({
        type: 'broadcast',
        event: 'room_update',
        payload: updated
      });
    }
  };

  // Turn timer countdown
  useEffect(() => {
    if (room.status === 'playing' && room.level.timerSeconds) {
      setTimerLeft(room.level.timerSeconds);
      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = window.setInterval(() => {
        setTimerLeft((prev) => {
          if (prev === null || prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            // If it's my turn, pass turn on timeout
            if (isMyTurn) {
              playNoSound();
              const nextPlayer = room.activePlayer === 'host' ? 'guest' : 'host';
              syncRoomUpdate({
                ...room,
                activePlayer: nextPlayer,
                updatedAt: Date.now()
              });
            }
            return 0;
          }
          if (prev <= 5 && isMyTurn) {
            playTickSound();
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [room.activePlayer, room.status]);

  // Win confetti effect
  useEffect(() => {
    if (room.status === 'game_over' && room.winner) {
      if (room.winner === myRole) {
        playWinFanfare();
      } else {
        playNoSound();
      }

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [room.status, room.winner]);

  // Copy room code
  const handleCopyCode = () => {
    playTapSound();
    navigator.clipboard.writeText(room.roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Copy 1-Tap Invite Link (?room=CODE)
  const handleCopyLink = () => {
    playTapSound();
    const inviteUrl = `${window.location.origin}/?room=${room.roomCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Lock in secret number
  const handleLockSecret = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(mySecretInput, 10);
    if (isNaN(num) || num < room.level.rangeMin || num > room.level.rangeMax) {
      setSecretError(`Must be between ${room.level.rangeMin} and ${room.level.rangeMax}`);
      return;
    }

    playYesSound();
    setHasLockedSecret(true);

    const updated: OnlineRoomData = {
      ...room,
      hostSecret: isHost ? num : room.hostSecret,
      guestSecret: !isHost ? num : room.guestSecret,
      updatedAt: Date.now()
    };

    // If both secrets are set, match transitions to playing!
    if ((isHost && room.guestSecret !== null) || (!isHost && room.hostSecret !== null)) {
      updated.status = 'playing';
      updated.activePlayer = 'host';
    }

    syncRoomUpdate(updated);
  };

  // Generate question string
  const getConstructedQuestionText = (): string => {
    switch (questionType) {
      case 'greater': return `Is your number greater than ${paramA}?`;
      case 'less': return `Is your number less than ${paramA}?`;
      case 'equal': return `Is your number equal to ${paramA}?`;
      case 'even': return `Is your number even?`;
      case 'odd': return `Is your number odd?`;
      case 'divisible': return `Is your number divisible by ${paramA}?`;
      case 'prime': return `Is your number a prime number?`;
      case 'digit': return `Does your number contain the digit ${paramA}?`;
      case 'between': return `Is your number between ${paramA} and ${paramB}?`;
      case 'custom': return customQuestionText.trim() || 'Is your number valid?';
      default: return '';
    }
  };

  // Send question to opponent
  const handleSendQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    playTapSound();

    const qText = getConstructedQuestionText();
    if (!qText) return;

    const updated: OnlineRoomData = {
      ...room,
      pendingQuestion: {
        id: `q_${Date.now()}`,
        asker: myRole,
        text: qText,
        type: questionType,
        paramA: questionType !== 'even' && questionType !== 'odd' && questionType !== 'prime' ? paramA : undefined,
        paramB: questionType === 'between' ? paramB : undefined
      },
      updatedAt: Date.now()
    };

    syncRoomUpdate(updated);
  };

  // Answer question (Yes or No)
  const handleAnswerQuestion = (verdict: 'yes' | 'no') => {
    if (verdict === 'yes') playYesSound();
    else playNoSound();

    if (!room.pendingQuestion) return;

    const newQuestion = {
      id: room.pendingQuestion.id,
      asker: room.pendingQuestion.asker,
      text: room.pendingQuestion.text,
      verdict: verdict,
      turnNumber: room.questions.length + 1
    };

    const nextPlayer = room.activePlayer === 'host' ? 'guest' : 'host';

    const updated: OnlineRoomData = {
      ...room,
      questions: [...room.questions, newQuestion],
      pendingQuestion: null,
      activePlayer: nextPlayer,
      updatedAt: Date.now()
    };

    syncRoomUpdate(updated);
  };

  // Make an exact guess
  const handleMakeGuess = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(guessInput, 10);
    if (isNaN(num)) return;

    const opponentSecret = isHost ? room.guestSecret : room.hostSecret;
    const isCorrect = opponentSecret !== null && num === opponentSecret;

    const newGuess = {
      id: `g_${Date.now()}`,
      guesser: isHost ? ('host' as const) : ('guest' as const),
      guessNumber: num,
      isCorrect,
      turnNumber: room.guesses.length + 1
    };

    const nextPlayer = room.activePlayer === 'host' ? 'guest' : 'host';

    const updated: OnlineRoomData = {
      ...room,
      guesses: [...room.guesses, newGuess],
      status: isCorrect ? 'game_over' : 'playing',
      winner: isCorrect ? (isHost ? 'host' : 'guest') : null,
      activePlayer: nextPlayer,
      updatedAt: Date.now()
    };

    if (isCorrect) {
      playWinFanfare();
    } else {
      playNoSound();
    }

    syncRoomUpdate(updated);
    setGuessInput('');
  };

  // Scratchpad toggle
  const toggleNumber = (num: number) => {
    if (eliminatedNumbers.includes(num)) {
      setEliminatedNumbers(eliminatedNumbers.filter((n) => n !== num));
      setPinnedCandidates([...pinnedCandidates, num]);
    } else if (pinnedCandidates.includes(num)) {
      setPinnedCandidates(pinnedCandidates.filter((n) => n !== num));
    } else {
      setEliminatedNumbers([...eliminatedNumbers, num]);
    }
  };

  // Auto-eliminate from questions asked by this player
  const handleAutoEliminate = () => {
    playTapSound();
    const myQuestions = room.questions.filter((q) => q.asker === myRole && q.verdict !== 'pending');
    let allEliminated: number[] = [];

    myQuestions.forEach((q) => {
      // Find matching type
      const eliminated = getNumbersToEliminate(
        room.level.rangeMin,
        room.level.rangeMax,
        'greater', // fallback or heuristic
        q.verdict,
        undefined
      );
      allEliminated = [...allEliminated, ...eliminated];
    });

    setEliminatedNumbers(Array.from(new Set([...eliminatedNumbers, ...allEliminated])));
  };

  // -------------------------------------------------------------
  // Render Phases:
  // 1. Waiting for guest to join
  if (room.status === 'waiting') {
    const inviteUrl = `${window.location.origin}/?room=${room.roomCode}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(inviteUrl)}`;

    return (
      <div className="view-enter" style={{ maxWidth: '540px', margin: '1.5rem auto 3rem', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '2.5rem 2rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'var(--p2-bg)',
            color: 'var(--accent-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }} className="animate-bounce-slow">
            <Globe size={32} />
          </div>

          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>Waiting for Opponent</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Invite a friend to play. They can join from <strong>any phone or PC on any network</strong>!
          </p>

          {/* WebRTC Live Connection Status Pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 0.9rem',
            borderRadius: 'var(--radius-full)',
            background: webrtcStatus === 'connected' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            border: `1px solid ${webrtcStatus === 'connected' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            color: webrtcStatus === 'connected' ? 'var(--accent-emerald)' : 'var(--accent-amber)',
            fontSize: '0.8rem',
            fontWeight: 700,
            marginBottom: '1.5rem'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: webrtcStatus === 'connected' ? 'var(--accent-emerald)' : 'var(--accent-amber)'
            }} className="animate-pulse-glow" />
            {webrtcStatus === 'connected'
              ? 'WebRTC P2P Connected!'
              : 'WebRTC Active • Ready for Any Network Connection'}
          </div>

          {/* Room Code Card */}
          <div style={{
            padding: '1.5rem 1.25rem',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-secondary)',
            border: '2px dashed var(--accent-secondary)',
            marginBottom: '1.5rem'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.35rem' }}>
              6-Character Room Code
            </div>
            <div style={{
              fontSize: '2.8rem',
              fontWeight: 900,
              letterSpacing: '0.18em',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-primary)',
              marginBottom: '1rem',
              userSelect: 'all'
            }}>
              {room.roomCode}
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={handleCopyCode}
                className="btn btn-secondary btn-sm"
                style={{ gap: '0.4rem', flex: '1 1 130px' }}
              >
                {copiedCode ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                {copiedCode ? 'Copied Code!' : 'Copy Code'}
              </button>

              <button
                onClick={handleCopyLink}
                className="btn btn-primary btn-sm"
                style={{ gap: '0.4rem', flex: '1 1 160px' }}
              >
                {copiedLink ? <Check size={14} color="#ffffff" /> : <LinkIcon size={14} />}
                {copiedLink ? 'Copied Link!' : 'Copy Invite Link'}
              </button>

              <button
                onClick={() => {
                  playTapSound();
                  setShowQrCode(!showQrCode);
                }}
                className="btn btn-ghost btn-sm"
                style={{ gap: '0.4rem', flex: '1 1 110px' }}
              >
                <QrCode size={14} />
                {showQrCode ? 'Hide QR' : 'Show QR'}
              </button>
            </div>

            {/* QR Code view */}
            {showQrCode && (
              <div style={{
                marginTop: '1.25rem',
                padding: '1rem',
                background: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-md)',
                display: 'inline-block'
              }}>
                <img
                  src={qrUrl}
                  alt={`Scan to join room ${room.roomCode}`}
                  style={{
                    width: '150px',
                    height: '150px',
                    borderRadius: '8px',
                    background: '#ffffff',
                    padding: '6px',
                    display: 'block',
                    margin: '0 auto'
                  }}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: 0 }}>
                  Scan with camera to open & join directly
                </p>
              </div>
            )}
          </div>

          {/* Any Network Guidance Box */}
          <div style={{
            padding: '1.1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1.25rem',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>
              <Globe size={16} /> How to play across any network:
            </div>
            <ul style={{ paddingLeft: '1.2rem', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              <li><strong>Zero Local Wi-Fi Restrictions:</strong> Uses browser peer-to-peer WebRTC. You and your friend can be on Mobile 4G/5G, separate Wi-Fi, or in different locations worldwide!</li>
              <li><strong>Instant Join:</strong> Send your opponent the Invite Link or Room Code. When they open it, they connect in real time.</li>
              <li><strong>Remote link:</strong> If running locally on your PC, you can generate a global link using <code style={{ background: 'var(--bg-surface-elevated)', padding: '2px 5px', borderRadius: '4px' }}>npm run tunnel</code> or deploy free to Vercel/Netlify.</li>
            </ul>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-amber)' }} className="animate-pulse-glow" />
            Listening for opponent to join...
          </div>

          <button
            onClick={onLeaveRoom}
            className="btn btn-ghost"
            style={{ marginTop: '1.5rem', width: '100%' }}
          >
            Cancel & Return to Menu
          </button>
        </div>
      </div>
    );
  }

  // 2. Secret Number Selection Phase
  if (room.status === 'picking_secrets') {
    const isOtherReady = isHost ? room.guestSecret !== null : room.hostSecret !== null;

    return (
      <div className="view-enter" style={{ maxWidth: '520px', margin: '2rem auto' }}>
        <div className="glass-panel" style={{ padding: '2.25rem 2rem', textAlign: 'center' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '18px',
            background: 'var(--p1-bg)',
            color: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}>
            <Shield size={28} />
          </div>

          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.35rem' }}>Pick Your Secret Number</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Between <strong>{room.level.rangeMin}</strong> and <strong>{room.level.rangeMax}</strong>.
            Your opponent ({isHost ? room.guestName : room.hostName}) is choosing theirs right now.
          </p>

          {!hasLockedSecret ? (
            <form onSubmit={handleLockSecret} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <input
                  type="number"
                  className="input-field input-number"
                  style={{ fontSize: '2.5rem', padding: '1rem' }}
                  value={mySecretInput}
                  min={room.level.rangeMin}
                  max={room.level.rangeMax}
                  placeholder="?"
                  onChange={(e) => {
                    setMySecretInput(e.target.value);
                    if (secretError) setSecretError(null);
                  }}
                  autoFocus
                  required
                />
                {secretError && (
                  <p style={{ color: 'var(--accent-rose)', fontSize: '0.8rem', marginTop: '0.35rem' }}>
                    {secretError}
                  </p>
                )}
              </div>

              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                Lock In My Secret
              </button>
            </form>
          ) : (
            <div style={{
              padding: '1.5rem',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--accent-emerald)', fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                <Check size={22} /> Secret Locked!
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {isOtherReady
                  ? 'Both players ready! Launching game...'
                  : `Waiting for ${isHost ? room.guestName : room.hostName} to pick their secret...`}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. Victory / Game Over Phase
  if (room.status === 'game_over') {
    const isWinner = room.winner === myRole;
    const winnerName = room.winner === 'host' ? room.hostName : room.guestName;

    return (
      <div className="view-enter" style={{ maxWidth: '560px', margin: '2rem auto', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '2.5rem 2rem', borderTop: `5px solid ${isWinner ? 'var(--accent-emerald)' : 'var(--accent-rose)'}` }}>
          <div style={{
            width: '74px',
            height: '74px',
            borderRadius: '24px',
            background: isWinner ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: isWinner ? 'var(--accent-emerald)' : 'var(--accent-rose)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <Trophy size={38} />
          </div>

          <h2 style={{ fontSize: '2.2rem', marginBottom: '0.4rem' }}>
            {isWinner ? '🎉 You Win!' : `${winnerName} Won!`}
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1.75rem' }}>
            {isWinner ? 'You correctly guessed your opponent’s secret number!' : 'Your secret number was deduced!'}
          </p>

          {/* Reveal Secrets */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            padding: '1.25rem',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-secondary)',
            marginBottom: '1.75rem'
          }}>
            <div style={{ padding: '0.85rem', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--p1-color)', fontWeight: 700 }}>
                {room.hostName}'s Secret
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>
                {room.hostSecret}
              </div>
            </div>
            <div style={{ padding: '0.85rem', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--p2-color)', fontWeight: 700 }}>
                {room.guestName}'s Secret
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>
                {room.guestSecret}
              </div>
            </div>
          </div>

          <button onClick={onLeaveRoom} className="btn btn-primary" style={{ width: '100%' }}>
            Return to Menu
          </button>
        </div>
      </div>
    );
  }

  // 4. Active Gameplay Phase
  const opponentName = isHost ? room.guestName : room.hostName;

  return (
    <div className="view-enter" style={{
      maxWidth: '920px',
      margin: '0 auto',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem'
    }}>
      {/* Status Bar */}
      <div className="glass-panel" style={{
        padding: '1rem 1.4rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        borderTop: isMyTurn ? '4px solid var(--accent-emerald)' : '4px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.35rem 0.8rem',
            borderRadius: 'var(--radius-md)',
            background: isMyTurn ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-secondary)',
            color: isMyTurn ? 'var(--accent-emerald)' : 'var(--text-secondary)',
            fontWeight: 800,
            fontSize: '0.85rem'
          }}>
            {isMyTurn ? '⭐ YOUR TURN' : `Waiting for ${opponentName}...`}
          </div>

          <span className="badge" style={{ background: 'var(--bg-secondary)' }}>
            Room: {room.roomCode}
          </span>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.25rem 0.6rem',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            fontSize: '0.75rem',
            color: 'var(--accent-emerald)',
            fontWeight: 700
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-emerald)' }} />
            P2P WebRTC Active
          </div>
        </div>

        {/* Turn Timer */}
        {timerLeft !== null && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.8rem',
            borderRadius: 'var(--radius-full)',
            background: timerLeft <= 5 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.15)',
            color: timerLeft <= 5 ? 'var(--accent-rose)' : 'var(--accent-amber)',
            fontFamily: 'var(--font-mono)',
            fontWeight: 800
          }}>
            <Clock size={16} />
            <span>{formatTime(timerLeft)}</span>
          </div>
        )}
      </div>

      {/* Answering prompt if opponent asked a question */}
      {room.pendingQuestion && (
        <div className="glass-panel" style={{
          padding: '2rem',
          textAlign: 'center',
          borderTop: '4px solid var(--accent-amber)'
        }}>
          {room.pendingQuestion.asker !== myRole ? (
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>
                Question From {opponentName}
              </div>
              <h3 style={{ fontSize: '1.6rem', marginBottom: '1.5rem' }}>
                "{room.pendingQuestion.text}"
              </h3>

              <div style={{ display: 'flex', gap: '1rem', maxWidth: '380px', margin: '0 auto' }}>
                <button
                  onClick={() => handleAnswerQuestion('yes')}
                  className="btn btn-emerald btn-lg"
                  style={{ flex: 1, gap: '0.5rem' }}
                >
                  <Check size={20} /> YES
                </button>
                <button
                  onClick={() => handleAnswerQuestion('no')}
                  className="btn btn-rose btn-lg"
                  style={{ flex: 1, gap: '0.5rem' }}
                >
                  <X size={20} /> NO
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Waiting for {opponentName} to answer:
              </div>
              <h3 style={{ fontSize: '1.4rem', margin: '0.75rem 0' }}>
                "{room.pendingQuestion.text}"
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--accent-amber)', fontSize: '0.85rem', fontWeight: 700 }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-amber)' }} className="animate-pulse-glow" />
                Awaiting response...
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Playing Interface if no pending question */}
      {!room.pendingQuestion && (
        <div className="game-arena-grid">
          {/* Left Column: Action Panel */}
          <div id="online-turn-action-panel" className="glass-panel game-turn-panel" style={{ opacity: isMyTurn ? 1 : 0.65 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
              marginBottom: '1rem',
              flexWrap: 'wrap'
            }}>
              <div className="action-tabs-container" style={{ flex: 1, marginBottom: 0 }}>
                <button
                  type="button"
                  disabled={!isMyTurn}
                  onClick={() => setActionTab('question')}
                  className="btn btn-sm action-tab-btn"
                  style={{
                    background: actionTab === 'question' ? 'var(--bg-surface-elevated)' : 'transparent',
                    color: actionTab === 'question' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    boxShadow: actionTab === 'question' ? 'var(--shadow-sm)' : 'none',
                    borderColor: actionTab === 'question' ? 'var(--border-subtle)' : 'transparent'
                  }}
                >
                  <HelpCircle size={15} style={{ flexShrink: 0 }} />
                  <span>Ask Question</span>
                </button>

                <button
                  type="button"
                  disabled={!isMyTurn}
                  onClick={() => setActionTab('guess')}
                  className="btn btn-sm action-tab-btn"
                  style={{
                    background: actionTab === 'guess' ? 'var(--bg-surface-elevated)' : 'transparent',
                    color: actionTab === 'guess' ? 'var(--accent-rose)' : 'var(--text-secondary)',
                    boxShadow: actionTab === 'guess' ? 'var(--shadow-sm)' : 'none',
                    borderColor: actionTab === 'guess' ? 'var(--border-subtle)' : 'transparent'
                  }}
                >
                  <Target size={15} style={{ flexShrink: 0 }} />
                  <span>Make Exact Guess</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('online-scratchpad-panel');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="mobile-jump-scratchpad"
                title="Jump to Scratchpad"
              >
                <span>Scratchpad</span>
                <ChevronDown size={14} />
              </button>
            </div>

            {actionTab === 'question' ? (
              <form onSubmit={handleSendQuestion} className="question-form">
                <div>
                  <label className="section-label">
                    Select Question Type
                  </label>
                  <div className="question-type-grid">
                    {[
                      { id: 'greater', label: '> Greater than' },
                      { id: 'less', label: '< Less than' },
                      { id: 'equal', label: '= Equal to' },
                      { id: 'even', label: 'Even / Odd' },
                      { id: 'divisible', label: 'Divisible by' },
                      { id: 'prime', label: 'Is Prime' },
                      { id: 'digit', label: 'Contains digit' },
                      { id: 'between', label: 'Between [A–B]' },
                      { id: 'custom', label: 'Custom text' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        disabled={!isMyTurn}
                        onClick={() => setQuestionType(item.id as QuestionType)}
                        className="btn btn-sm question-type-btn"
                        style={{
                          background: questionType === item.id ? 'var(--p1-bg)' : 'var(--bg-secondary)',
                          color: questionType === item.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                          borderColor: questionType === item.id ? 'var(--accent-primary)' : 'var(--border-subtle)',
                          fontWeight: questionType === item.id ? 800 : 600
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {(questionType === 'greater' || questionType === 'less' || questionType === 'equal') && (
                  <div>
                    <div className="label-with-badge">
                      <label className="section-label" style={{ marginBottom: 0 }}>
                        Comparison Value
                      </label>
                      <span className="range-badge">
                        Range: {room.level.rangeMin}–{room.level.rangeMax}
                      </span>
                    </div>
                    <input
                      type="number"
                      disabled={!isMyTurn}
                      className="input-field input-number"
                      value={paramA}
                      min={room.level.rangeMin}
                      max={room.level.rangeMax}
                      onChange={(e) => setParamA(parseInt(e.target.value) || room.level.rangeMin)}
                      required
                    />
                  </div>
                )}

                {questionType === 'even' && (
                  <div className="info-box">
                    Asks if the opponent's number is divisible by 2 (even) or odd.
                  </div>
                )}

                {questionType === 'divisible' && (
                  <div>
                    <div className="label-with-badge">
                      <label className="section-label" style={{ marginBottom: 0 }}>
                        Divisor
                      </label>
                      <span className="range-badge">
                        2 to {room.level.rangeMax}
                      </span>
                    </div>
                    <input
                      type="number"
                      disabled={!isMyTurn}
                      className="input-field input-number"
                      value={paramA}
                      min={2}
                      max={room.level.rangeMax}
                      onChange={(e) => setParamA(parseInt(e.target.value) || 2)}
                      required
                    />
                  </div>
                )}

                {questionType === 'prime' && (
                  <div className="info-box">
                    Asks if the opponent's secret number is a prime number (e.g. 2, 3, 5, 7, 11...).
                  </div>
                )}

                {questionType === 'digit' && (
                  <div>
                    <div className="label-with-badge">
                      <label className="section-label" style={{ marginBottom: 0 }}>
                        Contains Digit
                      </label>
                      <span className="range-badge">
                        0 to 9
                      </span>
                    </div>
                    <input
                      type="number"
                      disabled={!isMyTurn}
                      className="input-field input-number"
                      value={paramA}
                      min={0}
                      max={9}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setParamA(isNaN(val) ? 0 : Math.min(9, Math.max(0, val)));
                      }}
                      required
                    />
                  </div>
                )}

                {questionType === 'between' && (
                  <div>
                    <div className="label-with-badge">
                      <label className="section-label" style={{ marginBottom: 0 }}>
                        Between Range [A to B]
                      </label>
                      <span className="range-badge">
                        Range: {room.level.rangeMin}–{room.level.rangeMax}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>From</label>
                        <input
                          type="number"
                          disabled={!isMyTurn}
                          className="input-field input-number"
                          value={paramA}
                          min={room.level.rangeMin}
                          max={paramB}
                          onChange={(e) => setParamA(parseInt(e.target.value) || room.level.rangeMin)}
                        />
                      </div>
                      <span style={{ fontWeight: 800, marginTop: '1.2rem' }}>to</span>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>To</label>
                        <input
                          type="number"
                          disabled={!isMyTurn}
                          className="input-field input-number"
                          value={paramB}
                          min={paramA}
                          max={room.level.rangeMax}
                          onChange={(e) => setParamB(parseInt(e.target.value) || room.level.rangeMax)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {questionType === 'custom' && (
                  <div>
                    <label className="section-label">
                      Custom Yes/No Question
                    </label>
                    <input
                      type="text"
                      disabled={!isMyTurn}
                      className="input-field"
                      placeholder="Type custom Yes/No question..."
                      value={customQuestionText}
                      onChange={(e) => setCustomQuestionText(e.target.value)}
                      required
                    />
                  </div>
                )}

                {/* Preview Box */}
                <div className="question-preview-box">
                  <div className="preview-label">
                    Question Preview
                  </div>
                  <div className="preview-text">
                    "{getConstructedQuestionText()}"
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!isMyTurn}
                  className="btn btn-primary"
                  style={{ width: '100%', gap: '0.5rem', marginTop: '0.25rem', minHeight: '48px' }}
                >
                  <Send size={16} /> Send Question
                </button>
              </form>
            ) : (
              <form onSubmit={handleMakeGuess} className="guess-form">
                <div>
                  <label className="section-label" style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                    What is the opponent's secret number?
                  </label>
                  <input
                    type="number"
                    disabled={!isMyTurn}
                    className="input-field input-number"
                    style={{ fontSize: '2.5rem', padding: '0.85rem' }}
                    value={guessInput}
                    min={room.level.rangeMin}
                    max={room.level.rangeMax}
                    placeholder="?"
                    onChange={(e) => setGuessInput(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={!isMyTurn}
                  className="btn btn-rose btn-lg"
                  style={{ width: '100%', gap: '0.5rem', minHeight: '48px', marginTop: 'auto' }}
                >
                  <Target size={18} /> Make Guess
                </button>
              </form>
            )}
          </div>

          {/* Right Column: Scratchpad */}
          <div id="online-scratchpad-panel" className="glass-panel game-scratchpad-panel">
            <div className="scratchpad-header">
              <div>
                <h3 className="scratchpad-title">Tactical Scratchpad</h3>
                <span className="scratchpad-subtitle">Personal deduction notes</span>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <button onClick={handleAutoEliminate} className="btn btn-sm btn-secondary" style={{ gap: '0.3rem', fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}>
                  <Sparkles size={12} color="var(--accent-primary)" /> Auto-Deduce
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('online-turn-action-panel');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="mobile-jump-scratchpad"
                  style={{ padding: '0.25rem 0.5rem' }}
                  title="Scroll back up"
                >
                  <ChevronUp size={14} />
                  <span>Top</span>
                </button>
              </div>
            </div>

            <div className="scratchpad-grid" style={{ flex: 1, minHeight: '200px' }}>
              {Array.from({ length: room.level.rangeMax - room.level.rangeMin + 1 }, (_, i) => {
                const num = room.level.rangeMin + i;
                const isEliminated = eliminatedNumbers.includes(num);
                const isPinned = pinnedCandidates.includes(num);

                let className = 'scratchpad-chip';
                if (isEliminated) className += ' eliminated';
                else if (isPinned) className += ' candidate';

                return (
                  <div
                    key={num}
                    onClick={() => toggleNumber(num)}
                    className={className}
                    title={`Number ${num}: Tap to toggle state`}
                  >
                    {num}
                  </div>
                );
              })}
            </div>

            <div className="scratchpad-legend">
              <span>Tap: Strike ➔ Star ➔ Clear</span>
              <span style={{ fontWeight: 700 }}>
                {room.level.rangeMax - room.level.rangeMin + 1 - eliminatedNumbers.length} candidates left
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Questions Log */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>
          Match History ({room.questions.length} questions, {room.guesses.length} guesses)
        </h4>
        <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {[...room.questions].reverse().map((q) => (
            <div
              key={q.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.55rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-secondary)',
                fontSize: '0.85rem'
              }}
            >
              <span><strong>{q.asker === 'host' ? room.hostName : room.guestName}:</strong> {q.text}</span>
              <span className={q.verdict === 'yes' ? 'badge badge-emerald' : 'badge badge-rose'}>
                {q.verdict.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
