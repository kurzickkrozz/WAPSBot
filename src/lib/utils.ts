import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { ANSWER_EMOJIS, ANSWER_LABELS, EMBED_COLOR, EMBED_COLOR_CORRECT, EMBED_COLOR_INCORRECT, EMBED_COLOR_RESULTS } from './config';

import type { AnswerRecord, Question, QuizSession } from '../types/quiz';

export function buildQuestionEmbed(question: Question, index: number, total: number, timed: boolean): EmbedBuilder {
	const optionLines = question.options.map((opt, i) => `**${ANSWER_LABELS[i]}.** ${opt}`).join('\n');
	const footer = timed ? 'Select your answer below. You have 60 seconds.' : 'Select your answer below.';

	return new EmbedBuilder()
		.setColor(EMBED_COLOR)
		.setTitle(`Question ${index + 1} of ${total}`)
		.setDescription(`${question.question}\n\n${optionLines}`)
		.setFooter({ text: footer });
}

export function buildAnswerButtons(questionIndex: number): ActionRowBuilder<ButtonBuilder> {
	return new ActionRowBuilder<ButtonBuilder>().addComponents(
		...ANSWER_LABELS.map((label, i) =>
			new ButtonBuilder()
				.setCustomId(`quiz_answer_${questionIndex}_${i}`)
				.setLabel(label)
				.setEmoji(ANSWER_EMOJIS[i])
				.setStyle(ButtonStyle.Secondary)
		)
	);
}

export function buildCorrectEmbed(question: Question, selected: number): EmbedBuilder {
	const embed = new EmbedBuilder()
		.setColor(EMBED_COLOR_CORRECT)
		.setTitle('Correct!')
		.setDescription(`**${ANSWER_LABELS[selected]}.** ${question.options[selected]}`);

	if (question.reference) {
		embed.setFooter({ text: `Ref: ${question.reference}` });
	}

	return embed;
}

export function buildIncorrectEmbed(question: Question, selected: number): EmbedBuilder {
	const correct = question.answer;
	const embed = new EmbedBuilder()
		.setColor(EMBED_COLOR_INCORRECT)
		.setTitle('Incorrect')
		.setDescription(
			`You chose: **${ANSWER_LABELS[selected]}.** ${question.options[selected]}\nCorrect answer: **${ANSWER_LABELS[correct]}.** ${question.options[correct]}`
		);

	if (question.reference) {
		embed.setFooter({ text: `Ref: ${question.reference}` });
	}

	return embed;
}

export function buildResultsEmbed(session: QuizSession): EmbedBuilder {
	const { questions, answers, correctCount } = session;
	const total = questions.length;
	const pct = Math.round((correctCount / total) * 100);
	const chapterLabel = session.chapterFilter ?? 'All Chapters';

	let grade: string;
	if (pct >= 90) grade = 'Outstanding!';
	else if (pct >= 80) grade = 'Excellent!';
	else if (pct >= 70) grade = 'Satisfactory';
	else if (pct >= 60) grade = 'Needs Improvement';
	else grade = 'Keep Studying';

	const breakdown = answers
		.map((a: AnswerRecord, i: number) => {
			const q = questions[i];
			const icon = a.correct ? '✅' : '❌';
			const ref = q.reference ? ` _(${q.reference})_` : '';
			return `${icon} **Q${i + 1}:** ${a.correct ? 'Correct' : `Chose ${ANSWER_LABELS[a.selectedAnswer]}, Answer: ${ANSWER_LABELS[a.correctAnswer]}`}${ref}`;
		})
		.join('\n');

	return new EmbedBuilder()
		.setColor(EMBED_COLOR_RESULTS)
		.setTitle(`Quiz Complete — ${grade}`)
		.setDescription(`**Score:** ${correctCount}/${total} (${pct}%)\n**Chapter:** ${chapterLabel}\n\n${breakdown}`)
		.setFooter({ text: 'Run /quiz start to take another quiz!' });
}

export function buildTimeoutEmbed(question: Question): EmbedBuilder {
	const correct = question.answer;
	const embed = new EmbedBuilder()
		.setColor(EMBED_COLOR_INCORRECT)
		.setTitle('Time\'s Up!')
		.setDescription(`Correct answer: **${ANSWER_LABELS[correct]}.** ${question.options[correct]}`);

	if (question.reference) {
		embed.setFooter({ text: `Ref: ${question.reference}` });
	}

	return embed;
}
