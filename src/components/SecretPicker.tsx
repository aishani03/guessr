import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Sparkles, Dices, Check, ArrowRight, Shield } from 'lucide-react';
import { Player, GameLevel } from '../types/game';
import { playTapSound, playYesSound } from '../utils/sound';

interface SecretPickerProps {
  player: Player;
  rangeMin: number;
  rangeMax: number;
  level: GameLevel;
  onConfirmSecret: (secretNumber: number) => void;
}

export const SecretPicker: React.FC<SecretPickerProps> = ({
  player,
  rangeMin,
  rangeMax,
  level,
  onConfirmSecret
}) => {
  const [value, setValue] = useState<string>('');
  const [showNumber, setShowNumber] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isP1 = player.id === 'player1';
  const playerThemeColor = isP1 ? 'var(--p1-color)' : 'var(--p2-color)';
  const playerBg = isP1 ? 'var(--p1-bg)' : 'var(--p2-bg)';

  const handleRandomize = () => {
    playTapSound();
    const randomNum = Math.floor(Math.random() * (rangeMax - rangeMin + 1)) + rangeMin;
    setValue(randomNum.toString());
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(value, 10);

    if (isNaN(num)) {
      setErrorMsg('Please enter a valid number.');
      return;
    }

    if (num < rangeMin || num > rangeMax) {
      setErrorMsg(`Number must be between ${rangeMin} and ${rangeMax}.`);
      return;
    }

    playYesSound();
    onConfirmSecret(num);
  };

  return (
    <div className="view-enter" style={{
      maxWidth: '520px',
      margin: '0 auto',
      width: '100%',
      padding: '1.5rem 0 3rem'
    }}>
      <div className="glass-panel card-container" style={{
        padding: '2.25rem 2rem 2.75rem',
        borderTop: `4px solid ${playerThemeColor}`,
        display: 'flex',
        flexDirection: 'column',
        height: 'auto',
        minHeight: 'fit-content'
      }}>
        {/* Player Badge */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.35rem 0.9rem',
            borderRadius: 'var(--radius-full)',
            background: playerBg,
            color: playerThemeColor,
            fontWeight: 800,
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '0.75rem'
          }}>
            <Shield size={15} /> {player.name}'s Secret
          </div>

          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.35rem' }}>Choose Your Number</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Pick a secret integer between <strong>{rangeMin}</strong> and <strong>{rangeMax}</strong>.
            Your opponent must deduce this number to win.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Secret Number Input with Peek Toggle */}
          <div>
            <div style={{ position: 'relative' }}>
              <input
                type={showNumber ? 'number' : 'password'}
                inputMode="numeric"
                className="input-field input-number"
                style={{
                  fontSize: '2rem',
                  letterSpacing: showNumber ? '0.05em' : '0.35em',
                  padding: '1rem 3.5rem 1rem 1.25rem',
                  borderColor: errorMsg ? 'var(--accent-rose)' : undefined
                }}
                value={value}
                min={rangeMin}
                max={rangeMax}
                placeholder={showNumber ? `${rangeMin}–${rangeMax}` : '••••'}
                onChange={(e) => {
                  setValue(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                autoFocus
                required
              />

              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  setShowNumber(!showNumber);
                }}
                className="btn-icon"
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)'
                }}
                title={showNumber ? 'Hide secret' : 'Reveal secret to verify'}
              >
                {showNumber ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {errorMsg ? (
              <p style={{ color: 'var(--accent-rose)', fontSize: '0.82rem', marginTop: '0.45rem', fontWeight: 600 }}>
                {errorMsg}
              </p>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.45rem', textAlign: 'center' }}>
                Tap the eye icon to verify what you typed.
              </p>
            )}
          </div>

          {/* Random Helper Button */}
          <button
            type="button"
            onClick={handleRandomize}
            className="btn btn-secondary"
            style={{ width: '100%', gap: '0.5rem', fontSize: '0.9rem' }}
          >
            <Dices size={18} color="var(--accent-primary)" /> Pick a Random Secret for Me
          </button>

          {/* Privacy Warning */}
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem'
          }}>
            <Lock size={18} color={playerThemeColor} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Make sure your opponent is looking away from the screen before revealing!
            </span>
          </div>

          {/* Confirm Button */}
          <button
            type="submit"
            className={isP1 ? 'btn btn-p1 btn-lg' : 'btn btn-p2 btn-lg'}
            style={{ width: '100%', gap: '0.5rem', marginTop: '1.25rem' }}
          >
            <Lock size={19} /> Lock In Secret Number
          </button>
        </form>
      </div>
    </div>
  );
};
