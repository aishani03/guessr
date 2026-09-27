export type GameMode = 'menu' | 'offline' | 'online' | 'levels' | 'freeplay' | 'howtoplay';

export type GameLevelId = 'warmup' | 'challenge' | 'speed' | 'expert' | 'insane' | 'custom';

export interface GameLevel {
  id: GameLevelId;
  levelNumber: number | string;
  name: string;
  tagline: string;
  description: string;
  rangeMin: number;
  rangeMax: number;
  timerSeconds: number | null; // null = no timer
  maxQuestions: number | null; // null = unlimited
  maxGuesses: number | null; // null = unlimited
  badgeColor: string;
  iconName: string;
}

export type PlayerId = 'player1' | 'player2';

export interface Player {
  id: PlayerId;
  name: string;
  secretNumber: number | null;
  questionsAsked: number;
  guessesMade: number;
  eliminatedNumbers: number[];
  pinnedCandidates: number[];
}

export type QuestionVerdict = 'yes' | 'no' | 'pending';

export type QuestionType = 
  | 'greater'
  | 'less'
  | 'equal'
  | 'even'
  | 'odd'
  | 'divisible'
  | 'prime'
  | 'digit'
  | 'between'
  | 'custom';

export interface QuestionRecord {
  id: string;
  askerId: PlayerId;
  targetId: PlayerId;
  questionText: string;
  questionType: QuestionType;
  paramA?: number;
  paramB?: number;
  verdict: QuestionVerdict;
  autoVerified: boolean;
  turnNumber: number;
  timestamp: number;
}

export interface GuessRecord {
  id: string;
  guesserId: PlayerId;
  targetId: PlayerId;
  guessNumber: number;
  isCorrect: boolean;
  turnNumber: number;
  timestamp: number;
}

export type GamePhase =
  | 'setup'
  | 'secret_picker_p1'
  | 'pass_to_p2'
  | 'secret_picker_p2'
  | 'turn_transition' // Shield screen when passing device
  | 'playing'
  | 'answering' // Opponent answers yes/no
  | 'game_over';

export interface GameState {
  mode: GameMode;
  level: GameLevel;
  player1: Player;
  player2: Player;
  activePlayerId: PlayerId;
  phase: GamePhase;
  questions: QuestionRecord[];
  guesses: GuessRecord[];
  turnNumber: number;
  winnerId: PlayerId | null;
  winReason: string | null;
  timerSecondsRemaining: number | null;
  pendingQuestion: QuestionRecord | null;
  autoVerifyEnabled: boolean;
}

export interface OnlineRoomData {
  roomCode: string;
  hostPlayerId: string;
  hostName: string;
  guestPlayerId: string | null;
  guestName: string | null;
  level: GameLevel;
  hostSecret: number | null;
  guestSecret: number | null;
  activePlayer: 'host' | 'guest';
  status: 'waiting' | 'picking_secrets' | 'playing' | 'game_over';
  winner: 'host' | 'guest' | null;
  questions: Array<{
    id: string;
    asker: 'host' | 'guest';
    text: string;
    verdict: 'yes' | 'no' | 'pending';
    turnNumber: number;
  }>;
  guesses: Array<{
    id: string;
    guesser: 'host' | 'guest';
    guessNumber: number;
    isCorrect: boolean;
    turnNumber: number;
  }>;
  pendingQuestion: {
    id: string;
    asker: 'host' | 'guest';
    text: string;
    type: string;
    paramA?: number;
    paramB?: number;
  } | null;
  updatedAt: number;
}
