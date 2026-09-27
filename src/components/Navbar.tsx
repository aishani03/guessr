import React from 'react';
import { Volume2, VolumeX, Moon, Sun, HelpCircle, ArrowLeft, Dices } from 'lucide-react';
import { GameMode } from '../types/game';
import { playTapSound } from '../utils/sound';

interface NavbarProps {
  currentMode: GameMode;
  onNavigateHome: () => void;
  onOpenHowToPlay: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  isPlayingGame?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMode,
  onNavigateHome,
  onOpenHowToPlay,
  soundEnabled,
  onToggleSound,
  theme,
  onToggleTheme,
  isPlayingGame
}) => {
  const handleHomeClick = () => {
    playTapSound();
    if (isPlayingGame) {
      if (window.confirm('Are you sure you want to leave the active match? Current progress will be lost.')) {
        onNavigateHome();
      }
    } else {
      onNavigateHome();
    }
  };

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1.25rem 0',
      marginBottom: '1rem',
      borderBottom: '1px solid var(--border-subtle)'
    }}>
      {/* Brand / Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {currentMode !== 'menu' && (
          <button
            onClick={handleHomeClick}
            className="btn-icon"
            title="Return to Menu"
            aria-label="Return to Menu"
          >
            <ArrowLeft size={18} />
          </button>
        )}

        <div
          onClick={handleHomeClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Dices size={22} />
          </div>
          <div>
            <h1 style={{
              fontSize: '1.45rem',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1,
              background: 'linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block'
            }}>
              Guessr
            </h1>
            <span style={{
              display: 'block',
              fontSize: '0.68rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'var(--text-muted)'
            }}>
              Tactical Deduction
            </span>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          onClick={() => {
            playTapSound();
            onOpenHowToPlay();
          }}
          className="btn-icon"
          title="How to Play"
          aria-label="How to Play"
        >
          <HelpCircle size={19} />
        </button>

        <button
          onClick={() => {
            onToggleSound();
          }}
          className="btn-icon"
          title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
          aria-label={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
        >
          {soundEnabled ? <Volume2 size={19} color="var(--accent-primary)" /> : <VolumeX size={19} />}
        </button>

        <button
          onClick={() => {
            playTapSound();
            onToggleTheme();
          }}
          className="btn-icon"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={19} color="var(--accent-amber)" /> : <Moon size={19} />}
        </button>
      </div>
    </header>
  );
};
