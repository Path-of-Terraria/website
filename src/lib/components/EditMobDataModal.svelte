<script lang="ts">
    import type { IMobData, IDamageConfiguration } from "$lib/models/mob-data";
    import { createEventDispatcher } from 'svelte';
    import { Accordion, AccordionItem, Button, Input, Label, Heading } from 'flowbite-svelte';
    import DataDropdown from '$lib/components/DataDropdown.svelte';

    interface PrefixOption {
        value: string;
        label: string;
    }

    let {
        selectedMob = null,
        prefixOptions = [{ value: '', label: '(No Prefix)' }]
    } = $props<{
        selectedMob?: IMobData | null;
        prefixOptions?: PrefixOption[];
    }>();
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
                    affixes: []
                }
            ];
        }
    }

    function deleteEntry(index: number) {
        if (selectedMob) {
            selectedMob.entries = selectedMob.entries.filter((_: IMobData['entries'][number], i: number) => i !== index);
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
            selectedMob.damage = selectedMob.damage?.filter((_: IDamageConfiguration, i: number) => i !== index);
        } else {
            selectedMob.entries[target].damageOverrides = selectedMob.entries[target].damageOverrides?.filter((_: IDamageConfiguration, i: number) => i !== index);
        }
    }

    function toggleDamageType(config: IDamageConfiguration, type: 'fire' | 'lightning' | 'cold' | 'chaos') {
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

    const accordionItemClasses = {
        active: 'border border-white/10 bg-white/[0.06] text-white',
        inactive: 'border border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.05]',
        button: 'rounded-xl px-4 py-3 text-left text-white transition-colors duration-150 focus:ring-0',
        content: 'border-x border-b border-white/10 bg-[#0c141d] px-4 pb-4'
    };
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4">
    <div class="max-h-[90vh] w-3/4 overflow-y-auto rounded-[1.75rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_30%),linear-gradient(180deg,rgba(17,24,39,0.98),rgba(9,14,24,0.97))] p-6 text-white shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <Heading tag="h2" class="mb-4 text-white">Edit Mob Data</Heading>
        <p class="mb-4 text-gray-300">Editing data for: <span class="font-bold text-white">{selectedMob?.friendlyName}</span> (Net ID: {selectedMob?.netId})</p>

        {#if selectedMob}
            <div class="mb-8 border-b border-white/10 pb-4">
                <div class="flex justify-between items-center mb-2">
                    <Heading tag="h4" class="text-white">Global Damage Conversions</Heading>
                    <Button size="xs" class="bg-sky-500 text-white hover:bg-sky-400" onclick={() => addDamageConfig('global')}>Add Global Damage</Button>
                </div>
                {#if selectedMob.damage && selectedMob.damage.length > 0}
                    <div class="space-y-4">
                        {#each selectedMob.damage as config, configIdx}
                            <div class="rounded-xl border border-white/10 bg-white/[0.035] p-3">
                                <div class="flex items-center space-x-4 mb-2">
                                    <div class="w-32">
                                        <Label class="text-xs text-gray-300">Min Level</Label>
                                        <Input type="number" size="sm" bind:value={config.minLevel} class="border-white/10 bg-white/8 text-white placeholder:text-gray-500" />
                                    </div>
                                    <div class="flex space-x-2 pt-5">
                                        <Button size="xs" outline={!config.fire} color="red" class="cursor-pointer" onclick={() => toggleDamageType(config, 'fire')}>Fire</Button>
                                        <Button size="xs" outline={!config.lightning} color="yellow" class="cursor-pointer" onclick={() => toggleDamageType(config, 'lightning')}>Lightning</Button>
                                        <Button size="xs" outline={!config.cold} color="blue" class="cursor-pointer" onclick={() => toggleDamageType(config, 'cold')}>Cold</Button>
                                        <Button size="xs" outline={!config.chaos} color="purple" class="cursor-pointer" onclick={() => toggleDamageType(config, 'chaos')}>Chaos</Button>
                                    </div>
                                    <div class="ml-auto pt-5">
                                        <Button size="xs" class="border-red-400/20 bg-red-400/12 text-red-100 hover:bg-red-400/18" onclick={() => removeDamageConfig('global', configIdx)}>Remove</Button>
                                    </div>
                                </div>
                                <div class="grid grid-cols-3 gap-4">
                                    {#if config.fire}
                                        <div class="border-l-4 border-red-500 pl-2">
                                            <Label class="text-xs font-bold text-red-300">Fire</Label>
                                            <div class="grid grid-cols-2 gap-1">
                                                <div><Label class="text-[10px] text-gray-300">Added</Label><Input type="number" size="sm" bind:value={config.fire.added} class="border-white/10 bg-white/8 text-white" /></div>
                                                <div><Label class="text-[10px] text-gray-300">Conv</Label><Input type="number" size="sm" step="0.01" bind:value={config.fire.conversion} class="border-white/10 bg-white/8 text-white" /></div>
                                            </div>
                                        </div>
                                    {/if}
                                    {#if config.lightning}
                                        <div class="border-l-4 border-yellow-400 pl-2">
                                            <Label class="text-xs font-bold text-yellow-300">Lightning</Label>
                                            <div class="grid grid-cols-2 gap-1">
                                                <div><Label class="text-[10px] text-gray-300">Added</Label><Input type="number" size="sm" bind:value={config.lightning.added} class="border-white/10 bg-white/8 text-white" /></div>
                                                <div><Label class="text-[10px] text-gray-300">Conv</Label><Input type="number" size="sm" step="0.01" bind:value={config.lightning.conversion} class="border-white/10 bg-white/8 text-white" /></div>
                                            </div>
                                        </div>
                                    {/if}
                                    {#if config.cold}
                                        <div class="border-l-4 border-blue-500 pl-2">
                                            <Label class="text-xs font-bold text-sky-300">Cold</Label>
                                            <div class="grid grid-cols-2 gap-1">
                                                <div><Label class="text-[10px] text-gray-300">Added</Label><Input type="number" size="sm" bind:value={config.cold.added} class="border-white/10 bg-white/8 text-white" /></div>
                                                <div><Label class="text-[10px] text-gray-300">Conv</Label><Input type="number" size="sm" step="0.01" bind:value={config.cold.conversion} class="border-white/10 bg-white/8 text-white" /></div>
                                            </div>
                                        </div>
                                    {/if}
                                    {#if config.chaos}
                                        <div class="border-l-4 border-purple-500 pl-2">
                                            <Label class="text-xs font-bold text-purple-300">Chaos</Label>
                                            <div class="grid grid-cols-2 gap-1">
                                                <div><Label class="text-[10px] text-gray-300">Added</Label><Input type="number" size="sm" bind:value={config.chaos.added} class="border-white/10 bg-white/8 text-white" /></div>
                                                <div><Label class="text-[10px] text-gray-300">Conv</Label><Input type="number" size="sm" step="0.01" bind:value={config.chaos.conversion} class="border-white/10 bg-white/8 text-white" /></div>
                                            </div>
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    </div>
                {:else}
                    <p class="text-sm italic text-gray-400">No global damage configurations.</p>
                {/if}
            </div>

            <div class="flex justify-between items-center mb-4">
                <Heading tag="h3" class="text-white">Mob Entries</Heading>
                <Button class="bg-emerald-500 text-white hover:bg-emerald-400" size="sm" onclick={addEntry}>Add Entry</Button>
            </div>
            <p class="mb-4 text-sm text-gray-400">Expand an entry to edit prefix data, weights, guaranteed affixes, and per-entry damage overrides.</p>

            <Accordion>
                {#each selectedMob.entries as entry, index}
                    <AccordionItem classes={accordionItemClasses} class="mb-3 last:mb-0">
                        {#snippet header()}
                            <span class="flex w-full items-center">
                                <span class="mr-2 rounded bg-white/10 px-2 py-0.5 text-xs text-white">{index + 1}</span>
                                <span class="font-semibold text-white">{entry.prefix || '(No Prefix)'}</span>
                                <span class="ml-4 text-xs text-gray-400">Weight: {entry.weight}</span>
                            </span>
                        {/snippet}
                        <div class="mb-4 rounded-xl border border-white/10 bg-white/[0.035] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.2)]">
                            <div class="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <DataDropdown
                                        id={`entry-prefix-${index}`}
                                        label="Prefix"
                                        options={prefixOptions}
                                        bind:value={entry.prefix}
                                    />
                                </div>
                                <div>
                                    <Label class="text-gray-300">Weight</Label>
                                    <Input type="number" step="0.01" bind:value={entry.weight} class="border-white/10 bg-white/8 text-white" />
                                </div>
                            </div>
                            <div class="mb-4 border-t border-white/10 pt-4">
                                <div class="flex justify-between items-center mb-2">
                                    <Label class="font-bold text-white">Damage Overrides</Label>
                                    <Button size="xs" class="bg-sky-500 text-white hover:bg-sky-400" onclick={() => addDamageConfig(index)}>Add Override</Button>
                                </div>
                                {#if entry.damageOverrides && entry.damageOverrides.length > 0}
                                    <div class="space-y-4">
                                        {#each entry.damageOverrides as config, configIdx}
                                            <div class="rounded-xl border border-white/10 bg-white/[0.035] p-3">
                                                <div class="flex items-center space-x-4 mb-2">
                                                    <div class="w-32">
                                                        <Label class="text-xs text-gray-300">Min Level</Label>
                                                        <Input type="number" size="sm" bind:value={config.minLevel} class="border-white/10 bg-white/8 text-white" />
                                                    </div>
                                                    <div class="flex space-x-2 pt-5">
                                                        <Button size="xs" outline={!config.fire} color="red" class="cursor-pointer" onclick={() => toggleDamageType(config, 'fire')}>Fire</Button>
                                                        <Button size="xs" outline={!config.lightning} color="yellow" class="cursor-pointer" onclick={() => toggleDamageType(config, 'lightning')}>Lightning</Button>
                                                        <Button size="xs" outline={!config.cold} color="blue" class="cursor-pointer" onclick={() => toggleDamageType(config, 'cold')}>Cold</Button>
                                                        <Button size="xs" outline={!config.chaos} color="purple" class="cursor-pointer" onclick={() => toggleDamageType(config, 'chaos')}>Chaos</Button>
                                                    </div>
                                                    <div class="ml-auto pt-5">
                                                        <Button size="xs" class="border-red-400/20 bg-red-400/12 text-red-100 hover:bg-red-400/18" onclick={() => removeDamageConfig(index, configIdx)}>Remove</Button>
                                                    </div>
                                                </div>
                                                <div class="grid grid-cols-3 gap-4">
                                                    {#if config.fire}
                                                        <div class="border-l-4 border-red-500 pl-2">
                                                            <Label class="text-xs font-bold text-red-300">Fire</Label>
                                                            <div class="grid grid-cols-2 gap-1">
                                                                <div><Label class="text-[10px] text-gray-300">Added</Label><Input type="number" size="sm" bind:value={config.fire.added} class="border-white/10 bg-white/8 text-white" /></div>
                                                                <div><Label class="text-[10px] text-gray-300">Conv</Label><Input type="number" size="sm" step="0.01" bind:value={config.fire.conversion} class="border-white/10 bg-white/8 text-white" /></div>
                                                            </div>
                                                        </div>
                                                    {/if}
                                                    {#if config.lightning}
                                                        <div class="border-l-4 border-yellow-400 pl-2">
                                                            <Label class="text-xs font-bold text-yellow-300">Lightning</Label>
                                                            <div class="grid grid-cols-2 gap-1">
                                                                <div><Label class="text-[10px] text-gray-300">Added</Label><Input type="number" size="sm" bind:value={config.lightning.added} class="border-white/10 bg-white/8 text-white" /></div>
                                                                <div><Label class="text-[10px] text-gray-300">Conv</Label><Input type="number" size="sm" step="0.01" bind:value={config.lightning.conversion} class="border-white/10 bg-white/8 text-white" /></div>
                                                            </div>
                                                        </div>
                                                    {/if}
                                                    {#if config.cold}
                                                        <div class="border-l-4 border-blue-500 pl-2">
                                                            <Label class="text-xs font-bold text-sky-300">Cold</Label>
                                                            <div class="grid grid-cols-2 gap-1">
                                                                <div><Label class="text-[10px] text-gray-300">Added</Label><Input type="number" size="sm" bind:value={config.cold.added} class="border-white/10 bg-white/8 text-white" /></div>
                                                                <div><Label class="text-[10px] text-gray-300">Conv</Label><Input type="number" size="sm" step="0.01" bind:value={config.cold.conversion} class="border-white/10 bg-white/8 text-white" /></div>
                                                            </div>
                                                        </div>
                                                    {/if}
                                                    {#if config.chaos}
                                                        <div class="border-l-4 border-purple-500 pl-2">
                                                            <Label class="text-xs font-bold text-purple-300">Chaos</Label>
                                                            <div class="grid grid-cols-2 gap-1">
                                                                <div><Label class="text-[10px] text-gray-300">Added</Label><Input type="number" size="sm" bind:value={config.chaos.added} class="border-white/10 bg-white/8 text-white" /></div>
                                                                <div><Label class="text-[10px] text-gray-300">Conv</Label><Input type="number" size="sm" step="0.01" bind:value={config.chaos.conversion} class="border-white/10 bg-white/8 text-white" /></div>
                                                            </div>
                                                        </div>
                                                    {/if}
                                                </div>
                                            </div>
                                        {/each}
                                    </div>
                                {:else}
                                    <p class="text-xs italic text-gray-400">No damage overrides for this entry.</p>
                                {/if}
                            </div>

                            <div class="flex justify-end">
                                <Button size="xs" class="border-red-400/20 bg-red-400/12 text-red-100 hover:bg-red-400/18" onclick={() => deleteEntry(index)}>Delete Entry</Button>
                            </div>
                        </div>
                    </AccordionItem>
                {/each}
            </Accordion>
        {/if}

        <div class="mt-6 flex justify-end space-x-4 border-t border-white/10 pt-4">
            <Button class="border-white/10 bg-white/8 text-gray-200 hover:bg-white/12 hover:text-white" onclick={closeModal}>Cancel</Button>
            <Button class="bg-emerald-500 text-white hover:bg-emerald-400" onclick={saveChanges}>Save Changes</Button>
        </div>
    </div>
</div>
