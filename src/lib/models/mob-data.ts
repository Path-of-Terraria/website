export interface IMobData {
    friendlyName: string;
    netId: MobNetIdEnum;
    entries: IMobEntry[];
}

export interface IMobEntry {
    scale?: number | null;
    prefix: string;
    weight: number;
    stats: IMobStats;
    affixes: IMobEntryAffix[];
    requirements: string;
}

export interface IMobEntryAffix {
    name: string;
}

export interface IMobStats {
    level: number;
    experience: number;
}
