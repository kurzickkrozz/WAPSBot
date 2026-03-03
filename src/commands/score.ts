import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { EmbedBuilder, MessageFlags } from 'discord.js';
import { EMBED_COLOR } from '../lib/config';
import { getScore } from '../lib/store';

@ApplyOptions<Command.Options>({
	description: 'View your quiz stats'
})
export class ScoreCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) => builder.setName('score').setDescription('View your WAPS quiz stats'));
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const score = await getScore(interaction.user.id);

		if (!score) {
			return interaction.reply({
				content: 'You haven\'t taken any quizzes yet. Use `/quiz start` to begin!',
				flags: MessageFlags.Ephemeral
			});
		}

		const accuracy = Math.round((score.totalCorrect / score.totalQuestions) * 100);
		const recentHistory = score.history
			.slice(-5)
			.reverse()
			.map((h) => {
				const pct = Math.round((h.correctCount / h.questionCount) * 100);
				return `${h.chapter === 'all' ? 'All Chapters' : h.chapter} — ${h.correctCount}/${h.questionCount} (${pct}%)`;
			})
			.join('\n');

		const embed = new EmbedBuilder()
			.setColor(EMBED_COLOR)
			.setTitle(`Stats for ${interaction.user.displayName}`)
			.addFields(
				{ name: 'Quizzes Taken', value: `${score.totalQuizzes}`, inline: true },
				{ name: 'Questions Answered', value: `${score.totalQuestions}`, inline: true },
				{ name: 'Accuracy', value: `${accuracy}%`, inline: true },
				{ name: 'Recent Quizzes', value: recentHistory || 'None' }
			);

		return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
	}
}
