import { QuestionType, QuestionVerdict } from '../types/game';

// Prime number checker
export const isPrime = (num: number): boolean => {
  if (num <= 1) return false;
  if (num <= 3) return true;
  if (num % 2 === 0 || num % 3 === 0) return false;
  for (let i = 5; i * i <= num; i += 6) {
    if (num % i === 0 || num % (i + 2) === 0) return false;
  }
  return true;
};

// Evaluate a structured question against a target secret number
export const evaluateQuestion = (
  secretNumber: number,
  type: QuestionType,
  paramA?: number,
  paramB?: number
): boolean => {
  switch (type) {
    case 'greater':
      return paramA !== undefined ? secretNumber > paramA : false;
    case 'less':
      return paramA !== undefined ? secretNumber < paramA : false;
    case 'equal':
      return paramA !== undefined ? secretNumber === paramA : false;
    case 'even':
      return secretNumber % 2 === 0;
    case 'odd':
      return secretNumber % 2 !== 0;
    case 'divisible':
      return paramA && paramA > 0 ? secretNumber % paramA === 0 : false;
    case 'prime':
      return isPrime(secretNumber);
    case 'digit':
      return paramA !== undefined ? secretNumber.toString().includes(paramA.toString()) : false;
    case 'between':
      if (paramA !== undefined && paramB !== undefined) {
        const min = Math.min(paramA, paramB);
        const max = Math.max(paramA, paramB);
        return secretNumber >= min && secretNumber <= max;
      }
      return false;
    case 'custom':
    default:
      return false;
  }
};

// Deduce which numbers in a range can be eliminated given a question & verdict
export const getNumbersToEliminate = (
  rangeMin: number,
  rangeMax: number,
  type: QuestionType,
  verdict: QuestionVerdict,
  paramA?: number,
  paramB?: number
): number[] => {
  if (verdict === 'pending' || type === 'custom') return [];
  const expectedBool = verdict === 'yes';

  const eliminated: number[] = [];
  for (let n = rangeMin; n <= rangeMax; n++) {
    const result = evaluateQuestion(n, type, paramA, paramB);
    // If the candidate number gives a different answer than the true verdict, it is eliminated
    if (result !== expectedBool) {
      eliminated.push(n);
    }
  }
  return eliminated;
};

// Generate human-friendly 6-character room code (e.g., G-7492 or K9M2Q8)
export const generateRoomCode = (): string => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Exclude 0, 1, I, O to avoid visual confusion
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Format seconds into MM:SS
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};
