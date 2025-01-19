<script lang="ts">
    import {Heading, TableBodyCell, TableBodyRow} from "flowbite-svelte";

    import {TradeListingService} from "$lib/services/trade-listing-service";
    import TradeListing from "$lib/components/TradeListing.svelte";
    import type {ITradeListing} from "$lib/models/trade-listing";

    let tradeListingService = new TradeListingService();

    let tradesPromise: Promise<ITradeListing[]> = getTradeListings();
    async function getTradeListings() {
        return await tradeListingService.getTradeListings();
    }
</script>

<div class="header">
    <div class="container mx-auto mt-8">
        <Heading tag="h1" class="mb-4" customSize="text-1xl font-extrabold  md:text-3xl lg:text-4xl">
            Trade
        </Heading>
    </div>
</div>
<div class="container mx-auto mt-12">
    <div class="grid grid-cols-2 gap-4">
        {#await tradesPromise}
            Fetching Trades
        {:then listings}
            {#if listings.length === 0}
                No Trades Found
            {:else}
                {#each listings as listing}
                    <div class="mx-auto">
                        <TradeListing listing={listing}></TradeListing>
                    </div>
                {/each}
            {/if}
        {:catch someError}
            Failed to load trades
        {/await}
    </div>
</div>