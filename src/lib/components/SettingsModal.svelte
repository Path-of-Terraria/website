<script lang="ts">
    import {Button, Modal, Label, Input} from 'flowbite-svelte';
    import { env } from '$env/dynamic/public';

    let { open = $bindable(false), currentUser = $bindable(undefined as unknown as IUser) } = $props<{ open: boolean; currentUser: IUser }>();

    import {UserService} from "$lib/services/user-service";
    import { toast } from "$lib/toast";
    import type {IUser} from "$lib/stores/user-store";
    import steamSignin from "$lib/images/steam-signin.png";

    let userService = new UserService();

    const baseUrl = env.PUBLIC_API_BASE_URL;

    async function updateUser() {
        await userService.updateProfile(currentUser.profileName);
        open = false;
        toast.push("Updated Profile");
    }

    async function unlinkSteam() {
        await userService.unlinkSteam();
        toast.push("Steam Account Unlinked");
    }

    async function unlinkDiscord() {
        await userService.unlinkDiscord();
        toast.push("Discord Account Unlinked");
    }

</script>

<form onsubmit={async () => {
   await updateUser();
}}>
    <Modal title="Settings" bind:open={open} autoclose={false} form>
        <!-- Profile Settings Section -->
        <div class="mb-6 p-4 border border-gray-200 rounded-lg">
            <h3 class="text-lg font-semibold mb-3">Profile Settings</h3>
            <Label for="small-input" class="block mb-2">Profile Name</Label>
            <Input id="small-input" size="sm" placeholder="DrBibbityBob" bind:value={currentUser.profileName}/>
        </div>

        <!-- Account Linking Section -->
        <div class="mb-6 p-4 border border-gray-200 rounded-lg">
            <h3 class="text-lg font-semibold mb-4">Account Linking</h3>

            <!-- Steam Linking -->
            <div class="mb-4">
                {#if !currentUser.steamId}
                    <span class="block text-sm mb-2">Link Steam Account (This is required for Leaderboards)</span>
                    <a href="{baseUrl}LoginWithSteam?userId={currentUser.id}">
                        <img src={steamSignin} alt="steam signing">
                    </a>
                {:else}
                    <span class="block text-sm mb-2">
                        Steam Account {currentUser.steamId} Linked
                    </span>
                    <Button type="button" onclick={() => unlinkSteam()} color="red" size="sm">
                        Unlink Steam
                    </Button>
                {/if}
            </div>

            <!-- Discord Linking -->
            <div>
                {#if !currentUser.discordId}
                    <span class="block text-sm mb-2">Link Discord Account</span>
                    <Button
                        type="button"
                        onclick={() => {
                            const redirectUri = encodeURIComponent(env.PUBLIC_BASE_URL + 'discord');
                            window.location.href = `https://discord.com/oauth2/authorize?client_id=1089695863217074227&response_type=code&redirect_uri=${redirectUri}&scope=identify`;
                        }}
                        class="bg-[#5865F2] hover:bg-[#4752C4] text-white"
                        size="sm">
                        Connect Discord
                    </Button>
                {:else}
                    <span class="block text-sm mb-2">
                        Discord Account {currentUser.discordId} Linked
                    </span>
                    <Button type="button" onclick={() => unlinkDiscord()} color="red" size="sm">
                        Unlink Discord
                    </Button>
                {/if}
            </div>
        </div>

        {#snippet footer()}
            <div class="text-right">
                <Button type="submit">
                    Update
                </Button>
            </div>
        {/snippet}
    </Modal>
</form>
