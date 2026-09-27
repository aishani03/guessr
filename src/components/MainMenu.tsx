import React from 'react';
import { Smartphone, Globe, Award, Sliders, HelpCircle, Sparkles } from 'lucide-react';
import { playTapSound } from '../utils/sound';

interface MainMenuProps {
  onStartOffline: () => void;
  onStartOnline: () => void;
  onOpenLevels: () => void;
  onOpenFreePlay: () => void;
  onOpenHowToPlay: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartOffline,
  onStartOnline,
  onOpenLevels,
  onOpenFreePlay,
  onOpenHowToPlay
}) => {
  return (
    <div className="view-enter" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      padding: '1.5rem 0 3rem',
      maxWidth: '900px',
      margin: '0 auto',
      width: '100%'
    }}>
      {/* Hero Badge */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.4rem 1rem',
        borderRadius: 'var(--radius-full)',
        background: 'var(--p1-bg)',
        border: '1px solid var(--p1-border)',
        color: 'var(--accent-primary)',
        fontSize: '0.85rem',
        fontWeight: 700,
        marginBottom: '1.25rem'
      }}>
        <Sparkles size={16} /> 2-Player Tactical Number Guessing Game
      </div>

      {/* Hero Title */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{
          fontSize: 'clamp(2.75rem, 7vw, 4.5rem)',
          fontWeight: 900,
          letterSpacing: '-0.04em',
          lineHeight: 1.05,
          marginBottom: '0.85rem',
          background: 'linear-gradient(135deg, var(--text-primary) 30%, var(--accent-primary) 70%, var(--accent-secondary) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Guessr
        </h1>
        <p style={{
          fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
          color: 'var(--text-secondary)',
          maxWidth: '560px',
          margin: '0 auto',
          lineHeight: 1.5
        }}>
          Secretly pick your number. Interrogate your opponent with tactical Yes/No questions. Pinpoint their secret before they deduce yours.
        </p>
      </div>

      {/* Main Mode Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.25rem',
        width: '100%',
        marginBottom: '2rem'
      }}>
        {/* Offline Mode */}
        <div
          onClick={() => {
            playTapSound();
            onStartOffline();
          }}
          className="glass-panel-interactive"
          style={{
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderTop: '4px solid var(--accent-primary)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{
            position: 'absolute',
            top: 12,
            right: 12
          }}>
            <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
              Offline Ready
            </span>
          </div>

          <div>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: 'var(--p1-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
              marginBottom: '1.25rem'
            }}>
              <Smartphone size={28} />
            </div>

            <h3 style={{ fontSize: '1.4rem', marginBottom: '0.4rem' }}>Offline Mode</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '1.25rem' }}>
              Pass & play on a single screen. Device curtain protects each player's secret number during turns.
            </p>
          </div>

          <button className="btn btn-p1" style={{ width: '100%' }}>
            Play Same Device
          </button>
        </div>

        {/* Online Mode */}
        <div
          onClick={() => {
            playTapSound();
            onStartOnline();
          }}
          className="glass-panel-interactive"
          style={{
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderTop: '4px solid var(--accent-secondary)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{
            position: 'absolute',
            top: 12,
            right: 12
          }}>
            <span className="badge badge-amber" style={{ fontSize: '0.7rem' }}>
              Multi-Device
            </span>
          </div>

          <div>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: 'var(--p2-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-secondary)',
              marginBottom: '1.25rem'
            }}>
              <Globe size={28} />
            </div>

            <h3 style={{ fontSize: '1.4rem', marginBottom: '0.4rem' }}>Online Mode</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '1.25rem' }}>
              Play across two devices in real time. Create a private room or enter a 6-character room code to join.
            </p>
          </div>

          <button className="btn btn-p2" style={{ width: '100%' }}>
            Multiplayer Room
          </button>
        </div>

        {/* Game Levels */}
        <div
          onClick={() => {
            playTapSound();
            onOpenLevels();
          }}
          className="glass-panel-interactive"
          style={{
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderTop: '4px solid var(--accent-amber)'
          }}
        >
          <div>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-amber)',
              marginBottom: '1.25rem'
            }}>
              <Award size={28} />
            </div>

            <h3 style={{ fontSize: '1.4rem', marginBottom: '0.4rem' }}>Game Levels</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '1.25rem' }}>
              Progress from Level 1 (Warm Up 1–20) to Level 5 (Insane 1–1000 with timers and guess caps).
            </p>
          </div>

          <button className="btn btn-secondary" style={{ width: '100%' }}>
            Select Level (1–5)
          </button>
        </div>

        {/* Free Play */}
        <div
          onClick={() => {
            playTapSound();
            onOpenFreePlay();
          }}
          className="glass-panel-interactive"
          style={{
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderTop: '4px solid var(--accent-cyan)'
          }}
        >
          <div>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: 'rgba(6, 182, 212, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)',
              marginBottom: '1.25rem'
            }}>
              <Sliders size={28} />
            </div>

            <h3 style={{ fontSize: '1.4rem', marginBottom: '0.4rem' }}>Free Play</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '1.25rem' }}>
              Custom sandbox. Choose your own number range, timer limit, and question rules.
            </p>
          </div>

          <button className="btn btn-secondary" style={{ width: '100%' }}>
            Customize Rules
          </button>
        </div>
      </div>

      {/* Secondary Actions & Info */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.85rem',
        marginTop: '0.5rem'
      }}>
        <button
          onClick={() => {
            playTapSound();
            onOpenHowToPlay();
          }}
          className="btn btn-secondary"
          style={{ gap: '0.45rem' }}
        >
          <HelpCircle size={17} /> How to Play
        </button>
      </div>
    </div>
  );
};
