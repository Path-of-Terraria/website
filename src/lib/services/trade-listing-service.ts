import { HttpService } from "$lib/services/http-service";
import type {ITradeListing, TradeListingItemDataRarity} from "$lib/models/trade-listing";
import { expandTradeItemType } from "$lib/trade/item-types";

export interface GearFilter {
    name?: string;
    typeName?: string;
    rarity?: TradeListingItemDataRarity;
    type?: number; // ItemType enum from backend
    isCorrupted?: boolean;
    isMirrored?: boolean;
    minStack?: number;
    maxStack?: number;
    minItemLevel?: number;
    maxItemLevel?: number;
    affixName?: string;
    affixMinTier?: number;
    affixMinValue?: number;
    page?: number;
    pageSize?: number;
}

export class TradeListingService {
    httpService = HttpService.getInstance();

    public async getTradeListings(page = 1, pageSize = 20): Promise<ITradeListing[]> {
        const params = new URLSearchParams({
            Page: page.toString(),
            PageSize: pageSize.toString()
        });
        
        let response = await this.httpService.get(`TradeListing?${params.toString()}`);
        if (response) {
            return response.data as ITradeListing[];
        }
        return [];
    }

    public async getFilteredTrades(filter: GearFilter, page = 1, pageSize = 20): Promise<ITradeListing[]> {
        const expandedTypes = filter.type !== undefined ? expandTradeItemType(filter.type) : [];
        if (expandedTypes.length > 0) {
            const expandedPageSize = page * pageSize;
            const groupedListings = await Promise.all(
                expandedTypes.map((type) => this.getFilteredTradesForSingleType(
                    { ...filter, type },
                    1,
                    expandedPageSize
                ))
            );
            const uniqueListings = groupedListings
                .flat()
                .filter((listing, index, listings) => listings.findIndex((match) => match.id === listing.id) === index);

            return uniqueListings.slice((page - 1) * pageSize, page * pageSize);
        }

        return this.getFilteredTradesForSingleType(filter, page, pageSize);
    }

    private async getFilteredTradesForSingleType(filter: GearFilter, page = 1, pageSize = 20): Promise<ITradeListing[]> {
        // Convert filter object to query parameters
        const params = new URLSearchParams();
        params.append('Page', page.toString());
        params.append('PageSize', pageSize.toString());
        
        if (filter.name) params.append('Name', filter.name);
        if (filter.typeName) params.append('TypeName', filter.typeName);
        if (filter.rarity !== undefined) params.append('Rarity', filter.rarity.toString());
        if (filter.type !== undefined) params.append('Type', filter.type.toString());
        if (filter.isCorrupted !== undefined) params.append('IsCorrupted', filter.isCorrupted.toString());
        if (filter.isMirrored !== undefined) params.append('IsMirrored', filter.isMirrored.toString());
        if (filter.minStack !== undefined) params.append('MinStack', filter.minStack.toString());
        if (filter.maxStack !== undefined) params.append('MaxStack', filter.maxStack.toString());
        if (filter.minItemLevel !== undefined) params.append('MinItemLevel', filter.minItemLevel.toString());
        if (filter.maxItemLevel !== undefined) params.append('MaxItemLevel', filter.maxItemLevel.toString());
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
