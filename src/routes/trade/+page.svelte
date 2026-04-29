<script lang="ts">
    import { onMount } from "svelte";
    import {Heading} from "flowbite-svelte";

    import {TradeListingService, type GearFilter} from "$lib/services/trade-listing-service";
    import TradeListing from "$lib/components/TradeListing.svelte";
    import FilterPanel from "$lib/components/FilterPanel.svelte";
    import type {ITradeListing} from "$lib/models/trade-listing";

    const pageSize = 20;
    
    let tradeListingService = new TradeListingService();
    let currentFilter: GearFilter = {};
    let isFiltering = $state(false);
    let listings: ITradeListing[] = $state([]);
    let currentPage = $state(1);
    let hasMore = $state(true);
    let isLoading = $state(false);
    let isInitialLoading = $state(true);
    let loadError = $state(false);
    let loadMoreTrigger: HTMLDivElement;
    let requestVersion = 0;
    
    onMount(() => {
        loadTradeListings(true);
        
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    loadTradeListings();
                }
            },
            { rootMargin: '400px 0px' }
        );
        
        if (loadMoreTrigger) {
            observer.observe(loadMoreTrigger);
        }
        
        return () => observer.disconnect();
    });
    
    async function loadTradeListings(reset = false) {
        if (isLoading && !reset || !hasMore && !reset) {
            return;
        }
        
        if (reset) {
            requestVersion++;
            currentPage = 1;
            listings = [];
            hasMore = true;
            loadError = false;
            isInitialLoading = true;
        }
        
        const version = requestVersion;
        const pageToLoad = currentPage;
        isLoading = true;
        
        try {
            const nextListings = isFiltering
                ? await tradeListingService.getFilteredTrades(currentFilter, pageToLoad, pageSize)
                : await tradeListingService.getTradeListings(pageToLoad, pageSize);
            
            if (version !== requestVersion) {
                return;
            }
            
            listings = pageToLoad === 1
                ? nextListings
                : [...listings, ...nextListings.filter(next => !listings.some(existing => existing.id === next.id))];
            currentPage = pageToLoad + 1;
            hasMore = nextListings.length === pageSize;
        } catch (error) {
            if (version === requestVersion) {
                loadError = true;
            }
        } finally {
            if (version === requestVersion) {
                isLoading = false;
                isInitialLoading = false;
            }
        }
    }
    
    function handleFilter(event: CustomEvent<GearFilter>) {
        currentFilter = event.detail;
        
        // Check if any filter is applied
        const hasFilter = Object.values(currentFilter).some(value => 
            value !== undefined && value !== '' && value !== null
        );
        
        isFiltering = hasFilter;
        loadTradeListings(true);
    }
</script>

<div class="header text-white">
    <div class="container mx-auto px-4 pt-24">
        <Heading tag="h1" class="mb-4 text-3xl font-black tracking-tight text-white">
            Trade
        </Heading>
    </div>
</div>
<div class="container mx-auto mt-12 px-4 text-gray-200">
    <!-- Filter Panel -->
    <FilterPanel on:filter={handleFilter} />
    
    <!-- Trade Listings -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#if isInitialLoading}
            <div class="col-span-full text-center py-8 text-gray-400">
                <div class="animate-pulse">Fetching Trades...</div>
            </div>
        {:else if loadError && listings.length === 0}
            <div class="col-span-full text-center py-8 text-red-400">
                Failed to load trades
            </div>
        {:else}
            {#if listings.length === 0}
                <div class="col-span-full text-center py-8 text-gray-400">
                    No Trades Found
                    {#if isFiltering}
                        <p class="mt-2 text-sm">Try adjusting your filters</p>
                    {/if}
                </div>
            {:else}
                {#each listings as listing}
                    <div class="mx-auto w-full">
                        <TradeListing listing={listing}></TradeListing>
                    </div>
                {/each}
            {/if}
            
            {#if loadError && listings.length > 0}
                <div class="col-span-full text-center py-4 text-red-400">
                    Failed to load more trades
                </div>
            {/if}
            
            {#if isLoading && listings.length > 0}
                <div class="col-span-full text-center py-4 text-gray-400">
                    <div class="animate-pulse">Fetching more trades...</div>
                </div>
            {/if}
        {/if}
        
        <div bind:this={loadMoreTrigger} class="col-span-full h-1"></div>
    </div>
</div>
