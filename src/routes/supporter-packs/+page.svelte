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

<div class="container mx-auto py-16 px-4">
    {#if loading}
        <div class="flex items-center justify-center">
            <Spinner class="mr-3" size="4" />
            <P size="lg">Loading supporter packs...</P>
        </div>
    {:else if error}
        <div class="flex items-center justify-center">
            <P color="red" size="lg">{error}</P>
        </div>
    {:else}
        <div class="max-w-6xl mx-auto">
            <Heading tag="h1" class="text-center mb-8">Supporter Packs</Heading>

            <!-- One-Time League Purchases Section -->
            {#if oneTimePacks.length > 0}
                <section class="mb-12">
                    <Heading tag="h2" class="mb-6">League Packs</Heading>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {#each oneTimePacks as pack}
                            <Card class="p-6">
                                <Heading tag="h3" class="mb-3">{pack.name}</Heading>
                                <P class="mb-4" color="text-gray-600">{pack.description}</P>
                                {#if pack.price}
                                    <P class="mb-4 text-lg font-semibold" color="green">
                                        {formatPrice(pack.price)}
                                    </P>
                                {/if}
                                {#if pack.marketingFeatures && pack.marketingFeatures.length > 0}
                                    <ul class="list-disc list-inside text-sm text-gray-700 dark:text-gray-400 mb-4">
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
                    <Heading tag="h2" class="mb-6">Subscriptions</Heading>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {#each subscriptionPacks as pack}
                            <Card class="p-6">
                                <Heading tag="h3" class="mb-3 text-2xl">{pack.name}</Heading>
                                <P class="mb-4" color="text-gray-600">{pack.description}</P>
                                {#if pack.price}
                                    <P class="mb-4 text-lg font-semibold" color="green">
                                        {formatPrice(pack.price)}/month
                                    </P>
                                {/if}
                                {#if pack.marketingFeatures && pack.marketingFeatures.length > 0}
                                    <ul class="list-disc list-inside text-sm text-gray-700 dark:text-gray-400 mb-4">
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
                    <P color="text-gray-500">No supporter packs available at the moment.</P>
                </div>
            {/if}
        </div>
    {/if}
</div>
