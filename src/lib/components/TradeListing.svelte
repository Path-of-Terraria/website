<script lang="ts">
    import {type ITradeListing, TradeListingItemDataRarity} from "$lib/models/trade-listing";
    import { toast } from "$lib/toast";
    import {UserService} from "$lib/services/user-service";
    import {TradeListingService} from "$lib/services/trade-listing-service";
    import { tradeItemTypeNames } from "$lib/trade/item-types";

    let userService = new UserService();
    let tradeListingService = new TradeListingService();

    let { listing } = $props<{ listing: ITradeListing }>();

    const currencyNames = [
        "Glittering Shard", // GlitteringShard = 0
        "Unfolding Shard",  // UnfoldingShard = 1
        "Glimmering Shard", // GlimmeringShard = 2
        "Limpid Shard",     // LimpidShard = 3
        "Radiant Shard",    // RadiantShard = 4
        "Echoing Shard",    // EchoingShard = 5
        "Corruption Shard", // CorruptionShard = 6
        "Shifting Shard", // ShiftingShard 7
        "Mystic Shard", // MysticShard = 8,
    ];

    const rarityTexts = [
        "Normal",
        "Magic",
        "Rare",
        "Unique",
    ]

    const rarityClasses = [
        "text-gray-300 border-gray-300/20 bg-gray-300/10",
        "text-sky-200 border-sky-300/20 bg-sky-300/10",
        "text-amber-200 border-amber-300/20 bg-amber-300/10",
        "text-emerald-200 border-emerald-300/20 bg-emerald-300/10",
    ]

    const itemTypeLabel = $derived(
        listing?.itemData.type !== undefined
            ? tradeItemTypeNames[listing.itemData.type]
            : undefined
    );

    async function requestBuy() {
        const user = await userService.getUserProfile();
        if (user == null) {
            toast.push('You must be logged in to buy items');
            return;
        }
        return await tradeListingService.requestTradeListingSold(listing.id, user.steamId);
    }
</script>

<article class="trade-listing-card group flex h-full flex-col gap-4 rounded-[1.5rem] border border-white/10 bg-[#0a1016]/72 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.26)] transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300/20 hover:bg-[#0d151d]/82 sm:flex-row">
    <!-- Middle Section: Item Details -->
    <div class="min-w-0 grow text-center sm:text-left">
        <h3 class="truncate text-lg font-semibold text-white">
            {listing?.itemData.name}
        </h3>
        <div class="mt-1 flex flex-wrap justify-center gap-2 sm:justify-start">
            <p class="inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold {rarityClasses[listing?.itemData.rarity] ?? rarityClasses[0]}">
                {rarityTexts[listing?.itemData.rarity]}
            </p>
            {#if itemTypeLabel}
                <p class="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-xs font-semibold text-cyan-100">
                    {itemTypeLabel}
                </p>
            {/if}
        </div>
        {#if listing?.itemData.itemLevel > 0}
            <p class="mt-2 text-xs text-gray-400">
                Item Level <span class="text-gray-200">{listing?.itemData.itemLevel}</span>
            </p>
        {/if}

        <ul class="mt-3 space-y-1 text-sm text-gray-300">
            {#each listing?.itemData.properties as property}
                <li class="rounded-lg bg-white/[0.025] px-2 py-1">
                    <span>{property.name}</span>
                    {#if listing?.itemData.rarity !== TradeListingItemDataRarity.Unique}
                        <span class="text-amber-300">
                            (Tier {property.tier})
                        </span>
                    {/if}
                </li>
            {/each}
        </ul>
    </div>

    <!-- Right Section: Price and Actions -->
    <div class="flex shrink-0 flex-row items-center justify-between gap-3 border-t border-white/10 pt-3 sm:min-w-36 sm:flex-col sm:items-end sm:justify-start sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
        <div class="text-left sm:text-right">
        <div class="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
            Exact Price:
        </div>
        <div class="mt-1 text-base font-semibold text-amber-200 sm:text-lg">
            {listing?.amount} {currencyNames[listing?.currency]}
        </div>
        </div>

        <div class="flex gap-2 sm:mt-4">
            <button
                    class="cursor-pointer rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/10 ring-1 ring-white/10 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    type="button"
                    onclick={() => requestBuy()}
            >
                Buy
            </button>
<!--            <Button class="bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium px-4 py-1.5 rounded-sm">-->
<!--                Offer-->
<!--            </Button>-->
        </div>
    </div>
</article>
