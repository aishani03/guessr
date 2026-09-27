import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, Home, Award, HelpCircle, Target, Sparkles, CheckCircle2 } from 'lucide-react';
import { GameState } from '../types/game';
import { playWinFanfare, playTapSound } from '../utils/sound';

interface GameOverModalProps {
  gameState: GameState;
  onRematch: () => void;
  onReturnToMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  gameState,
  onRematch,
  onReturnToMenu
}) => {
  const winner = gameState.winnerId === 'player1' ? gameState.player1 : gameState.player2;
  const loser = gameState.winnerId === 'player1' ? gameState.player2 : gameState.player1;

  useEffect(() => {
    // Play fanfare
    playWinFanfare();

    // Launch festive confetti explosion
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 }
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 }
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const totalQuestions = gameState.questions.length;
  const totalGuesses = gameState.guesses.length;

  return (
    <div className="modal-backdrop">
      <div
        className="modal-content"
        style={{
          padding: '2.5rem 2rem',
          maxWidth: '560px',
          textAlign: 'center',
          borderTop: '5px solid var(--accent-emerald)'
        }}
      >
        {/* Trophy icon */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '26px',
          background: 'rgba(16, 185, 129, 0.15)',
          color: 'var(--accent-emerald)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)'
        }} className="animate-bounce-slow">
          <Trophy size={42} />
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.35rem 0.9rem',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(16, 185, 129, 0.12)',
          color: 'var(--accent-emerald)',
          fontWeight: 800,
          fontSize: '0.8rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '0.75rem'
        }}>
          <Sparkles size={14} /> Victory Achieved!
        </div>

        <h2 style={{ fontSize: '2.4rem', marginBottom: '0.4rem', lineHeight: 1.1 }}>
          <span style={{ color: winner.id === 'player1' ? 'var(--p1-color)' : 'var(--p2-color)' }}>
            {winner.name}
          </span> Wins!
        </h2>

        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1.75rem' }}>
          {gameState.winReason || `Correctly pinpointed ${loser.name}'s secret number in turn ${gameState.turnNumber}!`}
        </p>

        {/* Revealed Secret Numbers Card */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
          padding: '1.25rem',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '1.75rem'
        }}>
          {/* Player 1 Card */}
          <div style={{
            padding: '0.85rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface-elevated)',
            border: gameState.winnerId === 'player1' ? '2px solid var(--p1-color)' : '1px solid var(--border-subtle)'
          }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--p1-color)', fontWeight: 700, marginBottom: '0.2rem' }}>
              {gameState.player1.name}'s Secret
            </div>
            <div style={{
              fontSize: '2.2rem',
              fontWeight: 900,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-primary)'
            }}>
              {gameState.player1.secretNumber}
            </div>
            {gameState.winnerId === 'player1' && (
              <span className="badge badge-emerald" style={{ marginTop: '0.35rem' }}>
                Winner
              </span>
            )}
          </div>

          {/* Player 2 Card */}
          <div style={{
            padding: '0.85rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface-elevated)',
            border: gameState.winnerId === 'player2' ? '2px solid var(--p2-color)' : '1px solid var(--border-subtle)'
          }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--p2-color)', fontWeight: 700, marginBottom: '0.2rem' }}>
              {gameState.player2.name}'s Secret
            </div>
            <div style={{
              fontSize: '2.2rem',
              fontWeight: 900,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-primary)'
            }}>
              {gameState.player2.secretNumber}
            </div>
            {gameState.winnerId === 'player2' && (
              <span className="badge badge-emerald" style={{ marginTop: '0.35rem' }}>
                Winner
              </span>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.75rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-secondary)'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Total Turns
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
              {gameState.turnNumber}
            </div>
          </div>

          <div style={{
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-secondary)'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Questions
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
              {totalQuestions}
            </div>
          </div>

          <div style={{
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-secondary)'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Guesses
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
              {totalGuesses}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.85rem' }}>
          <button
            onClick={() => {
              playTapSound();
              onReturnToMenu();
            }}
            className="btn btn-secondary"
            style={{ flex: 1, gap: '0.5rem' }}
          >
            <Home size={18} /> Main Menu
          </button>

          <button
            onClick={() => {
              playTapSound();
              onRematch();
            }}
            className="btn btn-primary"
            style={{ flex: 1.3, gap: '0.5rem' }}
          >
            <RefreshCw size={18} /> Play Rematch
          </button>
        </div>
      </div>
    </div>
  );
};
