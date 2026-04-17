<script lang="ts">
    import { onMount } from 'svelte';
    import { ModDataService } from '$lib/services/mod-data-service';
    import EditModal from '$lib/components/EditMobDataModal.svelte';
    import { Button } from 'flowbite-svelte';
    let modDataService = new ModDataService();
    import type { IMobData } from '$lib/models/mob-data';

    let mobData: IMobData[] = $state([]);
    let filteredMobData: IMobData[] = $state([]);
    let searchQuery: string = $state('');
    let error: string | null = $state(null);
    let isEditModalOpen = $state(false);
    let selectedMob: IMobData | null = $state(null);

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
            filteredMobData = mobData.filter((mob) =>
                mob.friendlyName.toLowerCase().includes(query)
            );
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
</script>

<div class="container mx-auto px-4 py-24 text-white">
    <h1 class="mb-4 text-3xl font-black tracking-tight text-white">Mob Data</h1>

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
                placeholder="Type to search by name..."
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
                                                <div class="font-bold text-gray-100">Min Lvl: {damage.minLevel}</div>
                                                {#if damage.fire}
                                                    <div class="text-red-300">Fire: +{damage.fire.added}, {damage.fire.conversion * 100}% conv</div>
                                                {/if}
                                                {#if damage.lightning}
                                                    <div class="text-yellow-300">Light: +{damage.lightning.added}, {damage.lightning.conversion * 100}% conv</div>
                                                {/if}
                                                {#if damage.cold}
                                                    <div class="text-sky-300">Cold: +{damage.cold.added}, {damage.cold.conversion * 100}% conv</div>
                                                {/if}
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
                                            <div>
                                                <strong>Prefix:</strong> {entry.prefix || 'N/A'}
                                            </div>
                                            <div>
                                                <strong>Weight:</strong> {entry.weight}
                                            </div>
                                            <div>
                                                <strong>Stats:</strong> Level {entry.stats.level}, Experience {entry.stats.experience}
                                            </div>
                                            <div>
                                                <strong>Requirements:</strong> {entry.requirements}
                                            </div>
                                            {#if entry.damageOverrides && entry.damageOverrides.length > 0}
                                                <div class="mt-2 border-t border-white/8 pt-2">
                                                    <strong>Damage Overrides:</strong>
                                                    <ul class="text-xs">
                                                        {#each entry.damageOverrides as damage}
                                                            <li>
                                                                Lvl {damage.minLevel}:
                                                                {#if damage.fire} <span class="text-red-300">F</span> {/if}
                                                                {#if damage.lightning} <span class="text-yellow-300">L</span> {/if}
                                                                {#if damage.cold} <span class="text-sky-300">C</span> {/if}
                                                            </li>
                                                        {/each}
                                                    </ul>
                                                </div>
                                            {/if}
                                            {#if entry.affixes?.length > 0}
                                                <div>
                                                    <strong>Affixes:</strong>
                                                    <ul>
                                                        {#each entry.affixes as affix}
                                                            <li>{affix.name}</li>
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
    <EditModal {selectedMob} on:close={closeEditModal} on:save={saveMobData} />
{/if}
