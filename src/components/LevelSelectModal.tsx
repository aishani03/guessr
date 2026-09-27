import React from 'react';
import { X, Award, Zap, Brain, Flame, Target, Coffee, Clock, HelpCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { GameLevel } from '../types/game';
import { GAME_LEVELS } from '../constants/levels';
import { playTapSound } from '../utils/sound';

interface LevelSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLevel: (level: GameLevel) => void;
  onOpenFreePlay: () => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  isOpen,
  onClose,
  onSelectLevel,
  onOpenFreePlay
}) => {
  if (!isOpen) return null;

  const renderIcon = (name: string, color: string) => {
    const props = { size: 22, color };
    switch (name) {
      case 'Coffee': return <Coffee {...props} />;
      case 'Target': return <Target {...props} />;
      case 'Zap': return <Zap {...props} />;
      case 'Brain': return <Brain {...props} />;
      case 'Flame': return <Flame {...props} />;
      default: return <Award {...props} />;
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ padding: '1.75rem', maxWidth: '640px' }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <Award size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', lineHeight: 1.2 }}>Game Levels</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Choose your challenge tier</span>
            </div>
          </div>
          <button
            onClick={() => {
              playTapSound();
              onClose();
            }}
            className="btn-icon"
            style={{ width: '34px', height: '34px' }}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Level List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
          {GAME_LEVELS.map((level) => (
            <div
              key={level.id}
              onClick={() => {
                playTapSound();
                onSelectLevel(level);
              }}
              className="glass-panel-interactive"
              style={{
                padding: '1rem 1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {renderIcon(level.iconName, level.badgeColor)}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span style={{
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      color: level.badgeColor,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Level {level.levelNumber}
                    </span>
                    <h3 style={{ fontSize: '1.05rem', margin: 0 }}>{level.name}</h3>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.45rem', lineHeight: 1.35 }}>
                    {level.description}
                  </p>

                  {/* Rules Tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <span className="badge" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                      Range: {level.rangeMin}–{level.rangeMax}
                    </span>

                    {level.timerSeconds ? (
                      <span className="badge badge-amber">
                        <Clock size={11} /> {level.timerSeconds}s timer
                      </span>
                    ) : (
                      <span className="badge badge-emerald">No Timer</span>
                    )}

                    {level.maxQuestions ? (
                      <span className="badge badge-rose">
                        <HelpCircle size={11} /> {level.maxQuestions} Qs max
                      </span>
                    ) : (
                      <span className="badge" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                        Unlimited Qs
                      </span>
                    )}

                    {level.maxGuesses && (
                      <span className="badge badge-rose">
                        <AlertCircle size={11} /> {level.maxGuesses} guesses
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center'
              }}>
                <ChevronRight size={20} />
              </div>
            </div>
          ))}
        </div>

        {/* Free Play Banner */}
        <div
          onClick={() => {
            playTapSound();
            onOpenFreePlay();
          }}
          style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-secondary)',
            border: '1.5px dashed var(--accent-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
        >
          <div>
            <h4 style={{ fontSize: '0.95rem', color: 'var(--accent-secondary)', marginBottom: '0.2rem' }}>
              Want Custom Rules? Free Play
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Set any number range, custom timer, question limits, and guess caps.
            </p>
          </div>
          <button className="btn btn-sm btn-secondary" style={{ flexShrink: 0 }}>
            Configure
          </button>
        </div>
      </div>
    </div>
  );
};
