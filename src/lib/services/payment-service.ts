import { HttpService } from "$lib/services/http-service";

export interface LeaguePacksResponse {
    name: string;
    description: string;
    type: LeaguePackType;
    price?: number;
    id: string;
    marketingFeatures?: string[];
}

export interface CreateCheckoutRequest {
     productId: string
}

export enum LeaguePackType {
    Subscription = 0,
    OneTime = 1,
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

    public async createCheckout(productId: string): Promise<string> {
        const url = `Payments`;
        const response = await this.httpService.post(url, { productId });

        if (response) {
            return response.data as string;
        }

        return "";
    }
}
