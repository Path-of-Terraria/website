<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { GearFilter } from '$lib/services/trade-listing-service';
    import { TradeListingItemDataRarity } from '$lib/models/trade-listing';
    
    const dispatch = createEventDispatcher<{
        filter: GearFilter;
    }>();
    
    // Filter state
    let isExpanded = false;
    let filter: GearFilter = {
        name: '',
        typeName: '',
        rarity: undefined,
        type: undefined,
        isCorrupted: undefined,
        isMirrored: undefined,
        minStack: undefined,
        maxStack: undefined,
        affixName: '',
        affixMinTier: undefined,
        affixMinValue: undefined
    };
    
    // Item types (placeholder - replace with actual types from backend)
    const itemTypes = [
        { id: 0, name: 'None' },
        { id: 1, name: 'Sword' },
        { id: 2, name: 'Spear' },
        { id: 4, name: 'Bow' },
        { id: 8, name: 'Gun' },
        { id: 16, name: 'Staff' },
        { id: 32, name: 'Tome' },
        { id: 64, name: 'Helmet' },
        { id: 128, name: 'Chestplate' },
        { id: 256, name: 'Leggings' },
        { id: 512, name: 'Ring' },
        { id: 1024, name: 'Charm' },
        { id: 2048, name: 'Wand' },
        { id: 4096, name: 'Jewel' },
        { id: 8192, name: 'Map' },
        { id: 16384, name: 'Boomerang' },
        { id: 32768, name: 'MeleeFlail' },
        { id: 65536, name: 'RangedFlail' },
        { id: 131072, name: 'Launcher' },
        { id: 262144, name: 'Javelin' },
        { id: 524288, name: 'Whip' },
        { id: 1048576, name: 'WarShield' },
        { id: 2097152, name: 'Grimoire' },
        { id: 4194304, name: 'Battleaxe' },
        { id: 8388608, name: 'Amulet' },
        { id: 16777216, name: 'Shield' },

        // composite groups
        { id: 64 | 128 | 256, name: 'Armor' },
        { id: 8388608 | 1024 | 512, name: 'Accessories' },
        { id: (8388608 | 1024 | 512) | (64 | 128 | 256), name: 'Equipment' },
        { id: 16777216, name: 'Offhand' },
        { id: 4194304 | 1048576 | 32768 | 2 | 1, name: 'Melee' },
        { id: 2048 | 32 | 16, name: 'Magic' },
        { id: 262144 | 131072 | 65536 | 16384 | 8 | 4, name: 'Ranged' },
        { id: 2097152 | 524288, name: 'Summoner' },
        { id: (475148 | 2096 | 5249155 | 524288), name: 'Weapon' },
        { id: (6289215 | 8389568), name: 'AllGear' },
        { id: (14678783 | 4096), name: 'AllNoMap' },
        { id: (14682879 | 8192), name: 'All' }
    ];

    
    // Rarity options
    const rarityOptions = [
        { value: TradeListingItemDataRarity.Normal, label: 'Normal' },
        { value: TradeListingItemDataRarity.Magic, label: 'Magic' },
        { value: TradeListingItemDataRarity.Rare, label: 'Rare' },
        { value: TradeListingItemDataRarity.Unique, label: 'Unique' }
    ];
    
    function toggleExpand() {
        isExpanded = !isExpanded;
    }
    
    function applyFilter() {
        // Clean up empty string values
        const cleanFilter = { ...filter };
        
        // Remove empty string values
        Object.keys(cleanFilter).forEach(key => {
            if (cleanFilter[key] === '') {
                cleanFilter[key] = undefined;
            }
        });
        
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
            affixName: '',
            affixMinTier: undefined,
            affixMinValue: undefined
        };
        
        applyFilter();
    }
</script>

<div class="filter-panel bg-gray-800 rounded-lg shadow-md p-4 mb-6">
    <!-- Search bar (always visible) -->
    <div class="search-bar mb-4">
        <input 
            type="text" 
            bind:value={filter.name} 
            placeholder="Search by item name..." 
            class="w-full p-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:border-yellow-500 focus:outline-hidden"
        />
    </div>
    
    <!-- Collapsible section toggle -->
    <button 
        on:click={toggleExpand} 
        class="flex items-center justify-between w-full p-2 bg-gray-700 text-white rounded-md mb-4 hover:bg-gray-600"
    >
        <span class="font-medium">Advanced Filters</span>
        <span class="transform transition-transform {isExpanded ? 'rotate-180' : ''}">▼</span>
    </button>
    
    <!-- Collapsible filter section -->
    {#if isExpanded}
        <div class="filter-controls grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <!-- Item Type -->
            <div class="filter-group">
                <label class="block text-sm font-medium text-gray-300 mb-1">Item Type</label>
                <select 
                    bind:value={filter.type} 
                    class="w-full p-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:border-yellow-500 focus:outline-hidden"
                >
                    <option value={undefined}>Any</option>
                    {#each itemTypes as type}
                        <option value={type.id}>{type.name}</option>
                    {/each}
                </select>
            </div>
            
            <!-- Type Name -->
            <div class="filter-group">
                <label class="block text-sm font-medium text-gray-300 mb-1">Type Name</label>
                <input 
                    type="text" 
                    bind:value={filter.typeName} 
                    placeholder="e.g. Sword, Helmet..." 
                    class="w-full p-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:border-yellow-500 focus:outline-hidden"
                />
            </div>
            
            <!-- Rarity -->
            <div class="filter-group">
                <label class="block text-sm font-medium text-gray-300 mb-1">Rarity</label>
                <select 
                    bind:value={filter.rarity} 
                    class="w-full p-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:border-yellow-500 focus:outline-hidden"
                >
                    <option value={undefined}>Any</option>
                    {#each rarityOptions as option}
                        <option value={option.value}>{option.label}</option>
                    {/each}
                </select>
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
        <div class="filter-actions flex justify-end space-x-2">
            <button 
                on:click={resetFilter} 
                class="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
            >
                Reset
            </button>
            <button 
                on:click={applyFilter} 
                class="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
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