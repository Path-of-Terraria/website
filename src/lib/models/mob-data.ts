export interface IMobData {
    friendlyName: string;
    netId: number;
    damage?: IDamageConfiguration[];
    entries: IMobEntry[];
}

export interface IDamageConfiguration {
    minLevel: number;
    fire?: IDamageDetail;
    lightning?: IDamageDetail;
    cold?: IDamageDetail;
    chaos?: IDamageDetail;
}

export interface IDamageDetail {
    added?: number;
    conversion?: number;
}

export interface IMobEntry {
    scale?: number | null;
    prefix: string;
    weight: number;
    affixes: IMobEntryAffix[];
    damageOverrides?: IDamageConfiguration[];
}

export interface IMobEntryAffix {
    name: string;
}
