<script lang="ts">
    import { onMount } from 'svelte';
    import { ModDataService } from '$lib/services/mod-data-service';
    import EditModal from '$lib/components/EditMobDataModal.svelte';
    import { Button } from 'flowbite-svelte';
    let modDataService = new ModDataService();
    import type { IDamageConfiguration, IMobData } from '$lib/models/mob-data';

    let mobData: IMobData[] = $state([]);
    let filteredMobData: IMobData[] = $state([]);
    let searchQuery: string = $state('');
    let error: string | null = $state(null);
    let isEditModalOpen = $state(false);
    let selectedMob: IMobData | null = $state(null);
    let prefixOptions = $derived.by(() => {
        const prefixes = new Set<string>();

        for (const mob of mobData) {
            for (const entry of mob.entries) {
                if (entry.prefix?.trim()) {
                    prefixes.add(entry.prefix.trim());
                }
            }
        }

        return [
            { value: '', label: '(No Prefix)' },
            ...Array.from(prefixes)
                .sort((a, b) => a.localeCompare(b))
                .map((prefix) => ({ value: prefix, label: prefix }))
        ];
    });

    let totalEntries = $derived(mobData.reduce((total, mob) => total + mob.entries.length, 0));
    let mobsWithDamage = $derived(mobData.filter((mob) => mob.damage?.length).length);
    let guaranteedAffixEntries = $derived(
        mobData.reduce((total, mob) => total + mob.entries.filter((entry) => entry.affixes?.length).length, 0)
    );

    onMount(() => {
        // Load mob data
        modDataService.getMobData().then((data) => {
            mobData = data;
            filteredMobData = [...mobData]; // Initialize filtered data with all mob data
        });
    });

    function handleSearch(event: Event) {
        const query = (event.target as HTMLInputElement).value.toLowerCase();
        searchQuery = query;

        if (!query) {
            filteredMobData = [...mobData];
        } else {
            filteredMobData = mobData.filter((mob) => getMobSearchText(mob).includes(query));
        }
    }

    function openEditModal(mob: IMobData) {
        selectedMob = mob;
        isEditModalOpen = true;
    }

    function closeEditModal() {
        isEditModalOpen = false;
        selectedMob = null;
    }

    function saveMobData(event: CustomEvent) {
        const { updatedMob } = event.detail;
        mobData = mobData.map(mob => mob.netId === updatedMob.netId ? updatedMob : mob);
        filteredMobData = [...mobData];
        closeEditModal();
    }

    async function exportMobData() {
        try {
            await modDataService.exportMobData(mobData);
        } catch (err) {
            error = 'Failed to export mob data';
        }
    }

    function getMobSearchText(mob: IMobData) {
        return [
            mob.friendlyName,
            mob.netId,
            ...mob.entries.flatMap((entry) => [
                entry.prefix,
                ...(entry.affixes?.map((affix) => affix.name) ?? [])
            ])
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
    }

    function getTotalEntryWeight(mob: IMobData) {
        return mob.entries.reduce((total, entry) => total + Number(entry.weight || 0), 0);
    }

    function getEntryChance(mob: IMobData, weight: number) {
        const totalWeight = getTotalEntryWeight(mob);

        if (!totalWeight || !weight) {
            return '0%';
        }

        return `${formatNumber((Number(weight) / totalWeight) * 100)}%`;
    }

    function formatNumber(value: number) {
        return value.toFixed(1).replace(/\.0$/, '');
    }

    function formatAdded(value?: number) {
        return value === undefined || value === null ? '0' : formatNumber(value);
    }

    function formatConversion(value?: number) {
        return `${formatNumber((value ?? 0) * 100)}%`;
    }

    interface DamageTypeDescription {
        label: string;
        textClass: string;
        description: string;
    }

    function describeDamageTypes(damage: IDamageConfiguration) {
        const types: DamageTypeDescription[] = [];

        if (damage.fire) {
            types.push({
                label: 'Fire',
                textClass: 'text-red-300',
                description: `Fire +${formatAdded(damage.fire.added)}, ${formatConversion(damage.fire.conversion)} conversion`
            });
        }

        if (damage.lightning) {
            types.push({
                label: 'Lightning',
                textClass: 'text-yellow-300',
                description: `Lightning +${formatAdded(damage.lightning.added)}, ${formatConversion(damage.lightning.conversion)} conversion`
            });
        }

        if (damage.cold) {
            types.push({
                label: 'Cold',
                textClass: 'text-sky-300',
                description: `Cold +${formatAdded(damage.cold.added)}, ${formatConversion(damage.cold.conversion)} conversion`
            });
        }

        if (damage.chaos) {
            types.push({
                label: 'Chaos',
                textClass: 'text-purple-300',
                description: `Chaos +${formatAdded(damage.chaos.added)}, ${formatConversion(damage.chaos.conversion)} conversion`
            });
        }

        return types;
    }
</script>

<div class="container mx-auto px-4 py-24 text-white">
    <h1 class="mb-4 text-3xl font-black tracking-tight text-white">Mob Data</h1>

    <section class="mb-6 rounded-[1.5rem] border border-white/10 bg-[#0a1016] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
        <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div>
                <p class="text-sm font-semibold uppercase tracking-[0.18em] text-sky-200">How to read this</p>
                <p class="mt-2 max-w-4xl text-sm leading-6 text-gray-300">
                    Each mob can have one or more weighted entries. The mod picks one entry by relative weight, applies its
                    prefix to the NPC name when present, then applies guaranteed affixes and any entry damage overrides.
                </p>
                <div class="mt-4 grid gap-3 text-sm text-gray-300 md:grid-cols-2">
                    <div class="rounded-xl border border-white/8 bg-white/[0.035] p-3">
                        <span class="font-semibold text-white">Damage rows:</span> the highest Min Level that is less than or
                        equal to the picked item/area level wins.
                    </div>
                    <div class="rounded-xl border border-white/8 bg-white/[0.035] p-3">
                        <span class="font-semibold text-white">Conversion values:</span> JSON stores fractions, so 0.25 is
                        shown here as 25%.
                    </div>
                    <div class="rounded-xl border border-white/8 bg-white/[0.035] p-3">
                        <span class="font-semibold text-white">Entry overrides:</span> when an entry has damage overrides,
                        those rows replace the global damage table for that spawn.
                    </div>
                    <div class="rounded-xl border border-white/8 bg-white/[0.035] p-3">
                        <span class="font-semibold text-white">Affixes:</span> listed affixes are guaranteed first; magic and
                        rare mobs can roll additional random mob affixes after that.
                    </div>
                </div>
            </div>
            <div class="grid min-w-[16rem] grid-cols-3 gap-3 text-sm">
                <div class="rounded-xl border border-white/10 bg-white/[0.045] p-3">
                    <div class="text-xs uppercase tracking-[0.14em] text-gray-400">Mobs</div>
                    <div class="mt-2 text-2xl font-black text-white">{mobData.length}</div>
                </div>
                <div class="rounded-xl border border-white/10 bg-white/[0.045] p-3">
                    <div class="text-xs uppercase tracking-[0.14em] text-gray-400">Entries</div>
                    <div class="mt-2 text-2xl font-black text-white">{totalEntries}</div>
                </div>
                <div class="rounded-xl border border-white/10 bg-white/[0.045] p-3">
                    <div class="text-xs uppercase tracking-[0.14em] text-gray-400">Prefixes</div>
                    <div class="mt-2 text-2xl font-black text-white">{prefixOptions.length - 1}</div>
                </div>
                <div class="col-span-3 grid grid-cols-2 gap-3">
                    <div class="rounded-xl border border-white/10 bg-white/[0.045] p-3">
                        <div class="text-xs uppercase tracking-[0.14em] text-gray-400">Mobs With Damage</div>
                        <div class="mt-2 text-2xl font-black text-white">{mobsWithDamage}</div>
                    </div>
                    <div class="rounded-xl border border-white/10 bg-white/[0.045] p-3">
                        <div class="text-xs uppercase tracking-[0.14em] text-gray-400">Affix Entries</div>
                        <div class="mt-2 text-2xl font-black text-white">{guaranteedAffixEntries}</div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Search Input and Save Button -->
    <div class="mb-6 flex items-end space-x-4">
        <div class="grow">
            <label
                for="search"
                class="mb-2 block text-sm font-medium text-gray-300"
            >
                Search Mobs
            </label>
            <input
                id="search"
                type="text"
                bind:value={searchQuery}
                oninput={handleSearch}
                placeholder="Search by name, prefix, or affix..."
                class="block w-full rounded-lg border border-white/10 bg-white/8 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-sky-400 focus:outline-hidden focus:ring-2 focus:ring-sky-400/30"
            />
        </div>
        <Button class="bg-emerald-500 text-white hover:bg-emerald-400" onclick={exportMobData}>
            Export
        </Button>
    </div>

    <!-- Error Message -->
    {#if error}
        <div class="text-red-500 mb-4">{error}</div>
    {/if}

    <!-- Mob Data Table -->
    {#if filteredMobData.length > 0}
        <div class="relative overflow-x-auto rounded-[1.5rem] border border-white/10 bg-[#0a1016] shadow-[0_18px_50px_rgba(0,0,0,0.3)]">
            <table class="w-full text-left text-sm text-gray-300">
                <thead class="bg-white/[0.04] text-xs uppercase text-gray-400">
                    <tr>
                        <th scope="col" class="px-6 py-3">Net ID</th>
                        <th scope="col" class="px-6 py-3">Name</th>
                        <th scope="col" class="px-6 py-3">Global Damage</th>
                        <th scope="col" class="px-6 py-3">Entries</th>
                        <th scope="col" class="px-6 py-3">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {#each filteredMobData as mob}
                        <tr class="border-t border-white/8 align-top transition-colors duration-150 hover:bg-white/[0.025]">
                            <td class="px-6 py-4 font-medium text-gray-200">{mob.netId}</td>
                            <td class="px-6 py-4 font-semibold text-white">{mob.friendlyName}</td>
                            <td class="px-6 py-4">
                                {#if mob.damage && mob.damage.length > 0}
                                    <ul class="text-xs">
                                        {#each mob.damage as damage}
                                            <li class="mb-2 rounded-lg border border-white/8 bg-white/[0.035] p-2">
                                                <div class="font-bold text-gray-100">Min Level {damage.minLevel}</div>
                                                <div class="mt-1 text-[11px] text-gray-400">Applies when picked level is {damage.minLevel} or higher, until a higher row qualifies.</div>
                                                <div class="mt-2 space-y-1">
                                                    {#each describeDamageTypes(damage) as damageType}
                                                        <div class={damageType.textClass}>{damageType.description}</div>
                                                    {/each}
                                                </div>
                                            </li>
                                        {/each}
                                    </ul>
                                {:else}
                                    <span class="text-gray-400 italic">None</span>
                                {/if}
                            </td>
                            <td class="px-6 py-4">
                                <ul>
                                    {#each mob.entries as entry}
                                        <li class="my-2 rounded-lg border border-white/8 bg-white/[0.035] p-3">
                                            <div class="flex flex-wrap items-start justify-between gap-3">
                                                <div>
                                                    <div class="font-bold text-white">{entry.prefix || '(No Prefix)'}</div>
                                                    <div class="mt-1 text-xs text-gray-400">Displayed before the mob name when present.</div>
                                                </div>
                                                <div class="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-sky-100">
                                                    {getEntryChance(mob, entry.weight)} chance
                                                </div>
                                            </div>
                                            <div class="mt-3 grid gap-2 text-xs">
                                                <div class="rounded-lg border border-white/8 bg-black/20 p-2">
                                                    <div class="uppercase tracking-[0.12em] text-gray-500">Weight</div>
                                                    <div class="mt-1 font-semibold text-white">{entry.weight} of {getTotalEntryWeight(mob)}</div>
                                                </div>
                                            </div>
                                            {#if entry.damageOverrides && entry.damageOverrides.length > 0}
                                                <div class="mt-2 border-t border-white/8 pt-2">
                                                    <strong>Damage Overrides:</strong>
                                                    <p class="mt-1 text-xs text-gray-400">These rows replace the global damage table for this entry.</p>
                                                    <ul class="mt-2 space-y-2 text-xs">
                                                        {#each entry.damageOverrides as damage}
                                                            <li class="rounded-lg border border-white/8 bg-black/20 p-2">
                                                                <div class="font-semibold text-white">Min Level {damage.minLevel}</div>
                                                                {#each describeDamageTypes(damage) as damageType}
                                                                    <div class={`mt-1 ${damageType.textClass}`}>{damageType.description}</div>
                                                                {/each}
                                                            </li>
                                                        {/each}
                                                    </ul>
                                                </div>
                                            {/if}
                                            {#if entry.affixes?.length > 0}
                                                <div>
                                                    <strong>Guaranteed Affixes:</strong>
                                                    <ul class="mt-1 flex flex-wrap gap-2 text-xs">
                                                        {#each entry.affixes as affix}
                                                            <li class="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-emerald-100">{affix.name}</li>
                                                        {/each}
                                                    </ul>
                                                </div>
                                            {/if}
                                        </li>
                                    {/each}
                                </ul>
                            </td>
                            <td class="px-6 py-4">
                                <button
                                    class="cursor-pointer text-sky-300 hover:text-sky-200 hover:underline"
                                    onclick={() => openEditModal(mob)}
                                >
                                    Edit
                                </button>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {:else}
        <p class="text-sm text-gray-400">No mobs found matching the search criteria.</p>
    {/if}
</div>

<!-- Edit Modal -->
{#if isEditModalOpen}
    <EditModal {selectedMob} {prefixOptions} on:close={closeEditModal} on:save={saveMobData} />
{/if}
