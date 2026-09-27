import React, { useState } from 'react';
import { Globe, PlusCircle, LogIn, Copy, Check, Users, ArrowRight, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { GameLevel } from '../types/game';
import { GAME_LEVELS } from '../constants/levels';
import { generateRoomCode } from '../utils/helpers';
import { playTapSound, playYesSound } from '../utils/sound';

interface OnlineLobbyProps {
  onCreateRoom: (hostName: string, level: GameLevel, roomCode: string) => void;
  onJoinRoom: (guestName: string, roomCode: string) => void;
  onBackToMenu: () => void;
}

export const OnlineLobby: React.FC<OnlineLobbyProps> = ({
  onCreateRoom,
  onJoinRoom,
  onBackToMenu
}) => {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [hostName, setHostName] = useState('Player 1');
  const [guestName, setGuestName] = useState('Player 2');
  const [selectedLevel, setSelectedLevel] = useState<GameLevel>(GAME_LEVELS[1]); // Default Level 2 (1-100)
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);

  // Auto-detect ?room=CODE in URL to immediately switch to Join tab with code prefilled
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setJoinCodeInput(roomParam.toUpperCase().trim());
      setTab('join');
    }
  }, []);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playTapSound();
    const code = generateRoomCode();
    onCreateRoom(hostName.trim() || 'Player 1', selectedLevel, code);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinCodeInput.trim().toUpperCase();
    if (!cleanCode) {
      setJoinError('Please enter a room code.');
      return;
    }
    if (cleanCode.length < 4) {
      setJoinError('Invalid room code length.');
      return;
    }
    playTapSound();
    onJoinRoom(guestName.trim() || 'Player 2', cleanCode);
  };

  return (
    <div className="view-enter" style={{
      maxWidth: '560px',
      margin: '0 auto',
      width: '100%',
      padding: '1rem 0 3rem'
    }}>
      <div className="glass-panel" style={{ padding: '2rem' }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '18px',
            background: 'var(--p2-bg)',
            color: 'var(--accent-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <Globe size={30} />
          </div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.35rem' }}>Online Multiplayer</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Play with a friend across two devices in real time.
          </p>
        </div>

        {/* Global Network Capability Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          padding: '0.45rem 0.9rem',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: 'var(--accent-emerald)',
          fontSize: '0.78rem',
          fontWeight: 700,
          margin: '0 auto 1.5rem',
          width: 'fit-content',
          textAlign: 'center'
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-emerald)', flexShrink: 0 }} />
          WebRTC Active: Play on Mobile 4G/5G, Separate Wi-Fi or Any Network!
        </div>

        {/* Tab switch */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          padding: '0.35rem',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-secondary)',
          marginBottom: '1.5rem'
        }}>
          <button
            type="button"
            onClick={() => {
              playTapSound();
              setTab('create');
            }}
            className="btn btn-sm"
            style={{
              flex: 1,
              background: tab === 'create' ? 'var(--bg-surface-elevated)' : 'transparent',
              color: tab === 'create' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              boxShadow: tab === 'create' ? 'var(--shadow-sm)' : 'none',
              borderColor: tab === 'create' ? 'var(--border-subtle)' : 'transparent'
            }}
          >
            <PlusCircle size={16} /> Create Room
          </button>

          <button
            type="button"
            onClick={() => {
              playTapSound();
              setTab('join');
            }}
            className="btn btn-sm"
            style={{
              flex: 1,
              background: tab === 'join' ? 'var(--bg-surface-elevated)' : 'transparent',
              color: tab === 'join' ? 'var(--accent-secondary)' : 'var(--text-secondary)',
              boxShadow: tab === 'join' ? 'var(--shadow-sm)' : 'none',
              borderColor: tab === 'join' ? 'var(--border-subtle)' : 'transparent'
            }}
          >
            <LogIn size={16} /> Join With Code
          </button>
        </div>

        {/* TAB 1: CREATE ROOM */}
        {tab === 'create' ? (
          <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                Your Player Name (Host)
              </label>
              <input
                type="text"
                className="input-field"
                value={hostName}
                maxLength={20}
                placeholder="Enter your name"
                onChange={(e) => setHostName(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                Select Match Level
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {GAME_LEVELS.map((lvl) => (
                  <div
                    key={lvl.id}
                    onClick={() => {
                      playTapSound();
                      setSelectedLevel(lvl);
                    }}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      background: selectedLevel.id === lvl.id ? 'var(--p1-bg)' : 'var(--bg-secondary)',
                      border: selectedLevel.id === lvl.id ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 150ms ease'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>
                        Level {lvl.levelNumber}: {lvl.name} ({lvl.rangeMin}–{lvl.rangeMax})
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {lvl.tagline} {lvl.timerSeconds ? `• ${lvl.timerSeconds}s timer` : ''}
                      </span>
                    </div>

                    {selectedLevel.id === lvl.id && (
                      <Check size={18} color="var(--accent-primary)" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  onBackToMenu();
                }}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Back
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 2, gap: '0.5rem' }}
              >
                Create Room & Get Code <ArrowRight size={18} />
              </button>
            </div>
          </form>
        ) : (
          /* TAB 2: JOIN ROOM */
          <form onSubmit={handleJoinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                Your Player Name (Guest)
              </label>
              <input
                type="text"
                className="input-field"
                value={guestName}
                maxLength={20}
                placeholder="Enter your name"
                onChange={(e) => setGuestName(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                Enter Room Code
              </label>
              <input
                type="text"
                className="input-field input-number"
                style={{ fontSize: '1.75rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}
                value={joinCodeInput}
                maxLength={8}
                placeholder="GSR123"
                onChange={(e) => {
                  setJoinCodeInput(e.target.value.toUpperCase());
                  if (joinError) setJoinError(null);
                }}
                autoFocus
                required
              />
              {joinError && (
                <p style={{ color: 'var(--accent-rose)', fontSize: '0.8rem', marginTop: '0.35rem', fontWeight: 600 }}>
                  {joinError}
                </p>
              )}
            </div>

            <div style={{
              padding: '0.85rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem'
            }}>
              <Sparkles size={18} color="var(--accent-secondary)" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Ask your opponent for their 6-character room code to connect your devices.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  onBackToMenu();
                }}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Back
              </button>
              <button
                type="submit"
                className="btn btn-p2"
                style={{ flex: 2, gap: '0.5rem' }}
              >
                Join Match <ArrowRight size={18} />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
