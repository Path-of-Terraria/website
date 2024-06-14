import { HttpService } from "$lib/services/http-service";

export interface IPlayer {
    name: string;
    stats: IPlayerStats;
}

export interface IPlayerStats {
    experience: number;
    level: number;
    class: string;
}

export class PlayerService {
    httpService = new HttpService();

    public async getTop50Players(): Promise<IPlayer[]> {
        let response = await this.httpService.get('Player/Leaderboard?count=50&skip=0');
        if (response) {
            return response.data as IPlayer[];
        }
        return [];
    }
}
