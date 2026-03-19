import { readFile, writeFile, rename, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname } from 'path';
import { container } from '@sapphire/framework';
import { SCORES_FILE } from './config';
import type { ScoreStore, UserScore, ScoreHistoryEntry } from '../types/quiz';

let cache: ScoreStore | null = null;

async function load(): Promise<ScoreStore> {
	if (cache) return cache;

	if (!existsSync(SCORES_FILE)) {
		cache = {};
		return cache;
	}

	try {
		const raw = await readFile(SCORES_FILE, 'utf-8');
		cache = JSON.parse(raw) as ScoreStore;
	} catch (error) {
		container.logger.error('Failed to load scores file, starting fresh:', error);
		cache = {};
	}

	return cache;
}

async function flush(): Promise<void> {
	if (!cache) return;

	const dir = dirname(SCORES_FILE);
	if (!existsSync(dir)) {
		await mkdir(dir, { recursive: true });
	}

	const tmp = `${SCORES_FILE}.tmp`;
	await writeFile(tmp, JSON.stringify(cache, null, '\t'), 'utf-8');
	await rename(tmp, SCORES_FILE);
}

export async function getScore(userId: string): Promise<UserScore | null> {
	const store = await load();
	return store[userId] ?? null;
}

export async function saveResult(
	userId: string,
	username: string,
	result: { chapter: string; questionCount: number; correctCount: number }
): Promise<void> {
	const store = await load();

	const entry: ScoreHistoryEntry = {
		date: new Date().toISOString(),
		chapter: result.chapter,
		questionCount: result.questionCount,
		correctCount: result.correctCount
	};

	const existing = store[userId];
	if (existing) {
		existing.username = username;
		existing.totalQuizzes += 1;
		existing.totalQuestions += result.questionCount;
		existing.totalCorrect += result.correctCount;
		existing.history.push(entry);
	} else {
		store[userId] = {
			userId,
			username,
			totalQuizzes: 1,
			totalQuestions: result.questionCount,
			totalCorrect: result.correctCount,
			history: [entry]
		};
	}

	await flush();
}

export async function clearScores(): Promise<void> {
	cache = {};
	await flush();
}

export async function removeUserScore(userId: string): Promise<boolean> {
	const store = await load();
	if (!(userId in store)) return false;
	delete store[userId];
	await flush();
	return true;
}

export async function getLeaderboard(limit: number): Promise<UserScore[]> {
	const store = await load();
	return Object.values(store)
		.filter((u) => u.totalQuestions > 0)
		.sort((a, b) => {
			const accA = a.totalCorrect / a.totalQuestions;
			const accB = b.totalCorrect / b.totalQuestions;
			if (accB !== accA) return accB - accA;
			return b.totalQuestions - a.totalQuestions;
		})
		.slice(0, limit);
}
