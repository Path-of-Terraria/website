<script lang="ts">
    import {type ITradeListing} from "$lib/models/trade-listing";
    import placeholder from '$lib/images/item-placeholder.png';

    export let listing: ITradeListing;

    const currencyNames = [
        "Glittering Shard",
        "Unfolding Shard",
        "Glimmering Shard",
        "Limpid Shard",
        "Radiant Shard",
        "Echoing Shard",
        "Corruption Shard",
    ];

    const rarityTexts = [
        "Normal",
        "Magic",
        "Rare",
        "Unique",
    ]

    const rarityColors = [
        "gray-300",
        "blue-300",
        "yellow-300",
        "green-300",
    ]
</script>

<div class="trade-listing-card bg-gray-800 rounded-lg shadow-md flex p-4 gap-4">
    <!-- Left Section: Item Image -->
    <div class="flex-shrink-0 flex items-center">
        <img
                src="{placeholder}"
                alt="{listing?.itemData.name}"
                class="w-16 h-16 rounded-md object-cover"
        />
    </div>

    <!-- Middle Section: Item Details -->
    <div class="flex-grow text-center">
        <h3 class="text-lg font-semibold text-yellow-300">
            {listing?.itemData.name}
        </h3>
        <p class="text-sm text-{rarityColors[listing?.itemData.rarity]}">
          {rarityTexts[listing?.itemData.rarity]}
        </p>

        <ul class="text-sm text-gray-300 mt-2 space-y-1">
            {#each listing?.itemData.properties as property}
                <li>
                    <span>{property.name}</span>
                    <span class="text-blue-300"> +{property.value}</span>
                    <span class="text-yellow-400"> (Tier {property.affixTier})</span>
                </li>
            {/each}
        </ul>
    </div>

    <!-- Right Section: Price and Actions -->
    <div class="flex flex-col items-end">
        <div class="text-sm text-gray-400">
          Exact Price:
        </div>
        <div class="text-lg font-semibold text-yellow-300">
            {listing?.amount} {currencyNames[listing?.currency]}
        </div>

        <div class="mt-4 flex gap-2">
            <button class="bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-4 py-1.5 rounded">
                Buy
            </button>
            <button class="bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium px-4 py-1.5 rounded">
                Offer
            </button>
        </div>
    </div>
</div>