<script lang="ts">
    import { Heading, Label, Input, Button } from 'flowbite-svelte';

    import {UserService} from "$lib/services/user-service";
    import { toast } from '$lib/toast'
    import {onMount} from "svelte";
    import {goto} from "$app/navigation";

    let userService = new UserService();

    let tokenQueryParam: string | null = '';
    let email = "";
    let password = "";
    let confirmPassword = "";

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

<div class="container mx-auto mt-16">
    <Heading tag="h2" class="text-center">
        Reset Password
    </Heading>
    <form onsubmit={async (e) => {
       await resetPassword();
    }}>
        <div class="mb-6">
            <Label for="small-input" class="block mb-2">Email</Label>
            <Input id="small-input" size="sm" placeholder="imsocool@example.com" bind:value={email}/>
        </div>
        <div class="mb-6">
            <Label for="small-input" class="block mb-2">Password</Label>
            <Input type="password" id="small-input" size="sm" placeholder="password123" bind:value={password}/>
        </div>
        <div class="mb-6">
            <Label for="small-input" class="block mb-2">Confirm Password</Label>
            <Input type="password" id="small-input" size="sm" placeholder="password123" bind:value={confirmPassword}/>
        </div>
        <div class="text-right w-full">
            <Button type="submit" disabled="{!email || !password || !confirmPassword}">
                Reset Password
            </Button>
        </div>
    </form>
</div>