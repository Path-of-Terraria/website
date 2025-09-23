import { HttpService } from "$lib/services/http-service";

export interface AvailableBenefitsResponse {
    supporterPacks: string[],
    subscriptions: string[]
}

export class BenefitsService {
    httpService = HttpService.getInstance();

    public async GetAvailable(): Promise<AvailableBenefitsResponse> {
        const url = `Benefits/Available`;
        const response = await this.httpService.get(url);
        if (response) {
            return response.data as AvailableBenefitsResponse;
        }
        return { supporterPacks: [], subscriptions: [] };
    }
}
