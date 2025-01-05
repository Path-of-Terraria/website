import { writable } from 'svelte/store';

export interface IUser {
    id: number;
    name: string;
    email: string;
    steamId: string;
    profileName: string;
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
