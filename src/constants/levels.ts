import { GameLevel } from '../types/game';

export const GAME_LEVELS: GameLevel[] = [
  {
    id: 'warmup',
    levelNumber: 1,
    name: 'Warm Up',
    tagline: 'Casual & Relaxed',
    description: 'Range 1–20. Perfect for learning deduction strategies with no time pressure.',
    rangeMin: 1,
    rangeMax: 20,
    timerSeconds: null,
    maxQuestions: null,
    maxGuesses: null,
    badgeColor: 'var(--accent-emerald)',
    iconName: 'Coffee'
  },
  {
    id: 'challenge',
    levelNumber: 2,
    name: 'Challenge',
    tagline: 'Limited Questions',
    description: 'Range 1–100. Test your binary search efficiency with a strict 10-question budget.',
    rangeMin: 1,
    rangeMax: 100,
    timerSeconds: null,
    maxQuestions: 10,
    maxGuesses: null,
    badgeColor: 'var(--accent-cyan)',
    iconName: 'Target'
  },
  {
    id: 'speed',
    levelNumber: 3,
    name: 'Speed Round',
    tagline: 'Beat The Clock',
    description: 'Range 1–50 (or player choice). Think on your feet with a 30-second rapid turn timer.',
    rangeMin: 1,
    rangeMax: 50,
    timerSeconds: 30,
    maxQuestions: null,
    maxGuesses: null,
    badgeColor: 'var(--accent-amber)',
    iconName: 'Zap'
  },
  {
    id: 'expert',
    levelNumber: 4,
    name: 'Expert',
    tagline: 'High Stakes Deduction',
    description: 'Range 1–500. Combines a 25-second timer with a tight 12-question limit.',
    rangeMin: 1,
    rangeMax: 500,
    timerSeconds: 25,
    maxQuestions: 12,
    maxGuesses: null,
    badgeColor: 'var(--accent-primary)',
    iconName: 'Brain'
  },
  {
    id: 'insane',
    levelNumber: 5,
    name: 'Insane',
    tagline: 'Ultimate Test',
    description: 'Range 1–1000. Brutal 15-second timer, 15 questions, and only 5 exact guesses allowed!',
    rangeMin: 1,
    rangeMax: 1000,
    timerSeconds: 15,
    maxQuestions: 15,
    maxGuesses: 5,
    badgeColor: 'var(--accent-rose)',
    iconName: 'Flame'
  }
];

export const DEFAULT_FREEPLAY_LEVEL: GameLevel = {
  id: 'custom',
  levelNumber: 'Free',
  name: 'Free Play',
  tagline: 'Custom Rules & Range',
  description: 'Customize range boundaries, timer duration, question limit, and guess restrictions.',
  rangeMin: 1,
  rangeMax: 100,
  timerSeconds: null,
  maxQuestions: null,
  maxGuesses: null,
  badgeColor: 'var(--accent-secondary)',
  iconName: 'Sliders'
};
