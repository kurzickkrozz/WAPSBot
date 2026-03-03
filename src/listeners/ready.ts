import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import type { StoreRegistryValue } from '@sapphire/pieces';
import { blue, gray, green, magenta, magentaBright, white, yellow } from 'colorette';
import { BOT_VERSION } from '../lib/config';
import { getChapterList, getTotalQuestionCount, loadChapters } from '../lib/quiz-engine';

const dev = process.env.NODE_ENV !== 'production';

@ApplyOptions<Listener.Options>({ once: true, event: 'clientReady' })
export class ReadyEvent extends Listener {
	private readonly style = dev ? yellow : blue;

	public override async run() {
		await loadChapters();
		this.printBanner();
		this.printStoreDebugInformation();
		this.printQuestionBankInfo();
	}

	private printBanner() {
		const success = green('+');
		const llc = dev ? magentaBright : white;
		const blc = dev ? magenta : blue;

		const line01 = llc('WAPS PFE Quiz Bot');

		const pad = ' '.repeat(2);

		console.log(
			String.raw`
${line01} ${pad}${blc(BOT_VERSION)}
${' '.repeat(17)} ${pad}[${success}] Gateway Connected
${dev ? `${' '.repeat(17)} ${pad}${blc('<')}${llc('/')}${blc('>')} ${llc('DEVELOPMENT MODE')}` : ''}
		`.trim()
		);
	}

	private printStoreDebugInformation() {
		const { client, logger } = this.container;
		const stores = [...client.stores.values()];
		const last = stores.pop()!;

		for (const store of stores) logger.info(this.styleStore(store, false));
		logger.info(this.styleStore(last, true));
	}

	private styleStore(store: StoreRegistryValue, last: boolean) {
		return gray(`${last ? '└─' : '├─'} Loaded ${this.style(store.size.toString().padEnd(3, ' '))} ${store.name}.`);
	}

	private printQuestionBankInfo() {
		const chapters = getChapterList();
		const total = getTotalQuestionCount();
		this.container.logger.info(
			gray(`📚 Question bank: ${this.style(chapters.length.toString())} chapters, ${this.style(total.toString())} questions`)
		);
	}
}
