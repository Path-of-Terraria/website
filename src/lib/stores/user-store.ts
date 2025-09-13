import { writable } from 'svelte/store';

export interface IUser {
    id: string;
    name: string;
    email: string;
    discordId: string;
    steamId: string;
    profileName: string;
    roles: string[];
    supporterPacks: string[];
    supporterSubscription: string;
}

function createUserStore() {
    const { subscribe, set, update } = writable(null);

    return {
        subscribe,
        set,
        update,
    };
}

export const user = createUserStore();
