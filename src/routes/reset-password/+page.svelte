<script lang="ts">
    import { Heading, Label, Input, Button } from 'flowbite-svelte';

    import {UserService} from "$lib/services/user-service";
    import { toast } from '$lib/toast'
    import {onMount} from "svelte";
    import {goto} from "$app/navigation";

    let userService = new UserService();

    let tokenQueryParam: string | null = '';
    let email = $state("");
    let password = $state("");
    let confirmPassword = $state("");

    onMount(() => {
        tokenQueryParam = new URLSearchParams(window.location.search).get('token');
        if (!tokenQueryParam) {
            toast.push("Missing token");
            goto("/");
            return;
        }
    });

    async function resetPassword() {
        if (password !== confirmPassword) {
            toast.push("Passwords do not match");
            return;
        }
        await userService.resetPassword(email, tokenQueryParam as string, password);
        toast.push("Password Reset");
        goto("/");
    }
</script>

<div class="container mx-auto mt-16 px-4 py-24 text-white">
    <div class="mx-auto max-w-lg rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(130,216,255,0.09),transparent_32%),linear-gradient(180deg,rgba(17,28,41,0.96),rgba(9,15,25,0.94))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.32)] sm:p-8">
    <Heading tag="h2" class="text-center text-white">
        Reset Password
    </Heading>
    <form class="mt-8" onsubmit={async (e) => {
       e.preventDefault();
       await resetPassword();
    }}>
        <div class="mb-6">
            <Label for="small-input" class="mb-2 block text-gray-300">Email</Label>
            <Input id="small-input" size="sm" placeholder="imsocool@example.com" bind:value={email} class="border-white/10 bg-white/8 text-white placeholder:text-gray-500"/>
        </div>
        <div class="mb-6">
            <Label for="small-input" class="mb-2 block text-gray-300">Password</Label>
            <Input type="password" id="small-input" size="sm" placeholder="password123" bind:value={password} class="border-white/10 bg-white/8 text-white placeholder:text-gray-500"/>
        </div>
        <div class="mb-6">
            <Label for="small-input" class="mb-2 block text-gray-300">Confirm Password</Label>
            <Input type="password" id="small-input" size="sm" placeholder="password123" bind:value={confirmPassword} class="border-white/10 bg-white/8 text-white placeholder:text-gray-500"/>
        </div>
        <div class="w-full text-right">
            <Button type="submit" disabled={!email || !password || !confirmPassword}>
                Reset Password
            </Button>
        </div>
    </form>
    </div>
</div>
