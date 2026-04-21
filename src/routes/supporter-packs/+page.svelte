<script lang="ts">
    import {PaymentService, LeaguePackType, type LeaguePacksResponse} from "$lib/services/payment-service";
    import {onMount} from "svelte";
    import { Card, Button, Heading, P, Spinner } from 'flowbite-svelte';

    let supporterPacks = $state<LeaguePacksResponse[]>([]);
    let subscriptionPacks = $state<LeaguePacksResponse[]>([]);
    let oneTimePacks = $state<LeaguePacksResponse[]>([]);
    let loading = $state(true);
    let error = $state<string | null>(null);
    let checkoutLoading = $state<string | null>(null); // Track which pack is being processed

    const paymentService = new PaymentService();

    // Format price from cents to dollars (e.g., 2499 -> $24.99)
    function formatPrice(priceInCents: number): string {
        return `$${(priceInCents / 100).toFixed(2)}`;
    }

    // Handle purchase/subscription click
    async function handleCheckout(packId: string, packName: string) {
        try {
            checkoutLoading = packId;
            const checkoutResponse = await paymentService.createCheckout(packId);
            
            if (checkoutResponse) {
                // Redirect to the checkout URL
                window.location.href = checkoutResponse.url;
            } else {
                throw new Error('No checkout URL returned');
            }
        } catch (err) {
            console.error(`Error creating checkout for ${packName}:`, err);
            alert(`Failed to start checkout for ${packName}. Please try again.`);
        } finally {
            checkoutLoading = null;
        }
    }

    onMount(async () => {
        try {
            supporterPacks = await paymentService.getSupporterPacks();
            
            // Split packs by type and sort by price (cheapest first)
            subscriptionPacks = supporterPacks
                .filter(pack => pack.type === LeaguePackType.Subscription)
                .sort((a, b) => (a.price || 0) - (b.price || 0));
            
            oneTimePacks = supporterPacks
                .filter(pack => pack.type === LeaguePackType.OneTime)
                .sort((a, b) => (a.price || 0) - (b.price || 0));
            
            loading = false;
        } catch (err) {
            error = 'Failed to load supporter packs';
            loading = false;
            console.error('Error loading supporter packs:', err);
        }
    });
</script>

<div class="container mx-auto px-4 py-24 text-white">
    {#if loading}
        <div class="flex items-center justify-center">
            <Spinner class="mr-3 text-white" size="4" />
            <P class="text-gray-200" size="lg">Loading supporter packs...</P>
        </div>
    {:else if error}
        <div class="flex items-center justify-center">
            <P color="red" size="lg">{error}</P>
        </div>
    {:else}
        <div class="max-w-6xl mx-auto">
            <Heading tag="h1" class="mb-8 text-center text-white">Supporter Packs</Heading>

            <!-- One-Time League Purchases Section -->
            {#if oneTimePacks.length > 0}
                <section class="mb-12">
                    <Heading tag="h2" class="mb-6 text-white">League Packs</Heading>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {#each oneTimePacks as pack}
                            <Card class="border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.07),transparent_30%),linear-gradient(180deg,rgba(17,24,39,0.96),rgba(9,14,24,0.94))] p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
                                <Heading tag="h3" class="mb-3 text-white">{pack.name}</Heading>
                                <P class="mb-4 text-gray-300">{pack.description}</P>
                                {#if pack.price}
                                    <P class="mb-4 text-lg font-semibold text-emerald-300">
                                        {formatPrice(pack.price)}
                                    </P>
                                {/if}
                                {#if pack.marketingFeatures && pack.marketingFeatures.length > 0}
                                    <ul class="mb-4 list-disc list-inside text-sm text-gray-300">
                                        {#each pack.marketingFeatures as feature}
                                            <li>{feature}</li>
                                        {/each}
                                    </ul>
                                {/if}
                                <Button 
                                    class="w-full cursor-pointer" 
                                    onclick={() => handleCheckout(pack.id, pack.name)}
                                    disabled={checkoutLoading === pack.id}
                                >
                                    {checkoutLoading === pack.id ? 'Processing...' : 'Purchase'}
                                </Button>
                            </Card>
                        {/each}
                    </div>
                </section>
            {/if}

            <!-- Subscription Packs Section -->
            {#if subscriptionPacks.length > 0}
                <section>
                    <Heading tag="h2" class="mb-6 text-white">Subscriptions</Heading>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {#each subscriptionPacks as pack}
                            <Card class="border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.07),transparent_30%),linear-gradient(180deg,rgba(17,24,39,0.96),rgba(9,14,24,0.94))] p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
                                <Heading tag="h3" class="mb-3 text-2xl text-white">{pack.name}</Heading>
                                <P class="mb-4 text-gray-300">{pack.description}</P>
                                {#if pack.price}
                                    <P class="mb-4 text-lg font-semibold text-emerald-300">
                                        {formatPrice(pack.price)}/month
                                    </P>
                                {/if}
                                {#if pack.marketingFeatures && pack.marketingFeatures.length > 0}
                                    <ul class="mb-4 list-disc list-inside text-sm text-gray-300">
                                        {#each pack.marketingFeatures as feature}
                                            <li>{feature}</li>
                                        {/each}
                                    </ul>
                                {/if}
                                <Button 
                                    class="w-full cursor-pointer" 
                                    onclick={() => handleCheckout(pack.id, pack.name)}
                                    disabled={checkoutLoading === pack.id}
                                >
                                    {checkoutLoading === pack.id ? 'Processing...' : 'Subscribe'}
                                </Button>
                            </Card>
                        {/each}
                    </div>
                </section>
            {/if}

            {#if subscriptionPacks.length === 0 && oneTimePacks.length === 0}
                <div class="text-center">
                    <P class="text-gray-400">No supporter packs available at the moment.</P>
                </div>
            {/if}
        </div>
    {/if}
</div>
