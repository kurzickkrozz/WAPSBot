import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { EmbedBuilder, MessageFlags } from 'discord.js';
import { AFH1_VERSION, BOT_DEVELOPER, BOT_VERSION, EMBED_COLOR, TEST_CYCLE } from '../lib/config';
import { getChapterList, getTotalQuestionCount } from '../lib/quiz-engine';

@ApplyOptions<Command.Options>({
	description: 'Display bot version and information'
})
export class AboutCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder.setName('about').setDescription('Display bot version and information')
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const chapters = getChapterList();
		const totalQuestions = getTotalQuestionCount();

		const embed = new EmbedBuilder()
			.setColor(EMBED_COLOR)
			.setTitle('WAPS PFE Quiz Bot')
			.addFields(
				{ name: 'Bot Version', value: BOT_VERSION, inline: true },
				{ name: 'AFH-1 Version', value: AFH1_VERSION, inline: true },
				{ name: 'Test Cycle', value: TEST_CYCLE, inline: true },
				{ name: 'Question Bank', value: `${chapters.length} chapters | ${totalQuestions} questions`, inline: true },
				{ name: 'Developer', value: BOT_DEVELOPER, inline: true }
			);

		return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
	}
}
