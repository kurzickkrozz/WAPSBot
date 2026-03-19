import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { MessageFlags, PermissionFlagsBits } from 'discord.js';
import { clearScores, removeUserScore } from '../lib/store';

@ApplyOptions<Command.Options>({
	description: 'Clear leaderboard and score data'
})
export class ClearLeaderboardCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName('clearleaderboard')
				.setDescription('Clear leaderboard and score data')
				.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
				.addUserOption((opt) =>
					opt
						.setName('user')
						.setDescription('Remove a specific user\'s scores (omit to clear all)')
						.setRequired(false)
				)
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const targetUser = interaction.options.getUser('user');

		if (targetUser) {
			const removed = await removeUserScore(targetUser.id);
			return interaction.reply({
				content: removed
					? `Scores for **${targetUser.displayName}** have been removed.`
					: `No scores found for **${targetUser.displayName}**.`,
				flags: MessageFlags.Ephemeral
			});
		}

		await clearScores();

		return interaction.reply({
			content: 'Leaderboard and all score data have been cleared.',
			flags: MessageFlags.Ephemeral
		});
	}
}
