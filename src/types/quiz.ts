export interface Question {
	readonly id: string;
	readonly question: string;
	readonly options: readonly [string, string, string, string];
	readonly answer: 0 | 1 | 2 | 3;
	readonly reference?: string;
}

export interface Chapter {
	readonly chapter: string;
	readonly title: string;
	readonly questions: readonly Question[];
}

export interface AnswerRecord {
	readonly questionId: string;
	readonly selectedAnswer: number;
	readonly correctAnswer: number;
	readonly correct: boolean;
}

export interface QuizSession {
	readonly userId: string;
	readonly chapterFilter: string | null;
	readonly timed: boolean;
	readonly questions: readonly Question[];
	currentIndex: number;
	correctCount: number;
	readonly answers: AnswerRecord[];
	readonly startedAt: number;
}

export interface ScoreHistoryEntry {
	readonly date: string;
	readonly chapter: string;
	readonly questionCount: number;
	readonly correctCount: number;
}

export interface UserScore {
	userId: string;
	username: string;
	totalQuizzes: number;
	totalQuestions: number;
	totalCorrect: number;
	history: ScoreHistoryEntry[];
}

export interface ScoreStore {
	[userId: string]: UserScore;
}
