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
            return await login();
        } else if (view === 'register') {
            return await signup();
        } else {
            return await forgotPassword();
        }
    }
</script>

<Button class="cursor-pointer border-white/10 bg-white/8 text-white hover:bg-white/12" onclick={() => (modalOpen = true)}>Login</Button>

<Modal
    form
    title="Login / Signup"
    bind:open={modalOpen}
    {onaction}
    class="border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_30%),linear-gradient(180deg,rgba(17,24,39,0.98),rgba(9,14,24,0.97))] text-white shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop:bg-black/70"
    headerClass="border-b border-white/10 bg-white/[0.03] text-white"
    bodyClass="bg-transparent text-white"
    footerClass="border-t border-white/10 bg-white/[0.02]"
>
    {#if view === 'register'}
        <div class="mb-4">
            <Label for="profile" class="mb-2 block text-gray-300">Profile Name</Label>
            <Input id="profile" size="sm" placeholder="DrBibbityBob" bind:value={profileName} class="border-white/10 bg-white/8 text-white placeholder:text-gray-500"/>
        </div>
    {/if}
    <div class="mb-6">
        <Label for="email" class="mb-2 block text-gray-300">Email</Label>
        <Input required id="email" type="email" size="sm" placeholder="imsocool@example.com" bind:value={email} class="border-white/10 bg-white/8 text-white placeholder:text-gray-500"/>
    </div>
    {#if view !== 'forgot-password'}
        <div class="mb-6">
            <Label for="password" class="mb-2 block text-gray-300">Password</Label>
            <Input required type="password" id="password" size="sm" placeholder="password123" bind:value={password} class="border-white/10 bg-white/8 text-white placeholder:text-gray-500"/>
        </div>
    {/if}
    {#snippet footer()}
        <div class="flex justify-between w-full">
            <div class="inline-flex">
                <Button class="border-white/10 bg-white/8 text-gray-200 hover:bg-white/12 hover:text-white" onclick={() => view = 'forgot-password'}>
                    Forgot Password
                </Button>
            </div>
            <div class="inline-flex">
                {#if view === 'login'}
                    <Button class="border-white/10 bg-white/8 text-gray-200 hover:bg-white/12 hover:text-white" onclick={() => view = 'register'}>
                        Register Instead
                    </Button>
                    <Button value="accept" type="submit" class="bg-emerald-500 text-white hover:bg-emerald-400" disabled={!email || !password}>
                        Login
                    </Button>
                {:else if view === 'register'}
                    <Button class="border-white/10 bg-white/8 text-gray-200 hover:bg-white/12 hover:text-white" onclick={() => view = 'login'}>
                        Signin Instead
                    </Button>
                    <Button value="accept" type="submit" class="bg-emerald-500 text-white hover:bg-emerald-400" disabled={!email || !password || !profileName}>
                        Signup
                    </Button>
                {:else}
                    <Button class="border-white/10 bg-white/8 text-gray-200 hover:bg-white/12 hover:text-white" onclick={() => view = 'login'}>
                        Back to Login
                    </Button>
                    <Button value="accept" type="submit" class="bg-emerald-500 text-white hover:bg-emerald-400" disabled={!email}>
                        Send Reset Email
                    </Button>
                {/if}
            </div>
        </div>
    {/snippet}
</Modal>
