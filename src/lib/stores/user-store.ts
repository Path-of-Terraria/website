import { writable } from 'svelte/store';
import {UserService} from "$lib/services/user-service";

export interface IUser {
    id: number;
    name: string;
    email: string;
    steamId: string;
    profileName: string;
}

function createUserStore() {
    const { subscribe, set, update } = writable(null);
    const userService = new UserService();
    const checkAndFetchUser = async () => {
        // Check if localStorage is available (only in the browser)
        if (typeof localStorage !== 'undefined') {
            const response = await userService.getUserProfile();
            //@ts-ignore
            set(response);
        } else {
            // If localStorage is not available, set uver to null
            set(null);
        }
    };

    checkAndFetchUser();

    return {
        subscribe,
        set,
        update,
        checkAndFetchUser
    };
}

export const user = createUserStore();
