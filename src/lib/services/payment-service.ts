import { HttpService } from "$lib/services/http-service";

export interface LeaguePacksResponse {
    name: string;
    description: string;
    type: LeaguePackType;
    price?: number;
    id: string;
    marketingFeatures?: string[];
}

export enum LeaguePackType {
    Subscription = "Subscription",
    OneTime = "OneTime",
}

export class PaymentService {
    httpService = HttpService.getInstance();

    public async getSupporterPacks(): Promise<LeaguePacksResponse[]> {
        const url = `Payments/SupporterProducts`;
        const response = await this.httpService.get(url);
        if (response) {
            return response.data as LeaguePacksResponse[];
        }
        return [];
    }
}
