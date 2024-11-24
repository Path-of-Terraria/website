<script lang="ts">
    import { onMount } from 'svelte';
    import { ModDataService } from '$lib/services/mod-data-service';
    import EditModal from '$lib/components/EditMobDataModal.svelte';
    import { Button } from 'flowbite-svelte';
    let modDataService = new ModDataService();
    import type { IMobData } from '$lib/models/mob-data';

    let mobData: IMobData[] = [];
    let filteredMobData: IMobData[] = [];
    let searchQuery: string = '';
    let error: string | null = null;
    let isEditModalOpen = false;
    let selectedMob: IMobData | null = null;

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

<div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">Mob Data</h1>

    <!-- Search Input and Save Button -->
    <div class="mb-4 flex items-center space-x-4">
        <div class="flex-grow">
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
                on:input={handleSearch}
                placeholder="Type to search by name..."
                class="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 dark:text-gray-400 focus:ring focus:ring-blue-300 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
            />
        </div>
        <Button color="green" on:click={exportMobData}>
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
                                <ul>
                                    {#each mob.entries as entry}
                                        <li class="my-2">
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
                                    on:click={() => openEditModal(mob)}
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