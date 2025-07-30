import { HttpService } from "$lib/services/http-service";
import type {ITradeListing, TradeListingItemDataRarity} from "$lib/models/trade-listing";

export interface GearFilter {
    name?: string;
    typeName?: string;
    rarity?: TradeListingItemDataRarity;
    type?: number; // ItemType enum from backend
    isCorrupted?: boolean;
    isMirrored?: boolean;
    minStack?: number;
    maxStack?: number;
    affixName?: string;
    affixMinTier?: number;
    affixMinValue?: number;
}

export class TradeListingService {
    httpService = HttpService.getInstance();

    public async getTradeListings(): Promise<ITradeListing[]> {
        let response = await this.httpService.get('TradeListing');
        if (response) {
            return response.data as ITradeListing[];
        }
        return [];
    }

    public async getFilteredTrades(filter: GearFilter): Promise<ITradeListing[]> {
        // Convert filter object to query parameters
        const params = new URLSearchParams();
        
        if (filter.name) params.append('Name', filter.name);
        if (filter.typeName) params.append('TypeName', filter.typeName);
        if (filter.rarity !== undefined) params.append('Rarity', filter.rarity.toString());
        if (filter.type !== undefined) params.append('Type', filter.type.toString());
        if (filter.isCorrupted !== undefined) params.append('IsCorrupted', filter.isCorrupted.toString());
        if (filter.isMirrored !== undefined) params.append('IsMirrored', filter.isMirrored.toString());
        if (filter.minStack !== undefined) params.append('MinStack', filter.minStack.toString());
        if (filter.maxStack !== undefined) params.append('MaxStack', filter.maxStack.toString());
        if (filter.affixName) params.append('AffixName', filter.affixName);
        if (filter.affixMinTier !== undefined) params.append('AffixMinTier', filter.affixMinTier.toString());
        if (filter.affixMinValue !== undefined) params.append('AffixMinValue', filter.affixMinValue.toString());
        
        const queryString = params.toString();
        const url = `TradeListing/Filter${queryString ? '?' + queryString : ''}`;
        
        let response = await this.httpService.get(url);
        if (response) {
            return response.data as ITradeListing[];
        }
        return [];
    }

    public async requestTradeListingSold(tradeListingId: string, buyerSteamId: string): Promise<void> {
        const response = await this.httpService.post(`TradeListing/${tradeListingId}/RequestSold`, {
            "buyerSteamId": buyerSteamId
        });
    }
}
