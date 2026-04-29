<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { GearFilter } from '$lib/services/trade-listing-service';
    import { TradeListingItemDataRarity } from '$lib/models/trade-listing';
    import { tradeItemTypeOptions } from '$lib/trade/item-types';

    const dispatch = createEventDispatcher<{
        filter: GearFilter;
    }>();

    // Filter state
    let isExpanded = $state(false);
    let filter: GearFilter = $state({
        name: '',
        typeName: '',
        rarity: undefined,
        type: undefined,
        isCorrupted: undefined,
        isMirrored: undefined,
        minStack: undefined,
        maxStack: undefined,
        minItemLevel: undefined,
        maxItemLevel: undefined,
        affixName: '',
        affixMinTier: undefined,
        affixMinValue: undefined
    });

    // Rarity options
    const rarityOptions = [
        { value: TradeListingItemDataRarity.Normal, label: 'Normal' },
        { value: TradeListingItemDataRarity.Magic, label: 'Magic' },
        { value: TradeListingItemDataRarity.Rare, label: 'Rare' },
        { value: TradeListingItemDataRarity.Unique, label: 'Unique' }
    ];

    const fieldClass = 'w-full rounded-xl border border-white/10 bg-[#0a1016]/80 px-3 py-2 text-sm text-white shadow-inner shadow-black/20 outline-none transition placeholder:text-gray-500 focus:border-emerald-300/50 focus:ring-2 focus:ring-emerald-300/15';
    const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-gray-400';

    function toggleExpand() {
        isExpanded = !isExpanded;
    }

    function applyFilter() {
        const cleanFilter = Object.fromEntries(
            Object.entries(filter).filter(([, value]) => value !== '' && value !== null && value !== undefined)
        ) as GearFilter;

        dispatch('filter', cleanFilter);
    }

    function resetFilter() {
        filter = {
            name: '',
            typeName: '',
            rarity: undefined,
            type: undefined,
            isCorrupted: undefined,
            isMirrored: undefined,
            minStack: undefined,
            maxStack: undefined,
            minItemLevel: undefined,
            maxItemLevel: undefined,
            affixName: '',
            affixMinTier: undefined,
            affixMinValue: undefined
        };

        applyFilter();
    }
</script>

<div class="filter-panel mb-5 rounded-[1.5rem] border border-white/10 bg-[#0a1016]/72 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.26)] md:p-4">
    <!-- Top bar: Search and Toggle -->
    <div class="mb-4 flex flex-col gap-3 md:flex-row">
        <!-- Search bar -->
        <div class="search-bar flex flex-1 gap-2">
            <input
                type="text"
                bind:value={filter.name}
                onkeydown={(e) => e.key === 'Enter' && applyFilter()}
                placeholder="Search by item name..."
                class="{fieldClass} flex-1"
            />
            <button
                onclick={applyFilter}
                class="rounded-xl bg-gradient-to-r from-indigo-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/10 ring-1 ring-white/10 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
                Search
            </button>
        </div>

        <!-- Collapsible section toggle -->
        <button
            onclick={toggleExpand}
            class="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-white transition-colors hover:bg-white/[0.08] md:w-auto md:min-w-[190px]"
        >
            <span class="font-medium">Advanced Filters</span>
            <span class="transform text-xs text-emerald-200 transition-transform {isExpanded ? 'rotate-180' : ''}">▼</span>
        </button>
    </div>

    <!-- Collapsible filter section -->
    {#if isExpanded}
        <div class="filter-controls mb-4 grid grid-cols-1 gap-4 border-t border-white/10 pt-4 md:grid-cols-2">
            <!-- Item Type -->
            <div class="filter-group">
                <label class={labelClass} for="trade-item-type">Item Type</label>
                <select
                    id="trade-item-type"
                    bind:value={filter.type}
                    class={fieldClass}
                >
                    <option value={undefined}>Any</option>
                    {#each tradeItemTypeOptions as type}
                        <option value={type.id}>{type.name}</option>
                    {/each}
                </select>
            </div>

            <!-- Rarity -->
            <div class="filter-group">
                <label class={labelClass} for="trade-rarity">Rarity</label>
                <select
                    id="trade-rarity"
                    bind:value={filter.rarity}
                    class={fieldClass}
                >
                    <option value={undefined}>Any</option>
                    {#each rarityOptions as option}
                        <option value={option.value}>{option.label}</option>
                    {/each}
                </select>
            </div>

            <!-- Item Level -->
            <div class="filter-group">
                <div class={labelClass}>Item Level</div>
                <div class="flex gap-2">
                    <input
                        type="number"
                        bind:value={filter.minItemLevel}
                        onkeydown={(e) => e.key === 'Enter' && applyFilter()}
                        placeholder="Min"
                        min="0"
                        class="{fieldClass} w-1/2"
                    />
                    <input
                        type="number"
                        bind:value={filter.maxItemLevel}
                        onkeydown={(e) => e.key === 'Enter' && applyFilter()}
                        placeholder="Max"
                        min="0"
                        class="{fieldClass} w-1/2"
                    />
                </div>
            </div>

            <!-- Stack Size -->
<!--            <div class="filter-group">-->
<!--                <label class="block text-sm font-medium text-gray-300 mb-1">Stack Size</label>-->
<!--                <div class="flex space-x-2">-->
<!--                    <input -->
<!--                        type="number" -->
<!--                        bind:value={filter.minStack} -->
<!--                        placeholder="Min" -->
<!--                        class="w-1/2 p-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:border-yellow-500 focus:outline-hidden"-->
<!--                    />-->
<!--                    <input -->
<!--                        type="number" -->
<!--                        bind:value={filter.maxStack} -->
<!--                        placeholder="Max" -->
<!--                        class="w-1/2 p-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:border-yellow-500 focus:outline-hidden"-->
<!--                    />-->
<!--                </div>-->
<!--            </div>-->

            <!-- Item Properties -->
<!--            <div class="filter-group">-->
<!--                <label class="block text-sm font-medium text-gray-300 mb-1">Corrupted/Mirrored</label>-->
<!--                <div class="flex space-x-4">-->
<!--                    <label class="inline-flex items-center">-->
<!--                        <input -->
<!--                            type="checkbox" -->
<!--                            bind:checked={filter.isCorrupted} -->
<!--                            class="form-checkbox h-4 w-4 text-yellow-500 rounded-sm focus:ring-yellow-500 border-gray-600 bg-gray-700"-->
<!--                        />-->
<!--                        <span class="ml-2 text-gray-300">Corrupted</span>-->
<!--                    </label>-->
<!--                    <label class="inline-flex items-center">-->
<!--                        <input -->
<!--                            type="checkbox" -->
<!--                            bind:checked={filter.isMirrored} -->
<!--                            class="form-checkbox h-4 w-4 text-yellow-500 rounded-sm focus:ring-yellow-500 border-gray-600 bg-gray-700"-->
<!--                        />-->
<!--                        <span class="ml-2 text-gray-300">Mirrored</span>-->
<!--                    </label>-->
<!--                </div>-->
<!--            </div>-->

            <!-- Affix Name -->
<!--            <div class="filter-group">-->
<!--                <label class="block text-sm font-medium text-gray-300 mb-1">Affix Name</label>-->
<!--                <input -->
<!--                    type="text" -->
<!--                    bind:value={filter.affixName} -->
<!--                    placeholder="e.g. of Power, Sharpness..." -->
<!--                    class="w-full p-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:border-yellow-500 focus:outline-hidden"-->
<!--                />-->
<!--            </div>-->
<!--            -->
<!--            &lt;!&ndash; Affix Min Tier &ndash;&gt;-->
<!--            <div class="filter-group">-->
<!--                <label class="block text-sm font-medium text-gray-300 mb-1">Affix Min Tier</label>-->
<!--                <input -->
<!--                    type="number" -->
<!--                    bind:value={filter.affixMinTier} -->
<!--                    placeholder="1-5" -->
<!--                    min="1"-->
<!--                    class="w-full p-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:border-yellow-500 focus:outline-hidden"-->
<!--                />-->
<!--            </div>-->
<!--            -->
<!--            &lt;!&ndash; Affix Min Value &ndash;&gt;-->
<!--            <div class="filter-group">-->
<!--                <label class="block text-sm font-medium text-gray-300 mb-1">Affix Min Value</label>-->
<!--                <input -->
<!--                    type="number" -->
<!--                    bind:value={filter.affixMinValue} -->
<!--                    placeholder="Min value" -->
<!--                    step="0.1"-->
<!--                    class="w-full p-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:border-yellow-500 focus:outline-hidden"-->
<!--                />-->
<!--            </div>-->
        </div>

        <!-- Filter action buttons -->
        <div class="filter-actions flex justify-end gap-2 border-t border-white/10 pt-4">
            <button
                onclick={resetFilter}
                class="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-gray-200 transition-colors hover:bg-white/[0.08] hover:text-white"
            >
                Reset
            </button>
            <button
                onclick={applyFilter}
                class="rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/10 ring-1 ring-white/10 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
                Apply Filters
            </button>
        </div>
    {/if}
</div>

<style>
    /* Add any additional component-specific styles here */
    .filter-panel {
        transition: all 0.3s ease;
    }
</style>
