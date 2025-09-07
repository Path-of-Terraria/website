<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { UserService } from '$lib/services/user-service';
    import { toast } from '$lib/toast';
    import { goto } from '$app/navigation';

    let userService = new UserService();

    onMount(async () => {
        const code = $page.url.searchParams.get('code');
        
        if (code) {
            try {
                await userService.linkDiscord(code);
                toast.push('Discord account linked successfully!');
                goto('/'); // Redirect to home page after successful linking
            } catch (error) {
                console.error('Error linking Discord:', error);
                toast.push('Failed to link Discord account');
                goto('/'); // Redirect to home page even on error
            }
        } else {
            toast.push('No authorization code provided');
            goto('/'); // Redirect if no code parameter
        }
    });
</script>

<div class="flex items-center justify-center min-h-screen">
    <div class="text-center">
        <h1 class="text-2xl font-bold mb-4">Linking Discord Account...</h1>
        <p class="text-gray-600">Please wait while we link your Discord account.</p>
    </div>
</div>