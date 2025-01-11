import {HttpService} from "$lib/services/http-service";
import {GetJwtToken, SetJwtToken, ClearStorageItem} from "$lib/services/session-service";
import {type IUser, user} from "$lib/stores/user-store";
import type {IPlayer} from "$lib/services/player-service";

export class UserService {
    httpService = HttpService.getInstance();
    user: IUser | null = null;

    public async getUserProfile() {
        if (!GetJwtToken()) {
            return null;
        }
        if (this.user) {
            return this.user;
        }
        try {
            let response = await this.httpService.get('User/Profile');
            if (response) {
                this.user = response.data;
                //@ts-ignore
                user.set(this.user);
                return this.user;
            }
        } catch(e) {
            ClearStorageItem('jwt_token');
            user.set(null);
            return null;
        }
        return null;
    }

    public async login(email: string, password: string) {
        let response = await this.httpService.post('', {email, password});
        if (response.data.token) {
            SetJwtToken(response.data.token);
            await this.getUserProfile();
        }
        return response;
    }

    public async signup(email: string, password: string, profileName: string) {
        let response = await this.httpService.post('User', {email, password, profileName});
        if (response.data.token) {
            SetJwtToken(response.data.token);
            return await this.getUserProfile();
        }
        return response;
    }

    public async forgotPassword(email: string) {
        return await this.httpService.post('RequestPasswordReset', {email});
    }

    public async resetPassword(email: string, token: string, password: string) {
        return await this.httpService.post('ResetPassword', {token, password, email});
    }

    public async signout() {
        SetJwtToken('');
        this.user = null;
        user.set(null);
    }

    public async updateProfile(profileName: string) {
        let response = await this.httpService.patch('User', {profileName});
        if (response) {
            await this.getUserProfile();
        }
        return null;
    }

    public async unlinkSteam() {
        let response = await this.httpService.delete('User/UnlinkSteam');
        if (response) {
            await this.getUserProfile();
        }
        return null;
    }

    public async getPlayers(profileName: string): Promise<IPlayer[]> {
        let response = await this.httpService.get(`User/${profileName}/Players`);
        if (response) {
            return response.data as IPlayer[];
        }
        return [];
    }
}