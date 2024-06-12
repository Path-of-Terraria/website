import { writable } from 'svelte/store';
import {UserService} from "$lib/services/user-service";

export interface IUser {
    id: number;
    name: string;
    email: string;
    steamId: string;
}

function createUserStore() {
    const { subscribe, set, update } = writable(null);
    const userService = new UserService();
    const checkAndFetchUser = async () => {
        // Check if localStorage is available (only in the browser)
        if (typeof localStorage !== 'undefined') {
            return await userService.getUserProfile();
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
