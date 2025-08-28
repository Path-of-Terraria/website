<script lang="ts">
    import {Heading, TableBodyCell, TableBodyRow} from "flowbite-svelte";

    import {TradeListingService, type GearFilter} from "$lib/services/trade-listing-service";
    import TradeListing from "$lib/components/TradeListing.svelte";
    import FilterPanel from "$lib/components/FilterPanel.svelte";
    import type {ITradeListing} from "$lib/models/trade-listing";

    let tradeListingService = new TradeListingService();
    let currentFilter: GearFilter = {};
    let isFiltering = $state(false);

    let tradesPromise: Promise<ITradeListing[]> = $state(getTradeListings());
    
    async function getTradeListings() {
        if (isFiltering) {
            return await tradeListingService.getFilteredTrades(currentFilter);
        } else {
            return await tradeListingService.getTradeListings();
        }
    }
    
    function handleFilter(event: CustomEvent<GearFilter>) {
        currentFilter = event.detail;
        
        // Check if any filter is applied
        const hasFilter = Object.values(currentFilter).some(value => 
            value !== undefined && value !== '' && value !== null
        );
        
        isFiltering = hasFilter;
        tradesPromise = getTradeListings();
    }
</script>

<div class="header">
    <div class="container mx-auto mt-8">
        <Heading tag="h1" class="mb-4" customSize="text-1xl font-extrabold  md:text-3xl lg:text-4xl">
            Trade
        </Heading>
    </div>
</div>
<div class="container mx-auto mt-8">
    <!-- Filter Panel -->
    <FilterPanel on:filter={handleFilter} />
    
    <!-- Trade Listings -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#await tradesPromise}
            <div class="col-span-full text-center py-8 text-gray-400">
                <div class="animate-pulse">Fetching Trades...</div>
            </div>
        {:then listings}
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
        {:catch someError}
            <div class="col-span-full text-center py-8 text-red-400">
                Failed to load trades
            </div>
        {/await}
    </div>
</div>