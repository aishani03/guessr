import React, { useState } from 'react';
import { X, Sliders, Check, Clock, HelpCircle, AlertCircle, Play } from 'lucide-react';
import { GameLevel } from '../types/game';
import { playTapSound } from '../utils/sound';

interface FreePlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartCustomGame: (customLevel: GameLevel) => void;
}

export const FreePlayModal: React.FC<FreePlayModalProps> = ({
  isOpen,
  onClose,
  onStartCustomGame
}) => {
  const [min, setMin] = useState<number>(1);
  const [max, setMax] = useState<number>(100);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [maxQuestions, setMaxQuestions] = useState<number | null>(null);
  const [maxGuesses, setMaxGuesses] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleQuickRange = (quickMin: number, quickMax: number) => {
    playTapSound();
    setMin(quickMin);
    setMax(quickMax);
  };

  const handleStart = () => {
    playTapSound();
    const finalMin = Math.max(1, Math.min(min, max - 1));
    const finalMax = Math.max(finalMin + 1, max);

    const customLevel: GameLevel = {
      id: 'custom',
      levelNumber: 'Free',
      name: 'Free Play',
      tagline: `${finalMin}–${finalMax} Custom Match`,
      description: `Custom match: Range ${finalMin}–${finalMax}${timerSeconds ? `, ${timerSeconds}s timer` : ''}${maxQuestions ? `, ${maxQuestions} questions` : ''}.`,
      rangeMin: finalMin,
      rangeMax: finalMax,
      timerSeconds: timerSeconds,
      maxQuestions: maxQuestions,
      maxGuesses: maxGuesses,
      badgeColor: 'var(--accent-secondary)',
      iconName: 'Sliders'
    };

    onStartCustomGame(customLevel);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ padding: '1.75rem', maxWidth: '580px' }}
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
              background: 'rgba(236, 72, 153, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-secondary)'
            }}>
              <Sliders size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', lineHeight: 1.2 }}>Free Play Rules</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Customize match parameters</span>
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

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
          {/* Range selection */}
          <div>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Number Range
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Min</span>
                <input
                  type="number"
                  className="input-field input-number"
                  value={min}
                  min={1}
                  max={max - 1}
                  onChange={(e) => setMin(parseInt(e.target.value) || 1)}
                />
              </div>
              <span style={{ fontWeight: 800, color: 'var(--text-muted)', marginTop: '1.2rem' }}>to</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Max</span>
                <input
                  type="number"
                  className="input-field input-number"
                  value={max}
                  min={min + 1}
                  max={5000}
                  onChange={(e) => setMax(parseInt(e.target.value) || min + 1)}
                />
              </div>
            </div>

            {/* Range Presets */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {[
                { label: '1–20 (Quick)', minVal: 1, maxVal: 20 },
                { label: '1–50', minVal: 1, maxVal: 50 },
                { label: '1–100 (Standard)', minVal: 1, maxVal: 100 },
                { label: '1–500', minVal: 1, maxVal: 500 },
                { label: '1–1000', minVal: 1, maxVal: 1000 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleQuickRange(preset.minVal, preset.maxVal)}
                  className="btn btn-sm"
                  style={{
                    background: min === preset.minVal && max === preset.maxVal ? 'var(--p1-bg)' : 'var(--bg-secondary)',
                    borderColor: min === preset.minVal && max === preset.maxVal ? 'var(--accent-primary)' : 'var(--border-subtle)',
                    color: min === preset.minVal && max === preset.maxVal ? 'var(--accent-primary)' : 'var(--text-secondary)'
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Turn Timer */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              <Clock size={16} color="var(--accent-amber)" /> Turn Timer
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {[
                { label: 'No Timer', val: null },
                { label: '15s (Blitz)', val: 15 },
                { label: '30s (Fast)', val: 30 },
                { label: '45s', val: 45 },
                { label: '60s', val: 60 }
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setTimerSeconds(opt.val);
                  }}
                  className="btn btn-sm"
                  style={{
                    background: timerSeconds === opt.val ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-secondary)',
                    borderColor: timerSeconds === opt.val ? 'var(--accent-amber)' : 'var(--border-subtle)',
                    color: timerSeconds === opt.val ? 'var(--accent-amber)' : 'var(--text-secondary)'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Question Limit */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              <HelpCircle size={16} color="var(--accent-cyan)" /> Question Limit
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {[
                { label: 'Unlimited', val: null },
                { label: '5 Questions', val: 5 },
                { label: '10 Questions', val: 10 },
                { label: '15 Questions', val: 15 },
                { label: '20 Questions', val: 20 }
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setMaxQuestions(opt.val);
                  }}
                  className="btn btn-sm"
                  style={{
                    background: maxQuestions === opt.val ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-secondary)',
                    borderColor: maxQuestions === opt.val ? 'var(--accent-cyan)' : 'var(--border-subtle)',
                    color: maxQuestions === opt.val ? 'var(--accent-cyan)' : 'var(--text-secondary)'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Guess Limit */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              <AlertCircle size={16} color="var(--accent-rose)" /> Exact Guess Limit
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {[
                { label: 'Unlimited', val: null },
                { label: '3 Guesses', val: 3 },
                { label: '5 Guesses', val: 5 },
                { label: '8 Guesses', val: 8 }
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setMaxGuesses(opt.val);
                  }}
                  className="btn btn-sm"
                  style={{
                    background: maxGuesses === opt.val ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-secondary)',
                    borderColor: maxGuesses === opt.val ? 'var(--accent-rose)' : 'var(--border-subtle)',
                    color: maxGuesses === opt.val ? 'var(--accent-rose)' : 'var(--text-secondary)'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleStart}
          className="btn btn-primary btn-lg"
          style={{ width: '100%', gap: '0.5rem' }}
        >
          <Play size={18} /> Start Custom Match
        </button>
      </div>
    </div>
  );
};
