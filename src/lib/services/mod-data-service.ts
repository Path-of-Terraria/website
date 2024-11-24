import { HttpService } from "$lib/services/http-service";
import type {IMobData} from "$lib/models/mob-data";

export class ModDataService {
    httpService = new HttpService();

    public async getMobData(): Promise<IMobData[]> {
        let response = await this.httpService.get('ModData/Mobs');
        if (response) {
            return response.data as IMobData[];
        }
        return [];
    }
}
