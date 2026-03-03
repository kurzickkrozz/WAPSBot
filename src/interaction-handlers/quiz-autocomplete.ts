import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { AutocompleteInteraction } from 'discord.js';
import { getChapterList } from '../lib/quiz-engine';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.Autocomplete
})
export class QuizAutocompleteHandler extends InteractionHandler {
	public override async run(interaction: AutocompleteInteraction) {
		const focused = interaction.options.getFocused().toLowerCase();
		const chapters = getChapterList();

		const choices = [
			{ name: 'All Chapters', value: 'all' },
			...chapters.map((c) => ({
				name: `${c.chapter}: ${c.title} (${c.questionCount}q)`,
				value: c.chapter
			}))
		];

		const filtered = choices.filter((c) => c.name.toLowerCase().includes(focused)).slice(0, 25);

		return interaction.respond(filtered);
	}

	public override parse(interaction: AutocompleteInteraction) {
		if (interaction.commandName !== 'quiz') return this.none();
		const focused = interaction.options.getFocused(true);
		if (focused.name !== 'chapter') return this.none();
		return this.some();
	}
}
