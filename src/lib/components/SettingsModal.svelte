<script lang="ts">
    import {Button, Modal, Label, Input, DropdownItem} from 'flowbite-svelte';

    export let open = false;
    export let currentUser: IUser;

    import {UserService} from "$lib/services/user-service";
    import {toast} from "@zerodevx/svelte-toast";
    import type {IUser} from "$lib/stores/user-store";
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
</script>

<form on:submit={async (e) => {
   await updateUser();
}}>
    <Modal title="Settings" bind:open={open} autoclose={false}>
        <div class="mb-4">
            <Label for="small-input" class="block mb-2">Profile Name</Label>
            <Input id="small-input" size="sm" placeholder="DrBibbityBob" bind:value={currentUser.profileName}/>
        </div>
        <svelte:fragment slot="footer">
            <div class="text-right">
                <Button type="submit">
                    Update
                </Button>
            </div>
        </svelte:fragment>
    </Modal>
</form>