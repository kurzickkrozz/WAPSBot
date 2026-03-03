import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { EmbedBuilder, MessageFlags } from 'discord.js';
import { EMBED_COLOR } from '../lib/config';
import { getChapterList, getTotalQuestionCount } from '../lib/quiz-engine';

@ApplyOptions<Command.Options>({
	description: 'List available PFE chapters'
})
export class ChaptersCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder.setName('chapters').setDescription('List available PFE chapters and question counts')
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const chapters = getChapterList();

		if (chapters.length === 0) {
			return interaction.reply({
				content: 'No question banks loaded. Ask an admin to add question files to `data/questions/`.',
				flags: MessageFlags.Ephemeral
			});
		}

		const lines = chapters.map((c) => `**${c.chapter}** — ${c.title} (${c.questionCount} questions)`);
		const total = getTotalQuestionCount();

		const embed = new EmbedBuilder()
			.setColor(EMBED_COLOR)
			.setTitle('PFE Study Chapters')
			.setDescription(lines.join('\n'))
			.setFooter({ text: `${chapters.length} chapters | ${total} total questions` });

		return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
	}
}
