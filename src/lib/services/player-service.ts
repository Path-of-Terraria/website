import { HttpService } from "$lib/services/http-service";
import type { IUser } from "$lib/stores/user-store";

export interface IPlayer {
    id: string;
    name: string;
    profileName?: string;
    stats: IPlayerStats;
    user?: IUser;
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

    public async getLeaderboards(count: number = 50, skip: number = 0): Promise<IPlayer[]> {
        const url = `Player/Leaderboard?count=${encodeURIComponent(count)}&skip=${encodeURIComponent(skip)}`;
        const response = await this.httpService.get(url);
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
