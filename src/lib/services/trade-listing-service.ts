import { HttpService } from "$lib/services/http-service";
import type {ITradeListing} from "$lib/models/trade-listing";

export class TradeListingService {
    httpService = HttpService.getInstance();

    public async getTradeListings(): Promise<ITradeListing[]> {
        let response = await this.httpService.get('TradeListing');
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
