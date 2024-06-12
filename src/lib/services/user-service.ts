import {HttpService} from "$lib/services/http-service";
import {GetJwtToken} from "$lib/services/session-service";
import type {IUser} from "$lib/stores/user-store";

export class UserService {
    httpService = new HttpService();
    user: IUser | null = null;

    public async getUserProfile() {
        if(!GetJwtToken()) {
            return null;
        }
        if (this.user) {
            return this.user;
        }
        let response = await this.httpService.get('User/Profile');
        if (response) {
            this.user = response;
        }
        return null;
    }
}