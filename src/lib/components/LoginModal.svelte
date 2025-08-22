<script lang="ts">
    import {Button, Modal, Label, Input} from 'flowbite-svelte';

    let modalOpen = $state(false);

    import {UserService} from "$lib/services/user-service";
    import {toast} from '$lib/toast'

    let userService = new UserService();

    let email = $state("");
    let password = $state("");
    let profileName = $state("");
    let view = $state("login");

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

    async function onaction() {
        console.log('test');
        if (view === 'login') {
            await login();
        } else if (view === 'register') {
            await signup();
        } else {
            await forgotPassword();
        }
    }
</script>

<Button onclick={() => (modalOpen = true)}>Login</Button>

<Modal form title="Login / Signup" bind:open={modalOpen} {onaction}>
    {#if view === 'register'}
        <div class="mb-4">
            <Label for="profile" class="block mb-2">Profile Name</Label>
            <Input id="profile" size="sm" placeholder="DrBibbityBob" bind:value={profileName}/>
        </div>
    {/if}
    <div class="mb-6">
        <Label for="email" class="block mb-2">Email</Label>
        <Input id="email" size="sm" placeholder="imsocool@example.com" bind:value={email}/>
    </div>
    {#if view !== 'forgot-password'}
        <div class="mb-6">
            <Label for="password" class="block mb-2">Password</Label>
            <Input type="password" id="password" size="sm" placeholder="password123" bind:value={password}/>
        </div>
    {/if}
    {#snippet footer()}
        <div class="flex justify-between w-full">
            <div class="inline-flex">
                <Button color="alternative" onclick={() => view = 'forgot-password'}>
                    Forgot Password
                </Button>
            </div>
            <div class="inline-flex">
                {#if view === 'login'}
                    <Button color="alternative" onclick={() => view = 'register'}>
                        Register Instead
                    </Button>
                    <Button value="accept" type="submit" disabled={!email || !password}>
                        Login
                    </Button>
                {:else if view === 'register'}
                    <Button color="alternative" onclick={() => view = 'login'}>
                        Signin Instead
                    </Button>
                    <Button value="accept" type="submit" disabled={!email || !password || !profileName}>
                        Signup
                    </Button>
                {:else}
                    <Button color="alternative" onclick={() => view = 'login'}>
                        Back to Login
                    </Button>
                    <Button value="accept" type="submit" disabled={!email}>
                        Send Reset Email
                    </Button>
                {/if}
            </div>
        </div>
    {/snippet}
</Modal>