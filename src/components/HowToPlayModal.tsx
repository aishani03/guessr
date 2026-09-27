import React from 'react';
import { X, HelpCircle, Shield, Target, Lightbulb, Zap, ArrowRight } from 'lucide-react';
import { playTapSound } from '../utils/sound';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ padding: '1.75rem', maxWidth: '620px' }}
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
              background: 'var(--p1-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)'
            }}>
              <HelpCircle size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', lineHeight: 1.2 }}>How to Play Guessr</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Rules & Winning Strategy</span>
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

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{
            display: 'flex',
            gap: '0.85rem',
            padding: '0.85rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, #4f46e5 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.9rem',
              flexShrink: 0
            }}>
              1
            </div>
            <div>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '0.2rem' }}>Secret Number Selection</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Both players secretly choose a number within the selected range (e.g. 1–100). Keep your number hidden!
              </p>
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '0.85rem',
            padding: '0.85rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--accent-secondary) 0%, #be185d 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.9rem',
              flexShrink: 0
            }}>
              2
            </div>
            <div>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '0.2rem' }}>Take Turns: Ask or Guess</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                On your turn, choose one action:
              </p>
              <ul style={{ paddingLeft: '1.25rem', marginTop: '0.35rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <li><strong>Ask a Yes/No Question:</strong> E.g. "Is it greater than 50?", "Is it even?", "Is it divisible by 5?"</li>
                <li><strong>Make an Exact Guess:</strong> If you are confident, guess their exact number!</li>
              </ul>
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '0.85rem',
            padding: '0.85rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--accent-emerald) 0%, #059669 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.9rem',
              flexShrink: 0
            }}>
              3
            </div>
            <div>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '0.2rem' }}>Eliminate on the Scratchpad</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Use the interactive number grid to cross out eliminated numbers or use the <strong>Auto-Eliminate</strong> helper to keep your tactical deductions organized.
              </p>
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '0.85rem',
            padding: '0.85rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--accent-amber) 0%, #d97706 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.9rem',
              flexShrink: 0
            }}>
              4
            </div>
            <div>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '0.2rem' }}>Victory Condition</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                The first player to correctly pinpoint the opponent's secret number wins immediately!
              </p>
            </div>
          </div>
        </div>

        {/* Pro Tip Box */}
        <div style={{
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px dashed var(--accent-primary)',
          display: 'flex',
          gap: '0.75rem',
          marginBottom: '1.25rem'
        }}>
          <Lightbulb size={24} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h5 style={{ fontSize: '0.9rem', color: 'var(--accent-primary)', marginBottom: '0.25rem' }}>
              Pro Tip: The Binary Search Method
            </h5>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              To find a number between 1 and 100 in the fewest questions, divide the remaining range in half each time (e.g. "Greater than 50?", then "Greater than 75?"). You can guarantee finding any number in at most 7 questions!
            </p>
          </div>
        </div>

        {/* Footer Button */}
        <button
          onClick={() => {
            playTapSound();
            onClose();
          }}
          className="btn btn-primary"
          style={{ width: '100%' }}
        >
          Got it, Let's Play!
        </button>
      </div>
    </div>
  );
};
