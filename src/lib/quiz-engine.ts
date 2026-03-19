import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { container } from '@sapphire/framework';
import { QUESTIONS_DIR } from './config';
import type { Chapter, Question, QuizSession, AnswerRecord } from '../types/quiz';

// In-memory chapter cache — loaded once at startup
const chapters: Map<string, Chapter> = new Map();

// Active quiz sessions keyed by userId
const sessions: Map<string, QuizSession> = new Map();

/**
 * Fisher-Yates (Knuth) shuffle — uniform, in-place, O(n).
 * Returns a new array; does not mutate the source.
 */
function shuffle<T>(source: readonly T[]): T[] {
	const arr = [...source];
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

function isValidQuestion(q: unknown): q is Question {
	if (typeof q !== 'object' || q === null) return false;
	const obj = q as Record<string, unknown>;
	return (
		typeof obj['id'] === 'string' &&
		typeof obj['question'] === 'string' &&
		Array.isArray(obj['options']) &&
		obj['options'].length === 4 &&
		(obj['options'] as unknown[]).every((o) => typeof o === 'string') &&
		typeof obj['answer'] === 'number' &&
		obj['answer'] >= 0 &&
		obj['answer'] <= 3
	);
}

function isValidChapter(data: unknown): data is { chapter: string; title: string; questions: unknown[] } {
	if (typeof data !== 'object' || data === null) return false;
	const obj = data as Record<string, unknown>;
	return typeof obj['chapter'] === 'string' && typeof obj['title'] === 'string' && Array.isArray(obj['questions']);
}

/**
 * Scans data/questions/ directory, parses and validates each JSON file,
 * caches valid chapters in memory. Skips files starting with underscore.
 */
export async function loadChapters(): Promise<void> {
	chapters.clear();

	let files: string[];
	try {
		files = await readdir(QUESTIONS_DIR);
	} catch {
		container.logger.warn(`Questions directory not found: ${QUESTIONS_DIR}`);
		return;
	}

	const jsonFiles = files.filter((f) => f.endsWith('.json') && !f.startsWith('_'));

	for (const file of jsonFiles) {
		try {
			const raw = await readFile(join(QUESTIONS_DIR, file), 'utf-8');
			const data: unknown = JSON.parse(raw);

			if (!isValidChapter(data)) {
				container.logger.warn(`Skipping ${file}: invalid chapter structure`);
				continue;
			}

			const validQuestions = data.questions.filter(isValidQuestion);
			if (validQuestions.length === 0) {
				container.logger.warn(`Skipping ${file}: no valid questions`);
				continue;
			}

			const chapter: Chapter = {
				chapter: data.chapter,
				title: data.title,
				questions: validQuestions
			};

			chapters.set(data.chapter, chapter);
			container.logger.info(`Loaded ${validQuestions.length} questions from "${data.chapter}: ${data.title}"`);
		} catch (error) {
			container.logger.error(`Failed to load ${file}:`, error);
		}
	}
}

export function getChapterList(): { chapter: string; title: string; questionCount: number }[] {
	return [...chapters.values()].map((c) => ({
		chapter: c.chapter,
		title: c.title,
		questionCount: c.questions.length
	}));
}

export function getChapterNames(): string[] {
	return [...chapters.keys()];
}

export function getTotalQuestionCount(): number {
	let total = 0;
	for (const ch of chapters.values()) total += ch.questions.length;
	return total;
}

/**
 * Builds a shuffled question set for a quiz session.
 * Returns null if the chapter doesn't exist or has no questions.
 */
export function buildQuiz(chapterFilter: string | null, count: number): Question[] | null {
	let pool: Question[];

	if (chapterFilter) {
		const chapter = chapters.get(chapterFilter);
		if (!chapter) return null;
		pool = [...chapter.questions];
	} else {
		pool = [];
		for (const ch of chapters.values()) {
			pool.push(...ch.questions);
		}
	}

	if (pool.length === 0) return null;

	const shuffled = shuffle(pool);
	return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Builds a weighted WAPS practice test.
 * High-yield chapters get 3x weight, update-driven chapters get 2x, standard get 1x.
 * Questions are proportionally drawn from each chapter then shuffled together.
 */
export function buildWapsTest(count: number): Question[] | null {
	const HIGH_YIELD: ReadonlySet<string> = new Set([
		'Chapter 1', 'Chapter 9', 'Chapter 10', 'Chapter 12', 'Chapter 22'
	]);
	const UPDATE_DRIVEN: ReadonlySet<string> = new Set([
		'Chapter 4', 'Chapter 11', 'Chapter 17', 'Chapter 19'
	]);
	const WAPS_CHAPTERS: ReadonlySet<string> = new Set([
		'Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Chapter 6',
		'Chapter 7', 'Chapter 8', 'Chapter 9', 'Chapter 10', 'Chapter 11',
		'Chapter 12', 'Chapter 15', 'Chapter 17', 'Chapter 18', 'Chapter 19',
		'Chapter 21', 'Chapter 22', 'Chapter 25'
	]);

	// Collect eligible chapters with their weights
	const weighted: { chapter: Chapter; weight: number }[] = [];
	let totalWeight = 0;

	for (const ch of chapters.values()) {
		if (!WAPS_CHAPTERS.has(ch.chapter)) continue;
		const weight = HIGH_YIELD.has(ch.chapter) ? 3 : UPDATE_DRIVEN.has(ch.chapter) ? 2 : 1;
		weighted.push({ chapter: ch, weight });
		totalWeight += weight;
	}

	if (weighted.length === 0 || totalWeight === 0) return null;

	// Proportionally allocate questions per chapter
	const pool: Question[] = [];
	let remaining = count;

	for (let i = 0; i < weighted.length; i++) {
		const { chapter, weight } = weighted[i];
		const allocation = i === weighted.length - 1
			? remaining
			: Math.max(1, Math.round((weight / totalWeight) * count));

		const chunkSize = Math.min(allocation, chapter.questions.length, remaining);
		const shuffled = shuffle(chapter.questions);
		pool.push(...shuffled.slice(0, chunkSize));
		remaining -= chunkSize;

		if (remaining <= 0) break;
	}

	return shuffle(pool);
}

export function getSession(userId: string): QuizSession | undefined {
	return sessions.get(userId);
}

export function hasSession(userId: string): boolean {
	return sessions.has(userId);
}

export function startSession(userId: string, chapterFilter: string | null, questions: Question[], timed: boolean): QuizSession {
	const session: QuizSession = {
		userId,
		chapterFilter,
		timed,
		questions,
		currentIndex: 0,
		correctCount: 0,
		answers: [],
		startedAt: Date.now()
	};
	sessions.set(userId, session);
	return session;
}

export function getCurrentQuestion(session: QuizSession): Question | null {
	if (session.currentIndex >= session.questions.length) return null;
	return session.questions[session.currentIndex];
}

export function answerQuestion(session: QuizSession, selectedAnswer: number): AnswerRecord {
	const question = session.questions[session.currentIndex];
	const correct = selectedAnswer === question.answer;

	const record: AnswerRecord = {
		questionId: question.id,
		selectedAnswer,
		correctAnswer: question.answer,
		correct
	};

	if (correct) session.correctCount++;
	(session.answers as AnswerRecord[]).push(record);
	session.currentIndex++;

	return record;
}

export function cancelSession(userId: string): boolean {
	return sessions.delete(userId);
}

export function removeSession(userId: string): void {
	sessions.delete(userId);
}
