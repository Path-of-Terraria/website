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
    <div class="mb-4 flex items-center space-x-4">
        <div class="grow">
            <label
                for="search"
                class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
                Search Mobs
            </label>
            <input
                id="search"
                type="text"
                bind:value={searchQuery}
                oninput={handleSearch}
                placeholder="Type to search by name..."
                class="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 dark:text-gray-400 focus:ring-3 focus:ring-blue-300 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
            />
        </div>
        <Button color="green" onclick={exportMobData}>
            Export
        </Button>
    </div>

    <!-- Error Message -->
    {#if error}
        <div class="text-red-500 mb-4">{error}</div>
    {/if}

    <!-- Mob Data Table -->
    {#if filteredMobData.length > 0}
        <div class="overflow-x-auto relative shadow-md sm:rounded-lg">
            <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
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
                        <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                            <td class="px-6 py-4">{mob.netId}</td>
                            <td class="px-6 py-4">{mob.friendlyName}</td>
                            <td class="px-6 py-4">
                                {#if mob.damage && mob.damage.length > 0}
                                    <ul class="text-xs">
                                        {#each mob.damage as damage}
                                            <li class="mb-1 p-1 border rounded bg-gray-50 dark:bg-gray-700">
                                                <div class="font-bold">Min Lvl: {damage.minLevel}</div>
                                                {#if damage.fire}
                                                    <div class="text-red-600">Fire: +{damage.fire.added}, {damage.fire.conversion * 100}% conv</div>
                                                {/if}
                                                {#if damage.lightning}
                                                    <div class="text-yellow-600">Light: +{damage.lightning.added}, {damage.lightning.conversion * 100}% conv</div>
                                                {/if}
                                                {#if damage.cold}
                                                    <div class="text-blue-600">Cold: +{damage.cold.added}, {damage.cold.conversion * 100}% conv</div>
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
                                        <li class="my-2 p-2 border rounded bg-white dark:bg-gray-800">
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
                                                <div class="mt-1 pt-1 border-t">
                                                    <strong>Damage Overrides:</strong>
                                                    <ul class="text-xs">
                                                        {#each entry.damageOverrides as damage}
                                                            <li>
                                                                Lvl {damage.minLevel}:
                                                                {#if damage.fire} <span class="text-red-600">F</span> {/if}
                                                                {#if damage.lightning} <span class="text-yellow-600">L</span> {/if}
                                                                {#if damage.cold} <span class="text-blue-600">C</span> {/if}
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
                                    class="text-blue-500 hover:underline"
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
        <p class="text-gray-500 text-sm">No mobs found matching the search criteria.</p>
    {/if}
</div>

<!-- Edit Modal -->
{#if isEditModalOpen}
    <EditModal {selectedMob} on:close={closeEditModal} on:save={saveMobData} />
{/if}
