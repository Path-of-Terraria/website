import { HttpService } from "$lib/services/http-service";

export interface IPlayer {
    name: string;
    stats: IPlayerStats;
}

export interface IPlayerStats {
    experience: number;
    level: number;
    class: string;
    strength: number;
    dexterity: number;
    intelligence: number;
}

export class PlayerService {
    httpService = HttpService.getInstance();

    public async getTop50Players(): Promise<IPlayer[]> {
        let response = await this.httpService.get('Player/Leaderboard?count=50&skip=0');
        if (response) {
            return response.data as IPlayer[];
        }
        return [];
    }

    public async getPlayer(name: string): Promise<IPlayer> {
        let response = await this.httpService.get(`Player/${name}`);
        if (response) {
            return response.data as IPlayer;
        }
        return {} as IPlayer;
    }
}
