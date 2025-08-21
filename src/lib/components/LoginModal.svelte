<script lang="ts">
    import {Button, Modal, Label, Input} from 'flowbite-svelte';

    let modalOpen = false;

    import {UserService} from "$lib/services/user-service";
    import {toast} from '@zerodevx/svelte-toast'

    let userService = new UserService();

    let email = "";
    let password = "";
    let profileName = "";
    let view = "login";

    async function signup() {
        await userService.signup(email, password, profileName);
        toast.push("Account created");
    }

    async function login() {
        await userService.login(email, password);
        modalOpen = false;
    }

    async function forgotPassword() {
        await userService.forgotPassword(email);
        toast.push("If an account exists, an email will be sent with a reset link");
    }
</script>

<Button onclick={() => (modalOpen = true)}>Login</Button>
<form on:submit={async (e) => {
   if (view === 'login') {
       await login();
    } else if (view === 'register') {
        await signup();
    } else {
        await forgotPassword();
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
        { #if view !== 'forgot-password'}
            <div class="mb-6">
                <Label for="small-input" class="block mb-2">Password</Label>
                <Input type="password" id="small-input" size="sm" placeholder="password123" bind:value={password}/>
            </div>
        {/if}
        <svelte:fragment slot="footer">
            <div class="flex justify-between w-full">
                <div class="inline-flex">
                    <Button color="alternative" onclick={() => view = 'forgot-password'}>
                        Forgot Password
                    </Button>
                </div>
                <div class="inline-flex">
                    {#if view === 'login' }
                        <Button color="alternative" onclick={() => view = 'register'}>
                            Register Instead
                        </Button>
                        <Button type="submit" disabled={!email || !password}>
                            Login
                        </Button>
                    {:else if view === 'register'}
                        <Button color="alternative" onclick={() => view = 'login'}>
                            Signin Instead
                        </Button>
                        <Button type="submit" disabled={!email || !password || !profileName}>
                            Signup
                        </Button>
                    {:else}
                        <Button color="alternative" onclick={() => view = 'login'}>
                            Back to Login
                        </Button>
                        <Button type="submit" disabled={!email}>
                            Send Reset Email
                        </Button>
                    {/if}
                </div>
            </div>
        </svelte:fragment>
    </Modal>
</form>