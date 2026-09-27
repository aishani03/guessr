import React, { useState } from 'react';
import { Users, User, ArrowRight, ShieldCheck, Dices, Award, Clock } from 'lucide-react';
import { GameLevel } from '../types/game';
import { playTapSound } from '../utils/sound';

interface OfflineSetupProps {
  level: GameLevel;
  onStartMatch: (p1Name: string, p2Name: string, rangeMin: number, rangeMax: number) => void;
  onBackToMenu: () => void;
  onChangeLevel: () => void;
}

export const OfflineSetup: React.FC<OfflineSetupProps> = ({
  level,
  onStartMatch,
  onBackToMenu,
  onChangeLevel
}) => {
  const [p1Name, setP1Name] = useState('Player 1');
  const [p2Name, setP2Name] = useState('Player 2');
  const [rangeMin, setRangeMin] = useState(level.rangeMin);
  const [rangeMax, setRangeMax] = useState(level.rangeMax);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playTapSound();
    const finalP1 = p1Name.trim() || 'Player 1';
    const finalP2 = p2Name.trim() || 'Player 2';
    onStartMatch(finalP1, finalP2, rangeMin, rangeMax);
  };

  return (
    <div className="view-enter" style={{
      maxWidth: '580px',
      margin: '0 auto',
      width: '100%',
      padding: '1rem 0 3.5rem',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div className="glass-panel card-container" style={{
        padding: '2.25rem 2rem 3rem',
        display: 'flex',
        flexDirection: 'column',
        height: 'auto',
        minHeight: 'fit-content',
        overflow: 'visible'
      }}>
        {/* Title Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem', flexShrink: 0 }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '18px',
            background: 'var(--p1-bg)',
            color: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <Users size={30} />
          </div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.35rem', lineHeight: 1.2 }}>Offline Match Setup</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Two players on the same device. Secret numbers will be chosen privately.
          </p>
        </div>

        {/* Level Banner */}
        <div style={{
          padding: '0.85rem 1.1rem',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          flexShrink: 0
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
              <span className="badge" style={{ background: 'var(--p1-bg)', color: level.badgeColor }}>
                {level.id === 'custom' ? 'Custom' : `Level ${level.levelNumber}`}
              </span>
              <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{level.name}</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Range: {rangeMin}–{rangeMax} {level.timerSeconds ? `• ${level.timerSeconds}s timer` : ''}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              playTapSound();
              onChangeLevel();
            }}
            className="btn btn-sm btn-ghost"
            style={{ fontSize: '0.8rem', textDecoration: 'underline' }}
          >
            Change
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="card-form" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          width: '100%',
          flex: '1 0 auto'
        }}>
          {/* Player 1 Input */}
          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.9rem',
              fontWeight: 700,
              color: 'var(--p1-color)',
              marginBottom: '0.4rem'
            }}>
              <User size={16} /> Player 1 (Host)
            </label>
            <input
              type="text"
              className="input-field"
              value={p1Name}
              maxLength={20}
              placeholder="Enter Player 1 name"
              onChange={(e) => setP1Name(e.target.value)}
              required
            />
          </div>

          {/* Player 2 Input */}
          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.9rem',
              fontWeight: 700,
              color: 'var(--p2-color)',
              marginBottom: '0.4rem'
            }}>
              <User size={16} /> Player 2 (Challenger)
            </label>
            <input
              type="text"
              className="input-field"
              value={p2Name}
              maxLength={20}
              placeholder="Enter Player 2 name"
              onChange={(e) => setP2Name(e.target.value)}
              required
            />
          </div>

          {/* Range Quick selector for freeplay/casual */}
          {level.id === 'custom' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                Match Range
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="number"
                  className="input-field input-number"
                  value={rangeMin}
                  min={1}
                  max={rangeMax - 1}
                  onChange={(e) => setRangeMin(parseInt(e.target.value) || 1)}
                />
                <span style={{ alignSelf: 'center', fontWeight: 800, color: 'var(--text-muted)' }}>to</span>
                <input
                  type="number"
                  className="input-field input-number"
                  value={rangeMax}
                  min={rangeMin + 1}
                  max={5000}
                  onChange={(e) => setRangeMax(parseInt(e.target.value) || rangeMin + 1)}
                />
              </div>
            </div>
          )}

          {/* Privacy Note */}
          <div style={{
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem'
          }}>
            <ShieldCheck size={20} color="var(--accent-emerald)" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              <strong>Device privacy guaranteed:</strong> You will pass the device so both of you can pick secret numbers privately.
            </p>
          </div>

          {/* Action Buttons Row */}
          <div className="card-actions-row" style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'stretch',
            gap: '0.85rem',
            marginTop: '1.75rem',
            paddingTop: '0.5rem',
            width: '100%'
          }}>
            <button
              type="button"
              onClick={() => {
                playTapSound();
                onBackToMenu();
              }}
              className="btn btn-secondary"
              style={{
                flex: '1 1 120px',
                minWidth: '100px',
                padding: '0.85rem 1.25rem'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                flex: '2 1 240px',
                minWidth: '220px',
                gap: '0.5rem',
                whiteSpace: 'normal',
                textAlign: 'center',
                lineHeight: 1.35,
                padding: '0.85rem 1.4rem'
              }}
            >
              Proceed to Secret Picker <ArrowRight size={18} style={{ flexShrink: 0 }} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
