import { ApplyOptions } from '@sapphire/decorators';
import { container } from '@sapphire/framework';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { type ChatInputCommandInteraction, ComponentType, type DMChannel, MessageFlags, SlashCommandBuilder, SlashCommandSubcommandBuilder } from 'discord.js';
import {
	DEFAULT_QUESTION_COUNT,
	MIN_QUESTION_COUNT,
	NEXT_QUESTION_DELAY_MS,
	QUESTION_TIMEOUT_MS
} from '../lib/config';
import {
	answerQuestion,
	buildQuiz,
	cancelSession,
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

@ApplyOptions<Subcommand.Options>({
	name: 'quiz',
	description: 'Start a WAPS PFE quiz session',
	subcommands: [
		{
			name: 'start',
			chatInputRun: 'chatInputStart'
		},
		{
			name: 'cancel',
			chatInputRun: 'chatInputCancel'
		}
	]
})
export class QuizCommand extends Subcommand {
	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((builder: SlashCommandBuilder) =>
			builder
				.setName('quiz')
				.setDescription('Start a WAPS PFE quiz session')
				.addSubcommand((sub: SlashCommandSubcommandBuilder) =>
					sub
						.setName('start')
						.setDescription('Begin a new quiz')
						.addStringOption((opt) =>
							opt
								.setName('chapter')
								.setDescription('PFE chapter to quiz on (leave blank for all chapters)')
								.setRequired(false)
								.setAutocomplete(true)
						)
						.addIntegerOption((opt) =>
							opt
								.setName('count')
								.setDescription(`Number of questions (default: ${DEFAULT_QUESTION_COUNT})`)
								.setRequired(false)
								.setMinValue(MIN_QUESTION_COUNT)
						)
						.addBooleanOption((opt) =>
							opt
								.setName('timed')
								.setDescription('Enable 60-second timer per question (default: off)')
								.setRequired(false)
						)
				)
				.addSubcommand((sub: SlashCommandSubcommandBuilder) => sub.setName('cancel').setDescription('Cancel your active quiz session'))
		);
	}

	public async chatInputStart(interaction: ChatInputCommandInteraction): Promise<void> {
		const userId = interaction.user.id;

		if (hasSession(userId)) {
			await interaction.reply({
				content: 'You already have an active quiz session. Use `/quiz cancel` to end it first.',
				flags: MessageFlags.Ephemeral
			});
			return;
		}

		const chapterInput = interaction.options.getString('chapter');
		const chapterFilter = chapterInput && chapterInput !== 'all' ? chapterInput : null;
		const count = interaction.options.getInteger('count') ?? DEFAULT_QUESTION_COUNT;
		const timed = interaction.options.getBoolean('timed') ?? false;

		const questions = buildQuiz(chapterFilter, count);
		if (!questions || questions.length === 0) {
			await interaction.reply({
				content: chapterFilter
					? `No questions found for chapter "${chapterFilter}". Use \`/chapters\` to see available chapters.`
					: 'No questions loaded. Ask an admin to add question bank files.',
				flags: MessageFlags.Ephemeral
			});
			return;
		}

		const session = startSession(userId, chapterFilter, questions, timed);
		const modeLabel = timed ? ' (timed)' : '';

		await interaction.reply({
			content: `Quiz started with ${questions.length} question(s)${modeLabel}. Check your DMs!`,
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

	public async chatInputCancel(interaction: ChatInputCommandInteraction) {
		const removed = cancelSession(interaction.user.id);
		return interaction.reply({
			content: removed ? 'Quiz cancelled.' : 'You don\'t have an active quiz session.',
			flags: MessageFlags.Ephemeral
		});
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
			// Timeout — mark incorrect and move on (only happens in timed mode)
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
			chapter: session.chapterFilter ?? 'all',
			questionCount: session.questions.length,
			correctCount: session.correctCount
		});

		removeSession(session.userId);
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
