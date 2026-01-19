<script lang="ts">
    import type { IMobData, IDamageConfiguration, IDamageDetail } from "$lib/models/mob-data";
    import { createEventDispatcher } from 'svelte';
    import { Accordion, AccordionItem, Button, Input, Label, Heading, Helper } from 'flowbite-svelte';

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

    function addDamageConfig(target: 'global' | number) {
        if (!selectedMob) return;
        const newConfig: IDamageConfiguration = { minLevel: 1 };
        if (target === 'global') {
            selectedMob.damage = [...(selectedMob.damage || []), newConfig];
        } else {
            selectedMob.entries[target].damageOverrides = [...(selectedMob.entries[target].damageOverrides || []), newConfig];
        }
    }

    function removeDamageConfig(target: 'global' | number, index: number) {
        if (!selectedMob) return;
        if (target === 'global') {
            selectedMob.damage = selectedMob.damage?.filter((_, i) => i !== index);
        } else {
            selectedMob.entries[target].damageOverrides = selectedMob.entries[target].damageOverrides?.filter((_, i) => i !== index);
        }
    }

    function toggleDamageType(config: IDamageConfiguration, type: 'fire' | 'lightning' | 'cold') {
        if (config[type]) {
            delete config[type];
        } else {
            config[type] = { added: 0, conversion: 0 };
        }
        if (selectedMob) {
            selectedMob.entries = [...selectedMob.entries];
            if (selectedMob.damage) selectedMob.damage = [...selectedMob.damage];
        }
    }
</script>

<div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 overflow-y-auto">
    <div class="bg-white p-6 rounded-lg shadow-lg w-3/4 max-h-[90vh] overflow-y-auto">
        <Heading tag="h2" class="mb-4">Edit Mob Data</Heading>
        <p class="mb-4">Editing data for: <span class="font-bold">{selectedMob?.friendlyName}</span> (Net ID: {selectedMob?.netId})</p>

        {#if selectedMob}
            <div class="mb-8 border-b pb-4">
                <div class="flex justify-between items-center mb-2">
                    <Heading tag="h4">Global Damage Conversions</Heading>
                    <Button size="xs" color="blue" onclick={() => addDamageConfig('global')}>Add Global Damage</Button>
                </div>
                {#if selectedMob.damage && selectedMob.damage.length > 0}
                    <div class="space-y-4">
                        {#each selectedMob.damage as config, configIdx}
                            <div class="p-3 border rounded-lg bg-gray-50">
                                <div class="flex items-center space-x-4 mb-2">
                                    <div class="w-32">
                                        <Label class="text-xs">Min Level</Label>
                                        <Input type="number" size="sm" bind:value={config.minLevel} />
                                    </div>
                                    <div class="flex space-x-2 pt-5">
                                        <Button size="xs" outline={!config.fire} color="red" onclick={() => toggleDamageType(config, 'fire')}>Fire</Button>
                                        <Button size="xs" outline={!config.lightning} color="yellow" onclick={() => toggleDamageType(config, 'lightning')}>Lightning</Button>
                                        <Button size="xs" outline={!config.cold} color="blue" onclick={() => toggleDamageType(config, 'cold')}>Cold</Button>
                                    </div>
                                    <div class="ml-auto pt-5">
                                        <Button size="xs" color="red" onclick={() => removeDamageConfig('global', configIdx)}>Remove</Button>
                                    </div>
                                </div>
                                <div class="grid grid-cols-3 gap-4">
                                    {#if config.fire}
                                        <div class="border-l-4 border-red-500 pl-2">
                                            <Label class="text-xs font-bold text-red-700">Fire</Label>
                                            <div class="grid grid-cols-2 gap-1">
                                                <div><Label class="text-[10px]">Added</Label><Input type="number" size="sm" bind:value={config.fire.added} /></div>
                                                <div><Label class="text-[10px]">Conv</Label><Input type="number" size="sm" step="0.01" bind:value={config.fire.conversion} /></div>
                                            </div>
                                        </div>
                                    {/if}
                                    {#if config.lightning}
                                        <div class="border-l-4 border-yellow-400 pl-2">
                                            <Label class="text-xs font-bold text-yellow-700">Lightning</Label>
                                            <div class="grid grid-cols-2 gap-1">
                                                <div><Label class="text-[10px]">Added</Label><Input type="number" size="sm" bind:value={config.lightning.added} /></div>
                                                <div><Label class="text-[10px]">Conv</Label><Input type="number" size="sm" step="0.01" bind:value={config.lightning.conversion} /></div>
                                            </div>
                                        </div>
                                    {/if}
                                    {#if config.cold}
                                        <div class="border-l-4 border-blue-500 pl-2">
                                            <Label class="text-xs font-bold text-blue-700">Cold</Label>
                                            <div class="grid grid-cols-2 gap-1">
                                                <div><Label class="text-[10px]">Added</Label><Input type="number" size="sm" bind:value={config.cold.added} /></div>
                                                <div><Label class="text-[10px]">Conv</Label><Input type="number" size="sm" step="0.01" bind:value={config.cold.conversion} /></div>
                                            </div>
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    </div>
                {:else}
                    <p class="text-sm text-gray-500 italic">No global damage configurations.</p>
                {/if}
            </div>

            <div class="flex justify-between items-center mb-4">
                <Heading tag="h3">Mob Entries</Heading>
                <Button color="green" size="sm" onclick={addEntry}>Add Entry</Button>
            </div>

            <Accordion>
                {#each selectedMob.entries as entry, index}
                    <AccordionItem>
                        <span slot="header" class="flex items-center w-full">
                            <span class="mr-2 px-2 py-0.5 bg-gray-200 rounded text-xs">{index + 1}</span>
                            <span class="font-semibold">{entry.prefix || '(No Prefix)'}</span>
                            <span class="ml-4 text-xs text-gray-500">Weight: {entry.weight} | Lvl: {entry.stats.level}</span>
                        </span>
                        <div class="mb-4 border p-4 rounded-lg bg-white shadow-sm">
                            <div class="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <Label>Prefix</Label>
                                    <Input type="text" bind:value={entry.prefix} />
                                </div>
                                <div>
                                    <Label>Weight</Label>
                                    <Input type="number" step="0.01" bind:value={entry.weight} />
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <Label>Min Level</Label>
                                    <Input type="number" bind:value={entry.stats.level} />
                                </div>
                                <div>
                                    <Label>Experience</Label>
                                    <Input type="number" bind:value={entry.stats.experience} />
                                </div>
                            </div>
                            <div class="mb-4">
                                <Label>Requirements</Label>
                                <Input type="text" bind:value={entry.requirements} />
                            </div>

                            <div class="mb-4 border-t pt-4">
                                <div class="flex justify-between items-center mb-2">
                                    <Label class="font-bold">Damage Overrides</Label>
                                    <Button size="xs" color="blue" onclick={() => addDamageConfig(index)}>Add Override</Button>
                                </div>
                                {#if entry.damageOverrides && entry.damageOverrides.length > 0}
                                    <div class="space-y-4">
                                        {#each entry.damageOverrides as config, configIdx}
                                            <div class="p-3 border rounded-lg bg-gray-50">
                                                <div class="flex items-center space-x-4 mb-2">
                                                    <div class="w-32">
                                                        <Label class="text-xs">Min Level</Label>
                                                        <Input type="number" size="sm" bind:value={config.minLevel} />
                                                    </div>
                                                    <div class="flex space-x-2 pt-5">
                                                        <Button size="xs" outline={!config.fire} color="red" onclick={() => toggleDamageType(config, 'fire')}>Fire</Button>
                                                        <Button size="xs" outline={!config.lightning} color="yellow" onclick={() => toggleDamageType(config, 'lightning')}>Lightning</Button>
                                                        <Button size="xs" outline={!config.cold} color="blue" onclick={() => toggleDamageType(config, 'cold')}>Cold</Button>
                                                    </div>
                                                    <div class="ml-auto pt-5">
                                                        <Button size="xs" color="red" onclick={() => removeDamageConfig(index, configIdx)}>Remove</Button>
                                                    </div>
                                                </div>
                                                <div class="grid grid-cols-3 gap-4">
                                                    {#if config.fire}
                                                        <div class="border-l-4 border-red-500 pl-2">
                                                            <Label class="text-xs font-bold text-red-700">Fire</Label>
                                                            <div class="grid grid-cols-2 gap-1">
                                                                <div><Label class="text-[10px]">Added</Label><Input type="number" size="sm" bind:value={config.fire.added} /></div>
                                                                <div><Label class="text-[10px]">Conv</Label><Input type="number" size="sm" step="0.01" bind:value={config.fire.conversion} /></div>
                                                            </div>
                                                        </div>
                                                    {/if}
                                                    {#if config.lightning}
                                                        <div class="border-l-4 border-yellow-400 pl-2">
                                                            <Label class="text-xs font-bold text-yellow-700">Lightning</Label>
                                                            <div class="grid grid-cols-2 gap-1">
                                                                <div><Label class="text-[10px]">Added</Label><Input type="number" size="sm" bind:value={config.lightning.added} /></div>
                                                                <div><Label class="text-[10px]">Conv</Label><Input type="number" size="sm" step="0.01" bind:value={config.lightning.conversion} /></div>
                                                            </div>
                                                        </div>
                                                    {/if}
                                                    {#if config.cold}
                                                        <div class="border-l-4 border-blue-500 pl-2">
                                                            <Label class="text-xs font-bold text-blue-700">Cold</Label>
                                                            <div class="grid grid-cols-2 gap-1">
                                                                <div><Label class="text-[10px]">Added</Label><Input type="number" size="sm" bind:value={config.cold.added} /></div>
                                                                <div><Label class="text-[10px]">Conv</Label><Input type="number" size="sm" step="0.01" bind:value={config.cold.conversion} /></div>
                                                            </div>
                                                        </div>
                                                    {/if}
                                                </div>
                                            </div>
                                        {/each}
                                    </div>
                                {:else}
                                    <p class="text-xs text-gray-500 italic">No damage overrides for this entry.</p>
                                {/if}
                            </div>

                            <div class="flex justify-end">
                                <Button size="xs" color="red" outline onclick={() => deleteEntry(index)}>Delete Entry</Button>
                            </div>
                        </div>
                    </AccordionItem>
                {/each}
            </Accordion>
        {/if}

        <div class="mt-6 flex justify-end space-x-4 border-t pt-4">
            <Button color="alternative" onclick={closeModal}>Cancel</Button>
            <Button color="blue" onclick={saveChanges}>Save Changes</Button>
        </div>
    </div>
</div>
