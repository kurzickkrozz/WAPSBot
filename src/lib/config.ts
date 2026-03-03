import { join } from 'path';

// Bot versioning (overridable via environment variables)
export const BOT_VERSION = process.env.BOT_VERSION ?? '1.1.2';
export const AFH1_VERSION = process.env.AFH1_VERSION ?? '15 February 2025';
export const TEST_CYCLE = process.env.TEST_CYCLE ?? '26E5 / 26E6';
export const BOT_DEVELOPER = process.env.BOT_DEVELOPER ?? 'TunnelRat';

// Embed branding
export const EMBED_COLOR = 0x005ea7; // USAF blue
export const EMBED_COLOR_CORRECT = 0x2ecc71; // Green
export const EMBED_COLOR_INCORRECT = 0xe74c3c; // Red
export const EMBED_COLOR_RESULTS = 0xf1c40f; // Gold

// Quiz defaults
export const DEFAULT_QUESTION_COUNT = 10;
export const MIN_QUESTION_COUNT = 1;
export const QUESTION_TIMEOUT_MS = 60_000; // 60 seconds per question
export const NEXT_QUESTION_DELAY_MS = 2_000; // 2 seconds between questions

// Leaderboard
export const LEADERBOARD_MIN_QUESTIONS = 10;
export const LEADERBOARD_SIZE = 10;

// Paths
export const DATA_DIR = join(process.cwd(), 'data');
export const QUESTIONS_DIR = join(DATA_DIR, 'questions');
export const SCORES_FILE = join(DATA_DIR, 'scores.json');

// Answer labels
export const ANSWER_LABELS = ['A', 'B', 'C', 'D'] as const;
export const ANSWER_EMOJIS = ['🇦', '🇧', '🇨', '🇩'] as const;
