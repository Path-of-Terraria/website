export interface ITradeListing {
    id: string;
    currency: TradeListingCurrency;
    amount: number;
    note: string;
    itemData: ITradeListingItemData;
    isCorrupted: boolean;
    isMirrored: boolean;
}

export interface IFilteredTradeListingsResponse {
    items: ITradeListing[];
    totalMatches: number;
}

export enum TradeListingCurrency {
    GlitteringShard = 0,
    UnfoldingShard = 1,
    GlimmeringShard = 2,
    LimpidShard = 3,
    RadiantShard = 4,
    EchoingShard = 5,
    CorruptionShard = 6,
}

export interface ITradeListingItemData {
    name: string;
    type?: number;
    typeName?: string;
    rarity: TradeListingItemDataRarity;
    properties: ITradeListingItemDataAffix[];
    itemLevel: number;
}

export enum TradeListingItemDataRarity {
    Normal = 0,
    Magic = 1,
    Rare = 2,
    Unique = 3
}

export interface ITradeListingItemDataAffix {
    name: string;
    value: number;
    tier: number;
    isCorruptedAffix: boolean;
}
