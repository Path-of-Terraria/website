import { HttpService } from "$lib/services/http-service";
import type { IUser } from "$lib/stores/user-store";

export interface IPlayer {
    id: string;
    name: string;
    profileName?: string;
    stats: IPlayerStats;
    user?: IUser;
}

export interface IPlayerStats {
    experience: number;
    level: number;
    class: string;
    strength: number;
    dexterity: number;
    intelligence: number;
}

export interface ICharacterViewerStats {
    level: number;
    experience: number;
    savePlayTimeSeconds: number;
    modPlayerPlayTimeSeconds: number;
    strength: number;
    dexterity: number;
    intelligence: number;
    levelAchievedAt?: string;
}

export interface IGearAffixSnapshot {
    affixType: string;
    displayText: string;
    value: number;
    tier: number;
    isImplicit: boolean;
    isCorrupted: boolean;
}

export interface IGearItemSnapshot {
    sourceMod: string;
    internalName: string;
    typeId: number;
    displayName: string;
    itemType: string;
    rarity: string;
    influence: string;
    itemLevel: number;
    corrupted: boolean;
    cloned: boolean;
    prefixId: number;
    suffixId: number;
    damage: number;
    defense: number;
    critChance: number;
    knockback: number;
    useTime: number;
    manaCost: number;
    affixes: IGearAffixSnapshot[];
    affixTextLines: string[];
}

export interface IGearSlotSnapshot {
    slot: string;
    item?: IGearItemSnapshot;
}

export interface ICharacterGearSnapshot {
    capturedAt: string;
    modVersion?: string;
    slots: IGearSlotSnapshot[];
}

export interface IPassiveTreeNodeSnapshot {
    referenceId: number;
    internalIdentifier: string;
    level: number;
}

export interface ICharacterPassiveTreeSnapshot {
    capturedAt: string;
    modVersion?: string;
    points: number;
    extraPoints: number;
    allocatedNodes: IPassiveTreeNodeSnapshot[];
}

export interface ICharacterViewer {
    id: string;
    characterName: string;
    blacklisted: boolean;
    profileName?: string;
    modVersion?: string;
    characterClass?: string;
    stats: ICharacterViewerStats;
    gearSnapshot?: ICharacterGearSnapshot;
    passiveTreeSnapshot?: ICharacterPassiveTreeSnapshot;
    updatedDate?: string;
}

export class PlayerService {
    httpService = HttpService.getInstance();

    public async getLeaderboards(count: number = 50, skip: number = 0, characterClass?: string): Promise<IPlayer[]> {
        let url = `Player/Leaderboard?count=${encodeURIComponent(count)}&skip=${encodeURIComponent(skip)}`;
        if (characterClass) {
            url += `&characterClass=${encodeURIComponent(characterClass)}`;
        }
        const response = await this.httpService.get(url);
        if (response) {
            return response.data as IPlayer[];
        }
        return [];
    }

    public async getPlayer(name: string): Promise<IPlayer> {
        let response = await this.httpService.get(`Player/${name}`);
        if (response) {
            return response.data as IPlayer;
        }
        return {} as IPlayer;
    }

    public async getCharacterViewer(profileName: string, name: string): Promise<ICharacterViewer | null> {
        const response = await this.httpService.get(`Player/${encodeURIComponent(profileName)}/${encodeURIComponent(name)}/Viewer`);
        if (response) {
            return response.data as ICharacterViewer;
        }
        return null;
    }

    public async updatePlayerBlacklist(id: string, blacklisted: boolean): Promise<void> {
        await this.httpService.patch(`Player/${id}/Blacklisted`, { blacklisted });
    }
}
