import { writable } from 'svelte/store';

export interface IUser {
    id: string;
    name: string;
    email: string;
    discordId: string;
    steamId: string;
    profileName: string;
    roles: string[];
    chatBanned: boolean;
    supporterPacks: string[];
    supporterSubscription: string;
    chosenBenefits: IChosenBenefits;
}

export interface IChosenBenefits {
    chatIcon: {
        value: string;
    };
    chatColor: {
        value: string;
    };
    discordRole: string;
}


export interface IUpdateMyBenefitsRequest {
    chatIcon: string;
    chatColor: string;
    discordRole: string;
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
