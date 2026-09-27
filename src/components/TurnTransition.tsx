import React from 'react';
import { ShieldAlert, ArrowRight, UserCheck, Smartphone } from 'lucide-react';
import { Player } from '../types/game';
import { playTurnChime } from '../utils/sound';

interface TurnTransitionProps {
  nextPlayer: Player;
  reason?: string;
  onReady: () => void;
}

export const TurnTransition: React.FC<TurnTransitionProps> = ({
  nextPlayer,
  reason = 'Turn change',
  onReady
}) => {
  const isP1 = nextPlayer.id === 'player1';
  const playerThemeColor = isP1 ? 'var(--p1-color)' : 'var(--p2-color)';
  const playerBg = isP1 ? 'var(--p1-bg)' : 'var(--p2-bg)';

  const handleReveal = () => {
    playTurnChime();
    onReady();
  };

  return (
    <div className="view-enter" style={{
      maxWidth: '520px',
      margin: '0 auto',
      width: '100%',
      padding: '2rem 0 3rem'
    }}>
      <div className="glass-panel" style={{
        padding: '2.5rem 2rem',
        textAlign: 'center',
        borderTop: `5px solid ${playerThemeColor}`,
        boxShadow: 'var(--shadow-xl)'
      }}>
        {/* Pass Device Animation Icon */}
        <div style={{
          width: '74px',
          height: '74px',
          borderRadius: '24px',
          background: playerBg,
          color: playerThemeColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          boxShadow: 'var(--shadow-glow)'
        }} className="animate-bounce-slow">
          <Smartphone size={38} />
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.35rem 0.85rem',
          borderRadius: 'var(--radius-full)',
          background: 'var(--bg-secondary)',
          color: 'var(--text-muted)',
          fontSize: '0.78rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '1rem'
        }}>
          <ShieldAlert size={14} color="var(--accent-amber)" /> Privacy Screen Active
        </div>

        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', lineHeight: 1.2 }}>
          Pass Device to <span style={{ color: playerThemeColor }}>{nextPlayer.name}</span>
        </h2>

        <p style={{
          fontSize: '0.95rem',
          color: 'var(--text-secondary)',
          maxWidth: '380px',
          margin: '0 auto 2rem',
          lineHeight: 1.5
        }}>
          Hand the device over. Secret numbers, notes, and questions are shielded until unlocked.
        </p>

        {/* Big tactile button */}
        <button
          onClick={handleReveal}
          className={isP1 ? 'btn btn-p1 btn-lg' : 'btn btn-p2 btn-lg'}
          style={{
            width: '100%',
            gap: '0.65rem',
            padding: '1.15rem 1.5rem',
            fontSize: '1.1rem',
            borderRadius: 'var(--radius-lg)'
          }}
        >
          <UserCheck size={22} /> I'm {nextPlayer.name}, Reveal Screen
        </button>
      </div>
    </div>
  );
};
