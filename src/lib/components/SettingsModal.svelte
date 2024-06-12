<script lang="ts">
    import {Button, Modal, Label, Input, DropdownItem} from 'flowbite-svelte';

    export let open = false;
    export let currentUser: IUser;

    import {UserService} from "$lib/services/user-service";
    import {toast} from "@zerodevx/svelte-toast";
    import type {IUser} from "$lib/stores/user-store";
    import steamSignin from "$lib/images/steam-signin.png";
    let userService = new UserService();

    let email = ""
    let password = ""
    let profileName = ""
    let view = "login";

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

<form on:submit={async (e) => {
   await updateUser();
}}>
    <Modal title="Settings" bind:open={open} autoclose={false}>
        <div class="mb-9">
            <Label for="small-input" class="block mb-2">Profile Name</Label>
            <Input id="small-input" size="sm" placeholder="DrBibbityBob" bind:value={currentUser.profileName}/>
        </div>
        {#if !currentUser.steamId}
            <span class="block text-sm">Link Steam Account (This is required for Leaderboards)</span>
            <a href="http://localhost:5000/LoginWithSteam?userId={currentUser.id}">
                <img src={steamSignin} alt="steam signing">
            </a>
        {:else }
            <span class="block text-sm">
                Steam Account {currentUser.steamId} Linked
                <div>
                    <Button type="button" on:click={() => unlinkSteam()}>
                        Unlink Steam
                    </Button>
                </div>
            </span>
        {/if}
        <svelte:fragment slot="footer">
            <div class="text-right">
                <Button type="submit">
                    Update
                </Button>
            </div>
        </svelte:fragment>
    </Modal>
</form>