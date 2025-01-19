export interface ITradeListing {
    currency: TradeListingCurrency;
    amount: number;
    note: string;
    itemData: ITradeListingItemData;
    isCorrupted: boolean;
    isMirrored: boolean;
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
    rarity: TradeListingItemDataRarity;
    properties: ITradeListingItemDataAffix[];
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
    affixTier: number;
    isCorruptedAffix: boolean;
}