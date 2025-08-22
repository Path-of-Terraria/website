<script lang="ts">
    import {Button, Modal, Label, Input, DropdownItem} from 'flowbite-svelte';

    let { open = $bindable(false), currentUser = $bindable(undefined as unknown as IUser) } = $props<{ open: boolean; currentUser: IUser }>();

    import {UserService} from "$lib/services/user-service";
    import { toast } from "$lib/toast";
    import type {IUser} from "$lib/stores/user-store";
    import steamSignin from "$lib/images/steam-signin.png";

    let userService = new UserService();

    async function updateUser() {
        await userService.updateProfile(currentUser.profileName);
        open = false;
        toast.push("Updated Profile");
    }

    async function unlinkSteam() {
        await userService.unlinkSteam();
        toast.push("Steam Account Unlinked");
    }

</script>

<form onsubmit={async (e) => {
   await updateUser();
}}>
    <Modal title="Settings" bind:open={open} autoclose={false} form>
        <div class="mb-9">
            <Label for="small-input" class="block mb-2">Profile Name</Label>
            <Input id="small-input" size="sm" placeholder="DrBibbityBob" bind:value={currentUser.profileName}/>
        </div>
        {#if !currentUser.steamId}
            <span class="block text-sm">Link Steam Account (This is required for Leaderboards)</span>
            <a href="{import.meta.env.VITE_API_BASE_URL}LoginWithSteam?userId={currentUser.id}">
                <img src={steamSignin} alt="steam signing">
            </a>
        {:else}
            <span class="block text-sm">
                Steam Account {currentUser.steamId} Linked
                <Button class="block" type="button" onclick={() => unlinkSteam()}>
                    Unlink Steam
                </Button>
            </span>
        {/if}

        {#snippet footer()}
            <div class="text-right">
                <Button type="submit">
                    Update
                </Button>
            </div>
        {/snippet}
    </Modal>
</form>