<script lang="ts">
    import {Button, Modal, Label, Input } from 'flowbite-svelte';

    let modalOpen = false;

    import {UserService} from "$lib/services/user-service";
    import { toast } from '@zerodevx/svelte-toast'

    let userService = new UserService();

    let email = ""
    let password = ""
    let profileName = ""
    let view = "login";

    async function signup() {
        await userService.signup(email, password, profileName);
        toast.push("Account created");
    }

    async function login() {
        await userService.login(email, password);
        modalOpen = false;
    }
</script>

<Button on:click={() => (modalOpen = true)}>Login</Button>
<form on:submit={async (e) => {
   if (view === 'login') {
       await login();
    } else {
        await signup();
    }
}}>
    <Modal title="Login / Signup" bind:open={modalOpen} autoclose={false}>
        { #if view === 'register'}
            <div class="mb-4">
                <Label for="small-input" class="block mb-2">Profile Name</Label>
                <Input id="small-input" size="sm" placeholder="DrBibbityBob" bind:value={profileName}/>
            </div>
        {/if}
        <div class="mb-6">
            <Label for="small-input" class="block mb-2">Email</Label>
            <Input id="small-input" size="sm" placeholder="imsocool@example.com" bind:value={email}/>
        </div>
        <div class="mb-6">
            <Label for="small-input" class="block mb-2">Password</Label>
            <Input type="password" id="small-input" size="sm" placeholder="password123" bind:value={password}/>
        </div>
        <svelte:fragment slot="footer">
            <div class="text-right">
                {#if view === 'login' }
                    <Button type="submit" disabled={!email || !password}>
                        Login
                    </Button>
                    <Button color="alternative" on:click={() => view = 'register'}>
                        Register Instead
                    </Button>
                {:else}
                    <Button type="submit" disabled={!email || !password || !profileName}>
                        Signup
                    </Button>
                    <Button color="alternative" on:click={() => view = 'login'}>
                        Signin Instead
                    </Button>
                {/if}
            </div>
        </svelte:fragment>
    </Modal>
</form>