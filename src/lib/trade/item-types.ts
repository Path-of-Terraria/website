export const tradeItemTypeMasks = {
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
    BattleAxe: 1 << 22,
    Amulet: 1 << 23,
    Shield: 1 << 24,
    Quiver: 1 << 25,
    Talisman: 1 << 26,
    Focus: 1 << 27,
    Summon: 1 << 28,
    Yoyo: 1 << 29
};

export const tradeSingleItemTypes = [
    { id: tradeItemTypeMasks.Sword, name: 'Sword' },
    { id: tradeItemTypeMasks.Spear, name: 'Spear' },
    { id: tradeItemTypeMasks.Bow, name: 'Bow' },
    { id: tradeItemTypeMasks.Gun, name: 'Gun' },
    { id: tradeItemTypeMasks.Staff, name: 'Staff' },
    { id: tradeItemTypeMasks.Tome, name: 'Tome' },
    { id: tradeItemTypeMasks.Helmet, name: 'Helmet' },
    { id: tradeItemTypeMasks.Chestplate, name: 'Chestplate' },
    { id: tradeItemTypeMasks.Leggings, name: 'Leggings' },
    { id: tradeItemTypeMasks.Ring, name: 'Ring' },
    { id: tradeItemTypeMasks.Charm, name: 'Charm' },
    { id: tradeItemTypeMasks.Wand, name: 'Wand' },
    { id: tradeItemTypeMasks.Jewel, name: 'Jewel' },
    { id: tradeItemTypeMasks.Map, name: 'Map' },
    { id: tradeItemTypeMasks.Boomerang, name: 'Boomerang' },
    { id: tradeItemTypeMasks.MeleeFlail, name: 'Melee Flail' },
    { id: tradeItemTypeMasks.RangedFlail, name: 'Ranged Flail' },
    { id: tradeItemTypeMasks.Launcher, name: 'Launcher' },
    { id: tradeItemTypeMasks.Javelin, name: 'Javelin' },
    { id: tradeItemTypeMasks.Whip, name: 'Whip' },
    { id: tradeItemTypeMasks.WarShield, name: 'War Shield' },
    { id: tradeItemTypeMasks.Grimoire, name: 'Grimoire' },
    { id: tradeItemTypeMasks.BattleAxe, name: 'Battle Axe' },
    { id: tradeItemTypeMasks.Amulet, name: 'Amulet' },
    { id: tradeItemTypeMasks.Shield, name: 'Shield' },
    { id: tradeItemTypeMasks.Quiver, name: 'Quiver' },
    { id: tradeItemTypeMasks.Talisman, name: 'Talisman' },
    { id: tradeItemTypeMasks.Focus, name: 'Focus' },
    { id: tradeItemTypeMasks.Summon, name: 'Summon' },
    { id: tradeItemTypeMasks.Yoyo, name: 'Yoyo' }
];

const Armor = tradeItemTypeMasks.Helmet | tradeItemTypeMasks.Chestplate | tradeItemTypeMasks.Leggings;
const Accessories = tradeItemTypeMasks.Ring | tradeItemTypeMasks.Charm | tradeItemTypeMasks.Amulet;
const Equipment = Armor | Accessories;
const Offhand = tradeItemTypeMasks.Shield | tradeItemTypeMasks.Quiver | tradeItemTypeMasks.Talisman | tradeItemTypeMasks.Focus;
const Melee = tradeItemTypeMasks.Sword | tradeItemTypeMasks.Spear | tradeItemTypeMasks.MeleeFlail | tradeItemTypeMasks.WarShield | tradeItemTypeMasks.BattleAxe | tradeItemTypeMasks.Yoyo;
const Magic = tradeItemTypeMasks.Staff | tradeItemTypeMasks.Tome | tradeItemTypeMasks.Wand;
const Ranged = tradeItemTypeMasks.Bow | tradeItemTypeMasks.Gun | tradeItemTypeMasks.Boomerang | tradeItemTypeMasks.RangedFlail | tradeItemTypeMasks.Launcher | tradeItemTypeMasks.Javelin;
const Summoner = tradeItemTypeMasks.Whip | tradeItemTypeMasks.Grimoire | tradeItemTypeMasks.Summon;
const Weapon = Melee | Magic | Ranged | tradeItemTypeMasks.Whip;
const AllGear = Equipment | Weapon;
const AllNoMap = AllGear | tradeItemTypeMasks.Jewel;
const All = AllNoMap | tradeItemTypeMasks.Map;

export const tradeItemTypeOptions = [
    { id: tradeItemTypeMasks.None, name: 'None' },
    ...tradeSingleItemTypes,
    { id: Armor, name: 'Armor' },
    { id: Accessories, name: 'Accessories' },
    { id: Equipment, name: 'Equipment' },
    { id: Offhand, name: 'Offhand' },
    { id: Melee, name: 'Melee' },
    { id: Magic, name: 'Magic' },
    { id: Ranged, name: 'Ranged' },
    { id: Summoner, name: 'Summoner' },
    { id: Weapon, name: 'Weapon' },
    { id: AllGear, name: 'All Gear' },
    { id: AllNoMap, name: 'All No Map' },
    { id: All, name: 'All' }
].map((type) => ({ ...type, name: toCapitalCase(type.name) }));

export const tradeItemTypeNames = Object.fromEntries(
    tradeSingleItemTypes.map((type) => [type.id, toCapitalCase(type.name)])
) as Record<number, string>;

export function expandTradeItemType(type: number) {
    if (type === tradeItemTypeMasks.None) {
        return [];
    }

    const matchingTypes = tradeSingleItemTypes
        .filter((singleType) => (type & singleType.id) !== 0)
        .map((singleType) => singleType.id);

    return matchingTypes.length > 1 ? matchingTypes : [];
}

function toCapitalCase(value: string) {
    return value
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
