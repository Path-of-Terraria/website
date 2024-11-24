import { HttpService } from "$lib/services/http-service";
import type {IMobData} from "$lib/models/mob-data";

export class ModDataService {
    httpService = HttpService.getInstance();

    public async getMobData(): Promise<IMobData[]> {
        let response = await this.httpService.get('ModData/Mobs');
        if (response) {
            return response.data as IMobData[];
        }
        return [];
    }

    public async exportMobData(data: IMobData[]): Promise<void> {
        const response = await this.httpService.post('ModData/ExportMobs', data, {
            responseType: 'blob',
        });
        const url = window.URL.createObjectURL(response.data);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'mob_data.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        window.URL.revokeObjectURL(url);
    }
}
