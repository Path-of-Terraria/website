import {HttpService} from "$lib/services/http-service";
import {GetJwtToken, SetJwtToken, ClearStorageItem} from "$lib/services/session-service";
import {type IChosenBenefits, type IUpdateMyBenefitsRequest, type IUser, user} from "$lib/stores/user-store";

interface IUpdateBenefitsRequest {
    supporterPacks: string[],
    subscription: string
}

export interface IAvailableBenefitsResponse {
    icons: string[],
    colors: string[],
    discordRoles: string[]
}

export interface IProfileCharacter {
    characterName: string;
    level: number;
    strength: number;
    dexterity: number;
    intelligence: number;
}

export class UserService {
    httpService = HttpService.getInstance();
    user: IUser | null = null;
    roles: string[] = [];

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

    public async getRoles() {
        let response = await this.httpService.get('User/Roles');
        if (response) {
            this.roles = response.data;
            return response.data;
        }
        return [];
    }

    public async hasRole(role: string) {
        if (!this.roles.length) {
            await this.getRoles();
        }
        return this.roles.includes(role);
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

    public async getUser(profileName: string): Promise<IUser | null> {
        let response = await this.httpService.get(`User/${profileName}`);
        if (response) {
            return response.data as IUser;
        }
        return null;
    }

    public async getPlayers(profileName: string): Promise<IProfileCharacter[]> {
        let response = await this.httpService.get(`User/${profileName}/Players`);
        if (response) {
            return response.data as IProfileCharacter[];
        }
        return [];
    }

    public async updateUser(user: IUser) {
        let response = await this.httpService.put('User', user);
        if (response) {
            return response;
        }
        return null;
    }

    public async updateUserRoles(user: IUser) {
        let response = await this.httpService.patch(`User/${user.id}/Roles`, user);
        if (response) {
            return response;
        }
        return null;
    }

    public async getMyBenefits(userId: string) {
        let response = await this.httpService.get(`User/Benefits`);
        if (response) {
            return response as typeof response & { data: IAvailableBenefitsResponse };
        }
        return null;
    }

    public async updateMyBenefits(userId: string, request: IUpdateMyBenefitsRequest) {
        let response = await this.httpService.patch(`User/Benefits`, request);
        if (response) {
            return response;
        }
        return null;
    }

    public async updateBenefits(userId: string, request: IUpdateBenefitsRequest) {
        let response = await this.httpService.patch(`User/${userId}/Benefits`, request);
        if (response) {
            return response;
        }
        return null;
    }

    public async linkDiscord(oauthCode: string) {
        let response = await this.httpService.post(`User/Discord?oauthCode=${oauthCode}`, {});
    }

    public async unlinkDiscord() {
        let response = await this.httpService.delete('User/UnlinkDiscord');
        if (response) {
            await this.getUserProfile();
        }
        return null;
    }
}
