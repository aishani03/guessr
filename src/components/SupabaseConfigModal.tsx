import React, { useState, useEffect } from 'react';
import { X, Database, Check, Copy, ExternalLink, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  getSupabaseClient,
  SUPABASE_SQL_SCHEMA
} from '../utils/supabase';
import { playTapSound, playYesSound } from '../utils/sound';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (isOpen) {
      const config = getSupabaseConfig();
      setUrl(config.url);
      setAnonKey(config.anonKey);
      setStatusMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    playTapSound();

    saveSupabaseConfig({ url, anonKey });

    if (!url || !anonKey) {
      setStatusMsg('Using Instant Local Simulated Multiplayer (Zero setup, test between multiple browser tabs/windows).');
      setIsSuccess(true);
      return;
    }

    try {
      const client = getSupabaseClient();
      if (client) {
        setStatusMsg('Supabase client initialized successfully!');
        setIsSuccess(true);
        playYesSound();
      } else {
        setStatusMsg('Could not initialize Supabase client. Check URL and anon key.');
        setIsSuccess(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setStatusMsg(`Connection error: ${msg}`);
      setIsSuccess(false);
    }
  };

  const handleCopySQL = () => {
    playTapSound();
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ padding: '1.75rem', maxWidth: '600px' }}
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
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-emerald)'
            }}>
              <Database size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', lineHeight: 1.2 }}>Multiplayer Backend Setup</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Supabase Realtime Configuration</span>
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

        {/* Info Banner */}
        <div style={{
          padding: '0.85rem 1rem',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem' }}>
            <Sparkles size={16} color="var(--accent-primary)" />
            <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Dual Multiplayer Support</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            1. <strong>Local Multi-Tab Simulation:</strong> If fields below are blank, you can immediately test online mode across two browser windows on your computer!<br />
            2. <strong>Supabase Cloud:</strong> Enter your Supabase credentials to play online across phones, laptops, and different networks anywhere in the world.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              Supabase Project URL
            </label>
            <input
              type="url"
              className="input-field"
              placeholder="https://your-project.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              Supabase Anon / Public Key
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
            />
          </div>

          {statusMsg && (
            <div style={{
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: isSuccess ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              color: isSuccess ? 'var(--accent-emerald)' : 'var(--accent-rose)',
              fontSize: '0.82rem',
              fontWeight: 600
            }}>
              {statusMsg}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Save & Verify Connection
          </button>
        </form>

        {/* SQL Schema helper */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.4rem'
          }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Supabase SQL Table Schema (1-Click Setup)
            </span>
            <button
              type="button"
              onClick={handleCopySQL}
              className="btn btn-sm btn-secondary"
              style={{ gap: '0.35rem', fontSize: '0.75rem' }}
            >
              {copied ? <Check size={13} color="var(--accent-emerald)" /> : <Copy size={13} />}
              {copied ? 'Copied SQL!' : 'Copy SQL'}
            </button>
          </div>

          <pre style={{
            background: 'var(--bg-secondary)',
            padding: '0.75rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            overflowX: 'auto',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)'
          }}>
            {SUPABASE_SQL_SCHEMA}
          </pre>
        </div>
      </div>
    </div>
  );
};
