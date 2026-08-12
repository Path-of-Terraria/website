import affixLocalizationRaw from '$lib/data/affixes/affixes-en-US.hjson?raw';
import { HjsonParserService } from '$lib/services/hjson-parser-service';

export interface AffixTier {
	minValue: number;
	maxValue: number;
	minimumLevel: number;
	weight: number;
	strength?: number;
}

export interface AffixDefinition {
	affixType: string;
	equipTypes: string;
	influences?: string;
	round?: boolean;
	tiers: AffixTier[];
}

export interface AffixEntry extends AffixDefinition {
	sourceFile: string;
	displayName: string;
	description: string;
	searchText: string;
	effectiveTypeNames: string[];
	effectiveTypeMask: number;
}

export interface GearAffixSummary {
	type: string;
	displayName: string;
	mask: number;
	affixes: AffixEntry[];
	sourceFiles: string[];
	minimumLevel: number | null;
	highestLevel: number;
	totalWeight: number;
	searchText: string;
}

interface ItemTypeDefinition {
	name: string;
	mask: number;
	displayName: string;
	single: boolean;
}

const itemTypeMasks: Record<string, number> = {
	None: 0,
	Sword: 1 << 0,
	Spear: 1 << 1,
	Bow: 1 << 2,
	Gun: 1 << 3,
	Staff: 1 << 4,
	Tome: 1 << 5,
	Helmet: 1 << 6,
	Chestplate: 1 << 7,
	Leggings: 1 << 8,
	Ring: 1 << 9,
	Charm: 1 << 10,
	Wand: 1 << 11,
	Jewel: 1 << 12,
	Map: 1 << 13,
	Boomerang: 1 << 14,
	MeleeFlail: 1 << 15,
	RangedFlail: 1 << 16,
	Launcher: 1 << 17,
	Javelin: 1 << 18,
	Whip: 1 << 19,
	WarShield: 1 << 20,
	Grimoire: 1 << 21,
	Battleaxe: 1 << 22,
	Amulet: 1 << 23,
	Shield: 1 << 24,
	Quiver: 1 << 25,
	Talisman: 1 << 26,
	Focus: 1 << 27,
	Summon: 1 << 28,
	Yoyo: 1 << 29,
	Accessory: 1 << 30,
	Wings: 1 << 31,
	JumpAccessories: 1 << 32
};

itemTypeMasks.Armor = itemTypeMasks.Helmet | itemTypeMasks.Chestplate | itemTypeMasks.Leggings;
itemTypeMasks.Accessories = itemTypeMasks.Accessory;
itemTypeMasks.Equipment = itemTypeMasks.Armor | itemTypeMasks.Ring | itemTypeMasks.Charm | itemTypeMasks.Amulet | itemTypeMasks.Wings | itemTypeMasks.JumpAccessories | itemTypeMasks.Accessories;
itemTypeMasks.Offhand = itemTypeMasks.Shield | itemTypeMasks.Quiver | itemTypeMasks.Talisman | itemTypeMasks.Focus;
itemTypeMasks.Melee =
	itemTypeMasks.Sword | itemTypeMasks.Spear | itemTypeMasks.MeleeFlail | itemTypeMasks.WarShield | itemTypeMasks.Battleaxe | itemTypeMasks.Yoyo;
itemTypeMasks.Magic = itemTypeMasks.Staff | itemTypeMasks.Tome | itemTypeMasks.Wand;
itemTypeMasks.Ranged =
	itemTypeMasks.Bow | itemTypeMasks.Gun | itemTypeMasks.Boomerang | itemTypeMasks.RangedFlail | itemTypeMasks.Launcher | itemTypeMasks.Javelin;
itemTypeMasks.Summoner = itemTypeMasks.Whip | itemTypeMasks.Grimoire | itemTypeMasks.Summon;
itemTypeMasks.MeleeOrRanged = itemTypeMasks.Melee | itemTypeMasks.Ranged;
itemTypeMasks.Weapon = itemTypeMasks.Melee | itemTypeMasks.Magic | itemTypeMasks.Ranged | itemTypeMasks.Whip;
itemTypeMasks.AllGear = itemTypeMasks.Equipment | itemTypeMasks.Weapon;
itemTypeMasks.AllNoMap = itemTypeMasks.AllGear | itemTypeMasks.Jewel;
itemTypeMasks.All = itemTypeMasks.AllNoMap | itemTypeMasks.Map;

const singleItemTypeNames = [
	'Sword',
	'Spear',
	'Bow',
	'Gun',
	'Staff',
	'Tome',
	'Helmet',
	'Chestplate',
	'Leggings',
	'Ring',
	'Charm',
	'Wand',
	'Jewel',
	'Map',
	'Boomerang',
	'MeleeFlail',
	'RangedFlail',
	'Launcher',
	'Javelin',
	'Whip',
	'WarShield',
	'Grimoire',
	'Battleaxe',
	'Amulet',
	'Shield',
	'Quiver',
	'Talisman',
	'Focus',
	'Summon',
	'Yoyo',
	'Accessory',
	'Wings',
	'JumpAccessories'
];

export const itemTypes: ItemTypeDefinition[] = singleItemTypeNames.map((name) => ({
	name,
	mask: itemTypeMasks[name],
	displayName: humanizeIdentifier(name),
	single: true
}));

const affixModules = import.meta.glob('../data/affixes/*.json', { eager: true, import: 'default' }) as Record<string, AffixDefinition[]>;
const parser = new HjsonParserService();
const localization = parser.parseHjsonContent(affixLocalizationRaw, 'Affixes');

export const affixEntries: AffixEntry[] = Object.entries(affixModules)
	.flatMap(([path, entries]) => {
		const sourceFile = path.split('/').at(-1) ?? path;

		return entries.map((entry) => {
			const effectiveTypeMask = parseItemTypeMask(entry.equipTypes);
			const effectiveTypeNames = itemTypes
				.filter((itemType) => maskIntersects(itemType.mask, effectiveTypeMask))
				.map((itemType) => itemType.name);
			const displayName = getAffixDisplayName(entry.affixType);
			const description = getAffixDescription(entry.affixType);

			return {
				...entry,
				sourceFile,
				displayName,
				description,
				effectiveTypeNames,
				effectiveTypeMask,
				searchText: `${displayName} ${entry.affixType} ${description} ${entry.equipTypes} ${entry.influences ?? ''} ${sourceFile}`.toLocaleLowerCase()
			};
		});
	})
	.toSorted((left, right) => left.displayName.localeCompare(right.displayName) || left.affixType.localeCompare(right.affixType));

export const gearAffixSummaries: GearAffixSummary[] = itemTypes
	.map((itemType) => {
		const affixes = affixEntries.filter((affix) => maskIntersects(itemType.mask, affix.effectiveTypeMask));
		const sourceFiles = [...new Set(affixes.map((affix) => affix.sourceFile))].toSorted();
		const minimumLevels = affixes.flatMap((affix) => affix.tiers.map((tier) => tier.minimumLevel));
		const totalWeight = affixes.reduce((sum, affix) => sum + affix.tiers.reduce((tierSum, tier) => tierSum + tier.weight, 0), 0);

		return {
			type: itemType.name,
			displayName: itemType.displayName,
			mask: itemType.mask,
			affixes,
			sourceFiles,
			minimumLevel: minimumLevels.length > 0 ? Math.min(...minimumLevels) : null,
			highestLevel: minimumLevels.length > 0 ? Math.max(...minimumLevels) : 0,
			totalWeight,
			searchText: `${itemType.displayName} ${itemType.name} ${sourceFiles.join(' ')} ${affixes.map((affix) => affix.searchText).join(' ')}`.toLocaleLowerCase()
		};
	})
	.filter((summary) => summary.affixes.length > 0)
	.toSorted((left, right) => left.displayName.localeCompare(right.displayName));

export const sourceFiles = [...new Set(affixEntries.map((affix) => affix.sourceFile))].toSorted();

export function getAffixDescription(affixType: string): string {
	return localization[`Mods.PathOfTerraria.Affixes.${affixType}.Description`] ?? '';
}

export function formatAffixDescription(affix: Pick<AffixEntry, 'description' | 'affixType'>, value: number): string {
	const description = affix.description || humanizeIdentifier(affix.affixType);
	const sign = value > 0 ? '+' : '';

	return description.replaceAll('{0}', formatNumber(value)).replaceAll('{1}', sign);
}

export function formatTierRange(affix: AffixEntry, tier: AffixTier): string {
	const minText = formatAffixDescription(affix, tier.minValue);
	const maxText = formatAffixDescription(affix, tier.maxValue);

	return minText === maxText ? minText : `${minText} to ${maxText}`;
}

function parseItemTypeMask(value: string): number {
	return value
		.split(' ')
		.map((item) => item.trim())
		.filter(Boolean)
		.reduce((mask, item) => {
			const isNegated = item.startsWith('-');
			const isExplicitAdd = item.startsWith('+');
			const name = isNegated || isExplicitAdd ? item.slice(1) : item;
			const itemMask = itemTypeMasks[name] ?? 0;

			return isNegated ? mask & ~itemMask : mask | itemMask;
		}, 0);
}

function maskIntersects(left: number, right: number): boolean {
	return (left & right) !== 0;
}

function getAffixDisplayName(affixType: string): string {
	return humanizeIdentifier(affixType);
}

function humanizeIdentifier(identifier: string): string {
	return identifier
		.replace(/ItemAffix$/u, '')
		.replace(/GearAffix$/u, '')
		.replace(/Affix$/u, '')
		.replace(/([a-z])([A-Z])/gu, '$1 $2')
		.replace(/Or/gu, ' or ')
		.replace(/\s+/gu, ' ')
		.trim();
}

function formatNumber(value: number): string {
	return Number.isInteger(value) ? value.toString() : value.toFixed(2).replace(/\.?0+$/u, '');
}
