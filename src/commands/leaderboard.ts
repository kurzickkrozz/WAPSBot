import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { EmbedBuilder, MessageFlags } from 'discord.js';
import { EMBED_COLOR, LEADERBOARD_MIN_QUESTIONS, LEADERBOARD_SIZE } from '../lib/config';
import { getLeaderboard } from '../lib/store';

const RANK_MEDALS = ['🥇', '🥈', '🥉'] as const;

@ApplyOptions<Command.Options>({
	description: 'View the quiz leaderboard'
})
export class LeaderboardCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder.setName('leaderboard').setDescription('View top quiz scores in this server')
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const leaders = await getLeaderboard(LEADERBOARD_SIZE);

		if (leaders.length === 0) {
			return interaction.reply({
				content: 'No scores recorded yet. Be the first — use `/quiz start`!',
				flags: MessageFlags.Ephemeral
			});
		}

		const lines = leaders.map((entry, i) => {
			const accuracy = Math.round((entry.totalCorrect / entry.totalQuestions) * 100);
			const prefix = i < RANK_MEDALS.length ? RANK_MEDALS[i] : `**${i + 1}.**`;
			return `${prefix} **${entry.username}** — ${accuracy}% (${entry.totalQuestions} questions)`;
		});

		const embed = new EmbedBuilder()
			.setColor(EMBED_COLOR)
			.setTitle('WAPS PFE Leaderboard')
			.setDescription(lines.join('\n'))
			.setFooter({ text: `Minimum ${LEADERBOARD_MIN_QUESTIONS} questions answered to qualify` });

		return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
	}
}
