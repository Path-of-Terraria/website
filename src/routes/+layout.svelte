<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import './styles.css';
	import Toaster from '$lib/components/Toaster.svelte';
    import {onMount} from "svelte";
    import {user} from "$lib/stores/user-store.js";
    import {toast} from "$lib/toast.js";
	export const ssr = false;
	export const prerender = true;
	export const trailingSlash = 'always';

    import { UserService } from "$lib/services/user-service";
    let userService: UserService | null = null;

    onMount(async () => {
        // construct the service only in the browser
        userService = new UserService();

        try {
            const response = await userService.getUserProfile();
            // @ts-ignore
            user.set(response ?? null);
        } catch (e) {
            console.error("getUserProfile failed", e);
            user.set(null);
        }

        // safe in browser
        const url = new URL(window.location.href);
        const userId = url.searchParams.get("userId");
        if (userId) {
            url.searchParams.delete("userId");
            window.history.replaceState({}, document.title, url.toString());
            toast.push("We linked your Steam account to your Path of Terraria account.");
        }
    });
</script>
<Toaster />
<div class="app">
	<Header />
	
	<main>
		<slot />
	</main>
</div>
