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
    <Modal
        title="Settings"
        bind:open={open}
        autoclose={false}
        form
        class="border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_30%),linear-gradient(180deg,rgba(17,24,39,0.98),rgba(9,14,24,0.97))] text-white shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop:bg-black/70"
        headerClass="border-b border-white/10 bg-white/[0.03] text-white"
        bodyClass="bg-transparent text-white"
        footerClass="border-t border-white/10 bg-white/[0.02]"
    >
        <!-- Profile Settings Section -->
        <div class="mb-6 rounded-xl border border-white/10 bg-white/[0.035] p-4">
            <h3 class="mb-3 text-lg font-semibold text-white">Profile Settings</h3>
            <Label for="small-input" class="mb-2 block text-gray-300">Profile Name</Label>
            <Input id="small-input" size="sm" placeholder="DrBibbityBob" bind:value={currentUser.profileName} class="border-white/10 bg-white/8 text-white placeholder:text-gray-500"/>
        </div>

        <!-- Account Linking Section -->
        <div class="mb-6 rounded-xl border border-white/10 bg-white/[0.035] p-4">
            <h3 class="mb-4 text-lg font-semibold text-white">Account Linking</h3>

            <!-- Steam Linking -->
            <div class="mb-4">
                {#if !currentUser.steamId}
                    <span class="mb-2 block text-sm text-gray-300">Link Steam Account (This is required for Leaderboards)</span>
                    <a href="{baseUrl}LoginWithSteam?userId={currentUser.id}">
                        <img src={steamSignin} alt="steam signing">
                    </a>
                {:else}
                    <span class="mb-2 block text-sm text-gray-300">
                        Steam Account {currentUser.steamId} Linked
                    </span>
                    <Button type="button" onclick={() => unlinkSteam()} class="border-red-400/20 bg-red-400/12 text-red-100 hover:bg-red-400/18" size="sm">
                        Unlink Steam
                    </Button>
                {/if}
            </div>

            <!-- Discord Linking -->
            <div>
                {#if !currentUser.discordId}
                    <span class="mb-2 block text-sm text-gray-300">Link Discord Account</span>
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
                    <span class="mb-2 block text-sm text-gray-300">
                        Discord Account {currentUser.discordId} Linked
                    </span>
                    <Button type="button" onclick={() => unlinkDiscord()} class="border-red-400/20 bg-red-400/12 text-red-100 hover:bg-red-400/18" size="sm">
                        Unlink Discord
                    </Button>
                {/if}
            </div>
        </div>

        {#snippet footer()}
            <div class="text-right">
                <Button type="submit" class="bg-emerald-500 text-white hover:bg-emerald-400">
                    Update
                </Button>
            </div>
        {/snippet}
    </Modal>
</form>
