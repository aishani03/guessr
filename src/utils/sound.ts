// Web Audio API Sound Synthesizer for Guessr
// Completely offline, responsive, zero-latency audio

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

export const setSoundEnabled = (enabled: boolean) => {
  soundEnabled = enabled;
  try {
    localStorage.setItem('guessr_sound_enabled', enabled ? 'true' : 'false');
  } catch {
    // Ignore storage errors
  }
};

export const getSoundEnabled = (): boolean => {
  try {
    const saved = localStorage.getItem('guessr_sound_enabled');
    if (saved !== null) {
      soundEnabled = saved === 'true';
    }
  } catch {
    // default true
  }
  return soundEnabled;
};

const getAudioContext = (): AudioContext | null => {
  if (!soundEnabled) return null;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
};

// Tactical button tap
export const playTapSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(480, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.05);

  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.05);
};

// Yes / affirmative answer chime
export const playYesSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  [523.25, 659.25, 783.99].forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + idx * 0.06);

    gain.gain.setValueAtTime(0.1, now + idx * 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.06);
    osc.stop(now + idx * 0.06 + 0.2);
  });
};

// No / negative buzzer
export const playNoSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(260, now);
  osc.frequency.setValueAtTime(200, now + 0.08);

  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.25);
};

// Passing turn transition chime
export const playTurnChime = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  [440, 554.37].forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * 0.08);

    gain.gain.setValueAtTime(0.08, now + idx * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.08);
    osc.stop(now + idx * 0.08 + 0.22);
  });
};

// Ticking clock for last 5 seconds
export const playTickSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(800, now);

  gain.gain.setValueAtTime(0.03, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.04);
};

// Grand Victory Fanfare
export const playWinFanfare = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const notes = [
    { f: 523.25, d: 0.12 }, // C5
    { f: 659.25, d: 0.12 }, // E5
    { f: 783.99, d: 0.12 }, // G5
    { f: 1046.50, d: 0.4 }  // C6
  ];

  let timeOffset = 0;
  notes.forEach((note) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(note.f, now + timeOffset);

    gain.gain.setValueAtTime(0.15, now + timeOffset);
    gain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + note.d);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + timeOffset);
    osc.stop(now + timeOffset + note.d);

    timeOffset += note.d * 0.85;
  });
};
