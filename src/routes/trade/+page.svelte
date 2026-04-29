<script lang="ts">
    import { onMount } from "svelte";

    import {TradeListingService, type GearFilter} from "$lib/services/trade-listing-service";
    import TradeListing from "$lib/components/TradeListing.svelte";
    import FilterPanel from "$lib/components/FilterPanel.svelte";
    import type {ITradeListing} from "$lib/models/trade-listing";

    const pageSize = 20;
    type ListingDisplay = 'single' | 'double';
    
    let tradeListingService = new TradeListingService();
    let currentFilter: GearFilter = {};
    let listingDisplay: ListingDisplay = $state('double');
    let isFiltering = $state(false);
    let listings: ITradeListing[] = $state([]);
    let currentPage = $state(1);
    let hasMore = $state(true);
    let isLoading = $state(false);
    let isInitialLoading = $state(true);
    let loadError = $state(false);
    let loadMoreTrigger: HTMLDivElement;
    let requestVersion = 0;

    const activeFilterCount = $derived(
        Object.values(currentFilter).filter(value => value !== undefined && value !== '' && value !== null).length
    );
    
    onMount(() => {
        const savedDisplay = localStorage.getItem('tradeListingDisplay');
        if (savedDisplay === 'single' || savedDisplay === 'double') {
            listingDisplay = savedDisplay;
        }

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
        const hasFilter = activeFilterCount > 0;
        
        isFiltering = hasFilter;
        loadTradeListings(true);
    }

    function setListingDisplay(display: ListingDisplay) {
        listingDisplay = display;
        localStorage.setItem('tradeListingDisplay', display);
    }
</script>

<svelte:head>
    <title>Trade | Path of Terraria</title>
    <meta
            name="description"
            content="Browse Path of Terraria trade listings and filter gear by item type, rarity, and level."
    />
</svelte:head>

<div class="relative -mt-20 min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(151,255,120,0.10),transparent_22%),linear-gradient(180deg,#090c12_0%,#111827_30%,#10191c_62%,#10191c_100%)] pt-20 text-white">
    <div class="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>
    <div class="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-gradient-to-br from-lime-400/25 via-emerald-400/12 to-sky-400/8 blur-3xl"></div>
    <div class="pointer-events-none absolute top-10 right-0 h-96 w-96 rounded-full bg-gradient-to-br from-cyan-400/16 via-indigo-400/10 to-transparent blur-3xl"></div>
    <div class="pointer-events-none absolute top-80 left-1/2 h-72 w-[48rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500/14 via-emerald-400/10 to-sky-400/14 blur-3xl"></div>
    <div class="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-black/10 to-transparent"></div>

    <section class="relative">
        <div class="container mx-auto px-4 pb-14 pt-16 md:pb-20 md:pt-20">
            <div class="mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between">
                <div>
                    <div class="mb-3 inline-flex rounded-full border border-emerald-300/18 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">
                        Marketplace
                    </div>
                    <h1 class="text-3xl font-black tracking-tight text-white md:text-5xl">
                        Trade
                    </h1>
                    <p class="mt-3 max-w-2xl text-sm leading-6 text-gray-300 md:text-base">
                        Search current listings, narrow by gear type, and find upgrades posted by other players.
                    </p>
                </div>

                <div class="grid grid-cols-2 gap-3 sm:flex">
                    <div class="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.22)]">
                        <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Shown</div>
                        <div class="mt-1 text-xl font-black text-white">{listings.length}</div>
                    </div>
                    <div class="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.22)]">
                        <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Filters</div>
                        <div class="mt-1 text-xl font-black text-white">{activeFilterCount}</div>
                    </div>
                </div>
            </div>

            <div class="rounded-[2rem] bg-gradient-to-br from-amber-300/14 via-emerald-300/8 to-cyan-300/12 p-[1px] shadow-[0_20px_90px_rgba(0,0,0,0.28)]">
                <div class="rounded-[calc(2rem-1px)] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.07),transparent_30%),linear-gradient(180deg,rgba(17,24,39,0.96),rgba(9,14,24,0.94))] p-4 ring-1 ring-white/10 backdrop-blur-sm md:p-5">
                    <FilterPanel on:filter={handleFilter} />

                    <div class="mb-4 flex flex-col gap-3 rounded-[1.25rem] border border-white/10 bg-[#0a1016]/52 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div class="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Display Options</div>
                            <div class="mt-1 text-sm text-gray-300">Choose how many listings appear per row on desktop.</div>
                        </div>

                        <div class="inline-flex w-full rounded-xl border border-white/10 bg-white/[0.04] p-1 sm:w-auto">
                            <button
                                    type="button"
                                    aria-pressed={listingDisplay === 'single'}
                                    onclick={() => setListingDisplay('single')}
                                    class="flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors sm:flex-none {listingDisplay === 'single' ? 'bg-white/10 text-white shadow-[0_8px_20px_rgba(0,0,0,0.2)]' : 'text-gray-300 hover:bg-white/[0.06] hover:text-white'}"
                            >
                                1x1
                            </button>
                            <button
                                    type="button"
                                    aria-pressed={listingDisplay === 'double'}
                                    onclick={() => setListingDisplay('double')}
                                    class="flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors sm:flex-none {listingDisplay === 'double' ? 'bg-white/10 text-white shadow-[0_8px_20px_rgba(0,0,0,0.2)]' : 'text-gray-300 hover:bg-white/[0.06] hover:text-white'}"
                            >
                                2x2
                            </button>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 gap-4 {listingDisplay === 'double' ? 'md:grid-cols-2' : ''}">
                        {#if isInitialLoading}
                            <div class="col-span-full rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-12 text-center text-gray-300">
                                <div class="animate-pulse text-sm font-semibold uppercase tracking-[0.18em]">Fetching trades</div>
                            </div>
                        {:else if loadError && listings.length === 0}
                            <div class="col-span-full rounded-2xl border border-red-300/20 bg-red-400/10 px-5 py-12 text-center text-red-100">
                                Failed to load trades
                            </div>
                        {:else}
                            {#if listings.length === 0}
                                <div class="col-span-full rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-12 text-center text-gray-300">
                                    <div class="text-lg font-semibold text-white">No trades found</div>
                                    {#if isFiltering}
                                        <p class="mt-2 text-sm text-gray-400">Try adjusting your filters.</p>
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
                                <div class="col-span-full rounded-2xl border border-red-300/20 bg-red-400/10 px-5 py-4 text-center text-red-100">
                                    Failed to load more trades
                                </div>
                            {/if}

                            {#if isLoading && listings.length > 0}
                                <div class="col-span-full rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-center text-gray-300">
                                    <div class="animate-pulse text-sm font-semibold uppercase tracking-[0.18em]">Fetching more trades</div>
                                </div>
                            {/if}
                        {/if}

                        <div bind:this={loadMoreTrigger} class="col-span-full h-1"></div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</div>
