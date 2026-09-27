import React, { useState, useEffect, useRef } from 'react';
import {
  HelpCircle,
  Target,
  Clock,
  Send,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  RotateCcw,
  Flame
} from 'lucide-react';
import {
  GameState,
  QuestionType,
  QuestionRecord,
  QuestionVerdict
} from '../types/game';
import {
  evaluateQuestion,
  getNumbersToEliminate,
  formatTime
} from '../utils/helpers';
import {
  playTapSound,
  playYesSound,
  playNoSound,
  playTickSound
} from '../utils/sound';

interface GameBoardProps {
  gameState: GameState;
  onAskQuestion: (record: QuestionRecord) => void;
  onAnswerQuestion: (verdict: QuestionVerdict) => void;
  onMakeGuess: (guessNumber: number) => void;
  onTurnTimeout: () => void;
  onToggleScratchpadNumber: (num: number) => void;
  onAutoEliminateNumbers: (numbers: number[]) => void;
  onResetScratchpad: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  onAskQuestion,
  onAnswerQuestion,
  onMakeGuess,
  onTurnTimeout,
  onToggleScratchpadNumber,
  onAutoEliminateNumbers,
  onResetScratchpad
}) => {
  const activePlayer = gameState.activePlayerId === 'player1' ? gameState.player1 : gameState.player2;
  const opponentPlayer = gameState.activePlayerId === 'player1' ? gameState.player2 : gameState.player1;

  const isP1 = gameState.activePlayerId === 'player1';
  const playerThemeColor = isP1 ? 'var(--p1-color)' : 'var(--p2-color)';
  const playerBg = isP1 ? 'var(--p1-bg)' : 'var(--p2-bg)';

  // Action Mode: 'question' or 'guess'
  const [actionTab, setActionTab] = useState<'question' | 'guess'>('question');

  // Question Form State
  const [questionType, setQuestionType] = useState<QuestionType>('greater');
  const [paramA, setParamA] = useState<number>(Math.floor((gameState.level.rangeMin + gameState.level.rangeMax) / 2));
  const [paramB, setParamB] = useState<number>(gameState.level.rangeMax);
  const [customQuestionText, setCustomQuestionText] = useState<string>('');

  // Guess Form State
  const [guessInput, setGuessInput] = useState<string>('');
  const [guessError, setGuessError] = useState<string | null>(null);

  // History Tab
  const [historyTab, setHistoryTab] = useState<'questions' | 'guesses'>('questions');

  // Turn Timer effect
  const [timerLeft, setTimerLeft] = useState<number | null>(gameState.level.timerSeconds);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (gameState.phase === 'playing' && gameState.level.timerSeconds) {
      setTimerLeft(gameState.level.timerSeconds);

      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = window.setInterval(() => {
        setTimerLeft((prev) => {
          if (prev === null || prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            playNoSound();
            onTurnTimeout();
            return 0;
          }
          if (prev <= 6) {
            playTickSound();
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [gameState.turnNumber, gameState.activePlayerId, gameState.phase]);

  // Generate readable question string from parameters
  const getConstructedQuestionText = (): string => {
    switch (questionType) {
      case 'greater':
        return `Is your number greater than ${paramA}?`;
      case 'less':
        return `Is your number less than ${paramA}?`;
      case 'equal':
        return `Is your number equal to ${paramA}?`;
      case 'even':
        return `Is your number an even number?`;
      case 'odd':
        return `Is your number an odd number?`;
      case 'divisible':
        return `Is your number divisible by ${paramA}?`;
      case 'prime':
        return `Is your number a prime number?`;
      case 'digit':
        return `Does your number contain the digit ${paramA}?`;
      case 'between':
        return `Is your number between ${paramA} and ${paramB}?`;
      case 'custom':
        return customQuestionText.trim() || 'Is your number valid?';
      default:
        return '';
    }
  };

  const handleSendQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    playTapSound();

    const qText = getConstructedQuestionText();
    if (!qText) return;

    // Check if question limit reached
    if (gameState.level.maxQuestions && activePlayer.questionsAsked >= gameState.level.maxQuestions) {
      alert(`You have reached the maximum of ${gameState.level.maxQuestions} questions! You must make an exact guess.`);
      setActionTab('guess');
      return;
    }

    const questionRecord: QuestionRecord = {
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      askerId: gameState.activePlayerId,
      targetId: opponentPlayer.id,
      questionText: qText,
      questionType: questionType,
      paramA: questionType !== 'even' && questionType !== 'odd' && questionType !== 'prime' ? paramA : undefined,
      paramB: questionType === 'between' ? paramB : undefined,
      verdict: 'pending',
      autoVerified: gameState.autoVerifyEnabled,
      turnNumber: gameState.turnNumber,
      timestamp: Date.now()
    };

    onAskQuestion(questionRecord);
  };

  const handleMakeGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(guessInput, 10);

    if (isNaN(num)) {
      setGuessError('Please enter a valid number.');
      return;
    }

    if (num < gameState.level.rangeMin || num > gameState.level.rangeMax) {
      setGuessError(`Guess must be between ${gameState.level.rangeMin} and ${gameState.level.rangeMax}.`);
      return;
    }

    // Check if guess limit reached
    if (gameState.level.maxGuesses && activePlayer.guessesMade >= gameState.level.maxGuesses) {
      alert(`You have used all ${gameState.level.maxGuesses} guesses allowed in this level!`);
      return;
    }

    setGuessError(null);
    onMakeGuess(num);
    setGuessInput('');
  };

  // Run auto-eliminate deduction on scratchpad
  const handleRunAutoEliminate = () => {
    playTapSound();
    const myQuestions = gameState.questions.filter(
      (q) => q.askerId === gameState.activePlayerId && q.verdict !== 'pending' && q.questionType !== 'custom'
    );

    let allEliminated: number[] = [];
    myQuestions.forEach((q) => {
      const eliminated = getNumbersToEliminate(
        gameState.level.rangeMin,
        gameState.level.rangeMax,
        q.questionType,
        q.verdict,
        q.paramA,
        q.paramB
      );
      allEliminated = [...allEliminated, ...eliminated];
    });

    const uniqueEliminated = Array.from(new Set(allEliminated));
    onAutoEliminateNumbers(uniqueEliminated);
  };

  // Questions remaining calculations
  const questionsLeft = gameState.level.maxQuestions
    ? Math.max(0, gameState.level.maxQuestions - activePlayer.questionsAsked)
    : null;

  const guessesLeft = gameState.level.maxGuesses
    ? Math.max(0, gameState.level.maxGuesses - activePlayer.guessesMade)
    : null;

  return (
    <div className="view-enter" style={{
      maxWidth: '920px',
      margin: '0 auto',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem'
    }}>
      {/* 1. Header Match Status Bar */}
      <div className="glass-panel" style={{
        padding: '1.1rem 1.4rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        borderTop: `4px solid ${playerThemeColor}`
      }}>
        {/* Players Summary */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* Player 1 Chip */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            background: isP1 ? 'var(--p1-bg)' : 'var(--bg-secondary)',
            border: isP1 ? '2px solid var(--p1-color)' : '1px solid var(--border-subtle)',
            boxShadow: isP1 ? '0 0 14px var(--p1-bg)' : 'none',
            transition: 'all 200ms ease'
          }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: 'var(--p1-color)'
            }} />
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--p1-color)' }}>
                {gameState.player1.name}
              </span>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {gameState.player1.questionsAsked} Qs • {gameState.player1.guessesMade} Gs
              </div>
            </div>
          </div>

          <span style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--text-muted)' }}>VS</span>

          {/* Player 2 Chip */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            background: !isP1 ? 'var(--p2-bg)' : 'var(--bg-secondary)',
            border: !isP1 ? '2px solid var(--p2-color)' : '1px solid var(--border-subtle)',
            boxShadow: !isP1 ? '0 0 14px var(--p2-bg)' : 'none',
            transition: 'all 200ms ease'
          }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: 'var(--p2-color)'
            }} />
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--p2-color)' }}>
                {gameState.player2.name}
              </span>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {gameState.player2.questionsAsked} Qs • {gameState.player2.guessesMade} Gs
              </div>
            </div>
          </div>
        </div>

        {/* Turn & Level Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Level Tag */}
          <span className="badge" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            {gameState.level.name} ({gameState.level.rangeMin}–{gameState.level.rangeMax})
          </span>

          {/* Round Tag */}
          <span className="badge" style={{ background: playerBg, color: playerThemeColor, border: `1px solid ${playerThemeColor}` }}>
            Round {gameState.turnNumber}
          </span>

          {/* Timer Indicator */}
          {timerLeft !== null && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.8rem',
              borderRadius: 'var(--radius-full)',
              background: timerLeft <= 5 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.15)',
              border: timerLeft <= 5 ? '1px solid var(--accent-rose)' : '1px solid var(--accent-amber)',
              color: timerLeft <= 5 ? 'var(--accent-rose)' : 'var(--accent-amber)',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              fontSize: '0.9rem'
            }}>
              <Clock size={16} className={timerLeft <= 5 ? 'animate-bounce-slow' : ''} />
              <span>{formatTime(timerLeft)}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Arena Content */}
      {/* IF Answering Phase: Opponent answers the question */}
      {gameState.phase === 'answering' && gameState.pendingQuestion ? (
        <div className="glass-panel" style={{
          padding: '2rem',
          textAlign: 'center',
          borderTop: `4px solid ${opponentPlayer.id === 'player1' ? 'var(--p1-color)' : 'var(--p2-color)'}`
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.35rem 0.85rem',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-secondary)',
            fontSize: '0.8rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: '1rem'
          }}>
            <HelpCircle size={15} /> Incoming Question
          </div>

          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <span style={{ color: playerThemeColor, fontWeight: 800 }}>{activePlayer.name}</span> asks:
          </h3>

          <div style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            lineHeight: 1.3,
            color: 'var(--text-primary)',
            maxWidth: '650px',
            margin: '0 auto 1.5rem',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)'
          }}>
            "{gameState.pendingQuestion.questionText}"
          </div>

          {/* Engine Auto-Verify Assistance */}
          {gameState.pendingQuestion.questionType !== 'custom' && opponentPlayer.secretNumber !== null && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.45rem 1rem',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px dashed var(--accent-primary)',
              color: 'var(--accent-primary)',
              fontSize: '0.85rem',
              fontWeight: 700,
              marginBottom: '1.75rem'
            }}>
              <Sparkles size={16} />
              <span>
                Engine Verified Answer: <strong>{
                  evaluateQuestion(
                    opponentPlayer.secretNumber,
                    gameState.pendingQuestion.questionType,
                    gameState.pendingQuestion.paramA,
                    gameState.pendingQuestion.paramB
                  ) ? 'YES' : 'NO'
                }</strong> (Secret: {opponentPlayer.secretNumber})
              </span>
            </div>
          )}

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1.25rem',
            maxWidth: '400px',
            margin: '0 auto'
          }}>
            <button
              onClick={() => {
                playYesSound();
                onAnswerQuestion('yes');
              }}
              className="btn btn-emerald btn-lg"
              style={{ flex: 1, gap: '0.65rem', fontSize: '1.2rem', padding: '1rem' }}
            >
              <Check size={24} /> YES
            </button>

            <button
              onClick={() => {
                playNoSound();
                onAnswerQuestion('no');
              }}
              className="btn btn-rose btn-lg"
              style={{ flex: 1, gap: '0.65rem', fontSize: '1.2rem', padding: '1rem' }}
            >
              <X size={24} /> NO
            </button>
          </div>
        </div>
      ) : (
        /* Regular Playing Turn: Choose Ask Question or Make Guess */
        <div className="game-arena-grid">
          {/* Left Column: Turn Action Panel */}
          <div id="game-turn-action-panel" className="glass-panel game-turn-panel">
            {/* Action Tabs & Mobile Scratchpad Jump */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
              marginBottom: '1rem',
              flexWrap: 'wrap'
            }}>
              <div className="action-tabs-container" style={{ flex: 1, marginBottom: 0 }}>
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setActionTab('question');
                  }}
                  className="btn btn-sm action-tab-btn"
                  style={{
                    background: actionTab === 'question' ? 'var(--bg-surface-elevated)' : 'transparent',
                    color: actionTab === 'question' ? playerThemeColor : 'var(--text-secondary)',
                    boxShadow: actionTab === 'question' ? 'var(--shadow-sm)' : 'none',
                    borderColor: actionTab === 'question' ? 'var(--border-subtle)' : 'transparent'
                  }}
                >
                  <HelpCircle size={15} style={{ flexShrink: 0 }} />
                  <span>Ask Question {questionsLeft !== null ? `(${questionsLeft})` : ''}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setActionTab('guess');
                  }}
                  className="btn btn-sm action-tab-btn"
                  style={{
                    background: actionTab === 'guess' ? 'var(--bg-surface-elevated)' : 'transparent',
                    color: actionTab === 'guess' ? 'var(--accent-rose)' : 'var(--text-secondary)',
                    boxShadow: actionTab === 'guess' ? 'var(--shadow-sm)' : 'none',
                    borderColor: actionTab === 'guess' ? 'var(--border-subtle)' : 'transparent'
                  }}
                >
                  <Target size={15} style={{ flexShrink: 0 }} />
                  <span>Make Exact Guess {guessesLeft !== null ? `(${guessesLeft})` : ''}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('tactical-scratchpad-panel');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="mobile-jump-scratchpad"
                title="Jump to Tactical Scratchpad"
              >
                <span>Scratchpad ({gameState.level.rangeMax - gameState.level.rangeMin + 1 - activePlayer.eliminatedNumbers.length})</span>
                <ChevronDown size={14} />
              </button>
            </div>

            {/* TAB A: ASK QUESTION */}
            {actionTab === 'question' ? (
              <form onSubmit={handleSendQuestion} className="question-form">
                <div>
                  <label className="section-label">
                    Select Question Type
                  </label>
                  <div className="question-type-grid">
                    {[
                      { id: 'greater', label: '> Greater than' },
                      { id: 'less', label: '< Less than' },
                      { id: 'equal', label: '= Equal to' },
                      { id: 'even', label: 'Even / Odd' },
                      { id: 'divisible', label: 'Divisible by' },
                      { id: 'prime', label: 'Is Prime' },
                      { id: 'digit', label: 'Contains digit' },
                      { id: 'between', label: 'Between [A–B]' },
                      { id: 'custom', label: 'Custom text' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          playTapSound();
                          setQuestionType(item.id as QuestionType);
                        }}
                        className="btn btn-sm question-type-btn"
                        style={{
                          background: questionType === item.id ? playerBg : 'var(--bg-secondary)',
                          borderColor: questionType === item.id ? playerThemeColor : 'var(--border-subtle)',
                          color: questionType === item.id ? playerThemeColor : 'var(--text-secondary)',
                          fontWeight: questionType === item.id ? 800 : 600
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Parameters for selected type */}
                {(questionType === 'greater' || questionType === 'less' || questionType === 'equal') && (
                  <div>
                    <div className="label-with-badge">
                      <label className="section-label" style={{ marginBottom: 0 }}>
                        Comparison Value
                      </label>
                      <span className="range-badge">
                        Range: {gameState.level.rangeMin}–{gameState.level.rangeMax}
                      </span>
                    </div>
                    <input
                      type="number"
                      className="input-field input-number"
                      value={paramA}
                      min={gameState.level.rangeMin}
                      max={gameState.level.rangeMax}
                      onChange={(e) => setParamA(parseInt(e.target.value) || gameState.level.rangeMin)}
                      required
                    />
                  </div>
                )}

                {questionType === 'even' && (
                  <div className="info-box">
                    Asks if the opponent's number is divisible by 2 (even) or odd.
                  </div>
                )}

                {questionType === 'divisible' && (
                  <div>
                    <div className="label-with-badge">
                      <label className="section-label" style={{ marginBottom: 0 }}>
                        Divisor
                      </label>
                      <span className="range-badge">
                        2 to {gameState.level.rangeMax}
                      </span>
                    </div>
                    <input
                      type="number"
                      className="input-field input-number"
                      value={paramA}
                      min={2}
                      max={gameState.level.rangeMax}
                      onChange={(e) => setParamA(parseInt(e.target.value) || 2)}
                      required
                    />
                  </div>
                )}

                {questionType === 'prime' && (
                  <div className="info-box">
                    Asks if the opponent's secret number is a prime number (e.g. 2, 3, 5, 7, 11...).
                  </div>
                )}

                {questionType === 'digit' && (
                  <div>
                    <div className="label-with-badge">
                      <label className="section-label" style={{ marginBottom: 0 }}>
                        Digit to Check
                      </label>
                      <span className="range-badge">
                        0 to 9
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            playTapSound();
                            setParamA(d);
                          }}
                          className="btn btn-sm"
                          style={{
                            width: '32px',
                            height: '32px',
                            padding: 0,
                            background: paramA === d ? playerBg : 'var(--bg-secondary)',
                            borderColor: paramA === d ? playerThemeColor : 'var(--border-subtle)',
                            color: paramA === d ? playerThemeColor : 'var(--text-secondary)',
                            fontWeight: paramA === d ? 800 : 600
                          }}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {questionType === 'between' && (
                  <div>
                    <div className="label-with-badge">
                      <label className="section-label" style={{ marginBottom: 0 }}>
                        Between Range [A to B]
                      </label>
                      <span className="range-badge">
                        Range: {gameState.level.rangeMin}–{gameState.level.rangeMax}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>From</label>
                        <input
                          type="number"
                          className="input-field input-number"
                          value={paramA}
                          min={gameState.level.rangeMin}
                          max={paramB}
                          onChange={(e) => setParamA(parseInt(e.target.value) || gameState.level.rangeMin)}
                        />
                      </div>
                      <span style={{ fontWeight: 800, marginTop: '1.2rem' }}>to</span>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>To</label>
                        <input
                          type="number"
                          className="input-field input-number"
                          value={paramB}
                          min={paramA}
                          max={gameState.level.rangeMax}
                          onChange={(e) => setParamB(parseInt(e.target.value) || gameState.level.rangeMax)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {questionType === 'custom' && (
                  <div>
                    <label className="section-label">
                      Custom Yes/No Question
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Is your number a multiple of 3 or 5?"
                      value={customQuestionText}
                      maxLength={100}
                      onChange={(e) => setCustomQuestionText(e.target.value)}
                      required
                    />
                  </div>
                )}

                {/* Preview Box */}
                <div className="question-preview-box">
                  <div className="preview-label">
                    Question Preview
                  </div>
                  <div className="preview-text">
                    "{getConstructedQuestionText()}"
                  </div>
                </div>

                <button
                  type="submit"
                  className={isP1 ? 'btn btn-p1 btn-lg' : 'btn btn-p2 btn-lg'}
                  style={{ width: '100%', gap: '0.5rem', marginTop: '0.25rem', minHeight: '48px' }}
                >
                  <Send size={18} /> Ask Opponent
                </button>
              </form>
            ) : (
              /* TAB B: MAKE EXACT GUESS */
              <form onSubmit={handleMakeGuessSubmit} className="guess-form">
                <div style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px dashed var(--accent-rose)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--accent-rose)', fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.3rem' }}>
                    <Flame size={18} /> High-Stakes Deduction
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    If you guess correctly, you <strong>WIN IMMEDIATELY</strong>!
                    If you are wrong, your turn ends and the opponent gets a chance.
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                    What is {opponentPlayer.name}'s secret number?
                  </label>
                  <input
                    type="number"
                    className="input-field input-number"
                    style={{ fontSize: '2.5rem', padding: '1rem' }}
                    value={guessInput}
                    min={gameState.level.rangeMin}
                    max={gameState.level.rangeMax}
                    placeholder="?"
                    onChange={(e) => {
                      setGuessInput(e.target.value);
                      if (guessError) setGuessError(null);
                    }}
                    autoFocus
                    required
                  />
                  {guessError && (
                    <p style={{ color: 'var(--accent-rose)', fontSize: '0.8rem', marginTop: '0.35rem', fontWeight: 600 }}>
                      {guessError}
                    </p>
                  )}
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                  <button
                    type="submit"
                    className="btn btn-rose btn-lg"
                    style={{ width: '100%', gap: '0.5rem', minHeight: '48px' }}
                  >
                    <Target size={20} /> Submit Exact Guess
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right Column: Tactical Scratchpad / Number Matrix */}
          <div id="tactical-scratchpad-panel" className="glass-panel game-scratchpad-panel">
            <div className="scratchpad-header">
              <div>
                <h3 className="scratchpad-title">Tactical Scratchpad</h3>
                <span className="scratchpad-subtitle">
                  {activePlayer.name}'s private deduction notes
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handleRunAutoEliminate}
                  className="btn btn-sm btn-secondary"
                  title="Auto-eliminate numbers based on answers received"
                  style={{ gap: '0.35rem', fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                >
                  <Sparkles size={13} color="var(--accent-primary)" /> Auto-Deduce
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    onResetScratchpad();
                  }}
                  className="btn-icon"
                  style={{ width: '32px', height: '32px' }}
                  title="Reset scratchpad"
                >
                  <RotateCcw size={14} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('game-turn-action-panel');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="mobile-jump-scratchpad"
                  style={{ padding: '0.25rem 0.5rem' }}
                  title="Scroll back up to Turn Actions"
                >
                  <ChevronUp size={14} />
                  <span>Top</span>
                </button>
              </div>
            </div>

            {/* Scratchpad Grid */}
            <div className="scratchpad-grid" style={{ flex: 1, minHeight: '200px' }}>
              {Array.from({ length: gameState.level.rangeMax - gameState.level.rangeMin + 1 }, (_, i) => {
                const num = gameState.level.rangeMin + i;
                const isEliminated = activePlayer.eliminatedNumbers.includes(num);
                const isPinned = activePlayer.pinnedCandidates.includes(num);

                let className = 'scratchpad-chip';
                if (isEliminated) className += ' eliminated';
                else if (isPinned) className += ' candidate';

                return (
                  <div
                    key={num}
                    onClick={() => {
                      playTapSound();
                      onToggleScratchpadNumber(num);
                    }}
                    className={className}
                    title={`Number ${num}: Tap to toggle state`}
                  >
                    {num}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="scratchpad-legend">
              <span>Tap: Strike ➔ Star ➔ Clear</span>
              <span style={{ fontWeight: 700 }}>
                {gameState.level.rangeMax - gameState.level.rangeMin + 1 - activePlayer.eliminatedNumbers.length} candidates left
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. History Accordion Log */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.85rem'
        }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => {
                playTapSound();
                setHistoryTab('questions');
              }}
              className="btn btn-sm"
              style={{
                background: historyTab === 'questions' ? 'var(--bg-secondary)' : 'transparent',
                borderColor: historyTab === 'questions' ? 'var(--border-strong)' : 'transparent',
                color: historyTab === 'questions' ? 'var(--text-primary)' : 'var(--text-muted)'
              }}
            >
              <HelpCircle size={14} /> Questions ({gameState.questions.length})
            </button>

            <button
              onClick={() => {
                playTapSound();
                setHistoryTab('guesses');
              }}
              className="btn btn-sm"
              style={{
                background: historyTab === 'guesses' ? 'var(--bg-secondary)' : 'transparent',
                borderColor: historyTab === 'guesses' ? 'var(--border-strong)' : 'transparent',
                color: historyTab === 'guesses' ? 'var(--text-primary)' : 'var(--text-muted)'
              }}
            >
              <Target size={14} /> Guesses ({gameState.guesses.length})
            </button>
          </div>
        </div>

        {/* History List */}
        <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {historyTab === 'questions' ? (
            gameState.questions.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No questions asked yet. Ask a question to begin deducing!
              </div>
            ) : (
              [...gameState.questions].reverse().map((q) => {
                const asker = q.askerId === 'player1' ? gameState.player1 : gameState.player2;
                return (
                  <div
                    key={q.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: q.askerId === 'player1' ? 'var(--p1-color)' : 'var(--p2-color)',
                        marginRight: '0.4rem'
                      }}>
                        {asker.name}:
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                        {q.questionText}
                      </span>
                    </div>

                    <span className={q.verdict === 'yes' ? 'badge badge-emerald' : q.verdict === 'no' ? 'badge badge-rose' : 'badge badge-amber'}>
                      {q.verdict.toUpperCase()}
                    </span>
                  </div>
                );
              })
            )
          ) : (
            gameState.guesses.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No exact guesses made yet.
              </div>
            ) : (
              [...gameState.guesses].reverse().map((g) => {
                const guesser = g.guesserId === 'player1' ? gameState.player1 : gameState.player2;
                return (
                  <div
                    key={g.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: g.guesserId === 'player1' ? 'var(--p1-color)' : 'var(--p2-color)',
                        marginRight: '0.4rem'
                      }}>
                        {guesser.name} guessed:
                      </span>
                      <span style={{ fontSize: '1rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                        {g.guessNumber}
                      </span>
                    </div>

                    <span className={g.isCorrect ? 'badge badge-emerald' : 'badge badge-rose'}>
                      {g.isCorrect ? 'CORRECT! (WIN)' : 'INCORRECT'}
                    </span>
                  </div>
                );
              })
            )
          )}
        </div>
      </div>
    </div>
  );
};
