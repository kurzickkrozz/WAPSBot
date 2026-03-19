import { ApplyOptions } from '@sapphire/decorators';
import { Command, container } from '@sapphire/framework';
import { ComponentType, type DMChannel, MessageFlags } from 'discord.js';
import { NEXT_QUESTION_DELAY_MS, QUESTION_TIMEOUT_MS } from '../lib/config';
import {
	answerQuestion,
	buildWapsTest,
	getCurrentQuestion,
	hasSession,
	removeSession,
	startSession
} from '../lib/quiz-engine';
import { saveResult } from '../lib/store';
import type { QuizSession } from '../types/quiz';
import {
	buildAnswerButtons,
	buildCorrectEmbed,
	buildIncorrectEmbed,
	buildQuestionEmbed,
	buildResultsEmbed,
	buildTimeoutEmbed
} from '../lib/utils';

@ApplyOptions<Command.Options>({
	description: 'Start a weighted WAPS practice test'
})
export class WapsTestCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName('wapstest')
				.setDescription('Start a weighted WAPS practice test')
				.addIntegerOption((opt) =>
					opt
						.setName('count')
						.setDescription('Number of questions: 50 or 100 (default: 50)')
						.setRequired(false)
						.addChoices(
							{ name: '50 questions', value: 50 },
							{ name: '100 questions', value: 100 }
						)
				)
				.addBooleanOption((opt) =>
					opt
						.setName('timed')
						.setDescription('Enable 60-second timer per question (default: off)')
						.setRequired(false)
				)
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction): Promise<void> {
		const userId = interaction.user.id;

		if (hasSession(userId)) {
			await interaction.reply({
				content: 'You already have an active quiz session. Use `/quiz cancel` to end it first.',
				flags: MessageFlags.Ephemeral
			});
			return;
		}

		const count = interaction.options.getInteger('count') ?? 50;
		const timed = interaction.options.getBoolean('timed') ?? false;

		const questions = buildWapsTest(count);
		if (!questions || questions.length === 0) {
			await interaction.reply({
				content: 'Not enough WAPS test questions loaded. Ask an admin to check the question banks.',
				flags: MessageFlags.Ephemeral
			});
			return;
		}

		const session = startSession(userId, 'WAPS Test', questions, timed);
		const modeLabel = timed ? ' (timed)' : '';

		await interaction.reply({
			content: `WAPS Practice Test started — ${questions.length} questions${modeLabel}. Check your DMs!`,
			flags: MessageFlags.Ephemeral
		});

		try {
			const dmChannel = await interaction.user.createDM();
			await this.sendQuestion(dmChannel, session);
		} catch {
			removeSession(userId);
			await interaction.followUp({
				content: 'I couldn\'t send you a DM. Please make sure your DMs are open and try again.',
				flags: MessageFlags.Ephemeral
			});
		}
	}

	private async sendQuestion(dmChannel: DMChannel, session: QuizSession): Promise<void> {
		const question = getCurrentQuestion(session);
		if (!question) return;

		const embed = buildQuestionEmbed(question, session.currentIndex, session.questions.length, session.timed);
		const row = buildAnswerButtons(session.currentIndex);

		const message = await dmChannel.send({ embeds: [embed], components: [row] });

		const collectorOptions = {
			componentType: ComponentType.Button as const,
			filter: (i: { user: { id: string }; customId: string }) =>
				i.user.id === session.userId && i.customId.startsWith(`quiz_answer_${session.currentIndex}_`),
			...(session.timed ? { time: QUESTION_TIMEOUT_MS } : {})
		};

		try {
			const collected = await message.awaitMessageComponent(collectorOptions);

			const selectedAnswer = parseInt(collected.customId.split('_').pop()!, 10);
			const record = answerQuestion(session, selectedAnswer);

			const feedbackEmbed = record.correct
				? buildCorrectEmbed(question, selectedAnswer)
				: buildIncorrectEmbed(question, selectedAnswer);

			await collected.update({ embeds: [feedbackEmbed], components: [] });

			if (session.currentIndex < session.questions.length) {
				await this.delay(NEXT_QUESTION_DELAY_MS);
				await this.sendQuestion(dmChannel, session);
			} else {
				await this.finishQuiz(dmChannel, session);
			}
		} catch {
			const record = answerQuestion(session, -1);
			void record;

			const timeoutEmbed = buildTimeoutEmbed(question);
			await message.edit({ embeds: [timeoutEmbed], components: [] });

			if (session.currentIndex < session.questions.length) {
				await this.delay(NEXT_QUESTION_DELAY_MS);
				await this.sendQuestion(dmChannel, session);
			} else {
				await this.finishQuiz(dmChannel, session);
			}
		}
	}

	private async finishQuiz(dmChannel: DMChannel, session: QuizSession): Promise<void> {
		const resultsEmbed = buildResultsEmbed(session);
		await dmChannel.send({ embeds: [resultsEmbed] });

		const user = await container.client.users.fetch(session.userId);
		await saveResult(session.userId, user.username, {
			chapter: 'WAPS Test',
			questionCount: session.questions.length,
			correctCount: session.correctCount
		});

		removeSession(session.userId);
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
