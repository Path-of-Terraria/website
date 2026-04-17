import mechanicsLocalizationRaw from '$lib/data/passives/mechanics-en-US.hjson?raw';
import { HjsonParserService } from '$lib/services/hjson-parser-service';

export interface MechanicDefinition {
	key: string;
	tag: string;
	description: string;
}

export interface MechanicTextSegment {
	type: 'text' | 'mechanic';
	value: string;
	mechanic?: MechanicDefinition;
}

const parser = new HjsonParserService();
const localization = parser.parseHjsonContent(mechanicsLocalizationRaw, 'Mechanics');

const mechanicTokenPattern = /\[mechanic(?:\/shift(?:=[^\]:]+)?)?:([^\]]+)\]/gu;

export const mechanicDefinitions: Readonly<Record<string, MechanicDefinition>> = Object.freeze(
	Object.fromEntries(
		Object.entries(localization)
			.filter(([key]) => key.endsWith('.Tag'))
			.map(([key, tag]) => {
				const baseKey = key.slice(0, -4);
				const mechanicKey = baseKey.split('.').pop() ?? '';

				return [
					mechanicKey,
					{
						key: mechanicKey,
						tag,
						description: localization[`${baseKey}.Description`] ?? ''
					}
				];
			})
	)
);

export function getMechanicDefinition(key: string): MechanicDefinition | undefined {
	return mechanicDefinitions[key];
}

export function parseMechanicText(text: string): MechanicTextSegment[] {
	if (!text) {
		return [];
	}

	const segments: MechanicTextSegment[] = [];
	let lastIndex = 0;

	for (const match of text.matchAll(mechanicTokenPattern)) {
		const start = match.index ?? 0;

		if (start > lastIndex) {
			segments.push({
				type: 'text',
				value: text.slice(lastIndex, start)
			});
		}

		const mechanicKey = match[1];
		const mechanic = getMechanicDefinition(mechanicKey);

		segments.push({
			type: 'mechanic',
			value: mechanic?.tag ?? mechanicKey,
			mechanic
		});

		lastIndex = start + match[0].length;
	}

	if (lastIndex < text.length) {
		segments.push({
			type: 'text',
			value: text.slice(lastIndex)
		});
	}

	return segments;
}
