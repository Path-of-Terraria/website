<script lang="ts">
    import type { IMobData } from "$lib/models/mob-data";
    import { createEventDispatcher } from 'svelte';
    import { Accordion, AccordionItem } from 'flowbite-svelte';

    let { selectedMob = null } = $props<{ selectedMob?: IMobData | null }>();
    const dispatch = createEventDispatcher();

    function closeModal() {
        dispatch('close');
    }

    function saveChanges() {
        dispatch('save', { updatedMob: selectedMob });
        closeModal();
    }

    function addEntry() {
        if (selectedMob) {
            selectedMob.entries = [
                ...selectedMob.entries,
                {
                    prefix: '',
                    weight: 0,
                    stats: { level: 0, experience: 0 },
                    requirements: '',
                    affixes: []
                }
            ];
        }
    }

    function deleteEntry(index: number) {
        if (selectedMob) {
            selectedMob.entries = selectedMob.entries.filter((_, i) => i !== index);
        }
    }

    function updateEntry(index: number, field: string, value: any) {
        if (selectedMob) {
            selectedMob.entries[index][field] = value;
            selectedMob.entries = [...selectedMob.entries];
        }
    }
</script>

<div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
    <div class="bg-white p-4 rounded-lg shadow-lg w-1/2">
        <h2 class="text-xl font-bold mb-4">Edit Mob Data</h2>
        <p>Editing data for: {selectedMob?.friendlyName}</p>

        {#if selectedMob}
            <div class="mb-4">
                <button class="text-blue-500 hover:underline" onclick={addEntry}>Add Entry</button>
            </div>

            <Accordion>
                {#each selectedMob.entries as entry, index}
                    <AccordionItem>
                        <span slot="header">
                            {selectedMob?.friendlyName} Entry {index + 1} - {entry.prefix}
                        </span>
                        <div class="mb-4 border p-2 rounded-sm">
                            <div class="mb-2">
                                <label class="block text-sm font-medium text-gray-700">Prefix</label>
                                <input type="text" class="block w-full mt-1" bind:value={entry.prefix} on:input={(e) => updateEntry(index, 'prefix', e.target?.value)} />
                            </div>
                            <div class="mb-2">
                                <label class="block text-sm font-medium text-gray-700">Weight</label>
                                <input type="number" class="block w-full mt-1" bind:value={entry.weight} on:input={(e) => updateEntry(index, 'weight', e.target?.value)} />
                            </div>
                            <div class="mb-2">
                                <label class="block text-sm font-medium text-gray-700">Level</label>
                                <input type="number" class="block w-full mt-1" bind:value={entry.stats.level} on:input={(e) => updateEntry(index, 'stats.level', e.target?.value)} />
                            </div>
                            <div class="mb-2">
                                <label class="block text-sm font-medium text-gray-700">Experience</label>
                                <input type="number" class="block w-full mt-1" bind:value={entry.stats.experience} on:input={(e) => updateEntry(index, 'stats.experience', e.target?.value)} />
                            </div>
                            <div class="mb-2">
                                <label class="block text-sm font-medium text-gray-700">Requirements</label>
                                <input type="text" class="block w-full mt-1" bind:value={entry.requirements} on:input={(e) => updateEntry(index, 'requirements', e.target?.value)} />
                            </div>
                            <button class="text-red-500 hover:underline" onclick={() => deleteEntry(index)}>Delete Entry</button>
                        </div>
                    </AccordionItem>
                {/each}
            </Accordion>
        {/if}

        <div class="mt-4 flex justify-end space-x-4">
            <button class="text-blue-500 hover:underline" onclick={closeModal}>Cancel</button>
            <button class="text-blue-500 hover:underline" onclick={saveChanges}>Save</button>
        </div>
    </div>
</div>