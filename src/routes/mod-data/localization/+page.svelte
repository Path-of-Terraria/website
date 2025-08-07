<script lang="ts">
    import { onMount } from 'svelte';
    import { TranslationEntryService } from '$lib/services/translation-entry-service';
    import type { IEnglishTranslation } from '$lib/models/localization';

    let translations: IEnglishTranslation[] = [];
    let categories: string[] = [];
    let categorizedTranslations: Record<string, IEnglishTranslation[]> = {};
    let activeCategory: string = '';
    let expandedGroups: Set<string> = new Set();
    
    const translationService = new TranslationEntryService();

    onMount(async () => {
        await fetchTranslations();
    });

    /**
     * Fetches translation entries from the API and processes them
     */
    async function fetchTranslations() {
        translations = await translationService.getEnglishTranslations();
        processTranslations();
        if (categories.length > 0) {
            activeCategory = categories[0];
        }
    }

    /**
     * Processes the raw translations into categories
     * Extracts the category from each translation key (the first word after Mods.PathOfTerraria)
     * and groups translations by category
     */
    function processTranslations() {
        categorizedTranslations = {};
        // Group translations by category (the first word after Mods.PathOfTerraria.)
        translations.forEach(translation => {
            const parts = translation.key.split('.');
            if (parts.length >= 3 && parts[0] === 'Mods' && parts[1] === 'PathOfTerraria') {
                const category = parts[2];
                
                if (!categorizedTranslations[category]) {
                    categorizedTranslations[category] = [];
                }
                
                categorizedTranslations[category].push(translation);
            }
        });
        
        categories = Object.keys(categorizedTranslations).sort();
    }

    /**
     * Determines if a translation key should be part of a collapsible group
     * Returns the group key for nested entries or null for simple entries
     * 
     * @param key The translation key to analyze
     * @returns The group key or null if the key is not part of a group
     */
    function getGroupKey(key: string): string | null {
        const parts = key.split('.');
        if (parts.length <= 4) return null; // No group for simple keys
        
        // For keys like Mods.PathOfTerraria.Generation.EaterSign.Names.0
        // The group would be Mods.PathOfTerraria.Generation.EaterSign
        return parts.slice(0, 4).join('.');
    }

    /**
     * Separates translations into grouped and non-grouped entries
     * 
     * @param categoryTranslations The translations for the current category
     * @returns An object with grouped and non-grouped translations
     */
    function getGroupedTranslations(categoryTranslations: IEnglishTranslation[]) {
        const result: Record<string, IEnglishTranslation[]> = {};
        const nonGrouped: IEnglishTranslation[] = [];
        
        categoryTranslations.forEach(translation => {
            const groupKey = getGroupKey(translation.key);
            
            if (groupKey) {
                if (!result[groupKey]) {
                    result[groupKey] = [];
                }
                result[groupKey].push(translation);
            } else {
                nonGrouped.push(translation);
            }
        });
        
        return { grouped: result, nonGrouped };
    }

    /**
     * Toggles the expanded/collapsed state of a group
     * 
     * @param groupKey The key of the group to toggle
     */
    function toggleGroup(groupKey: string) {
        if (expandedGroups.has(groupKey)) {
            expandedGroups.delete(groupKey);
        } else {
            expandedGroups.add(groupKey);
        }
        expandedGroups = expandedGroups; // Trigger reactivity
    }

    /**
     * Formats the display of a translation key
     * For grouped items, shows only the part after the group key
     * 
     * @param key The full translation key
     * @param groupKey The group key, if the translation is part of a group
     * @returns The formatted key for display
     */
    function getDisplayKey(key: string, groupKey: string | null = null): string {
        if (!groupKey) return key;
        
        // For grouped items, show only the part after the group key
        return key.substring(groupKey.length + 1);
    }
    
    /**
     * Extracts a user-friendly name from a group key
     * 
     * @param groupKey The full group key (e.g., "Mods.PathOfTerraria.Generation.EaterSign")
     * @returns The meaningful part of the key (e.g., "EaterSign")
     */
    function formatGroupName(groupKey: string): string {
        // Extract the meaningful part of the group key (e.g., "EaterSign" from "Mods.PathOfTerraria.Generation.EaterSign")
        const parts = groupKey.split('.');
        return parts.length >= 4 ? parts[3] : groupKey;
    }
</script>

<div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-6">Terraria Mod Localization</h1>
    
    {#if categories.length === 0}
        <div class="flex justify-center items-center h-64">
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    {:else}
        <!-- Category Tabs -->
        <div class="mb-4 border-b border-gray-200">
            <ul class="flex flex-wrap -mb-px">
                {#each categories as category}
                    <li class="mr-2">
                        <button 
                            class="inline-block p-4 rounded-t-lg {activeCategory === category ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-gray-600 hover:border-gray-300'}"
                            on:click={() => activeCategory = category}
                        >
                            {category}
                        </button>
                    </li>
                {/each}
            </ul>
        </div>
        
        <!-- Translation Table -->
        <div class="overflow-x-auto">
            <table class="min-w-full bg-white border border-gray-200">
                <thead>
                    <tr>
                        <th class="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                        <th class="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    </tr>
                </thead>
                <tbody>
                    {#if categorizedTranslations[activeCategory]}
                        {@const { grouped, nonGrouped } = getGroupedTranslations(categorizedTranslations[activeCategory])}
                        
                        <!-- Non-grouped translations -->
                        {#each nonGrouped as translation}
                            <tr class="hover:bg-gray-50">
                                <td class="py-2 px-4 border-b border-gray-200">{getDisplayKey(translation.key)}</td>
                                <td class="py-2 px-4 border-b border-gray-200">{translation.value}</td>
                            </tr>
                        {/each}
                        
                        <!-- Grouped translations -->
                        {#each Object.entries(grouped) as [groupKey, groupTranslations]}
                            <!-- Group header -->
                            <tr class="bg-gray-100 hover:bg-gray-200 cursor-pointer" on:click={() => toggleGroup(groupKey)}>
                                <td class="py-2 px-4 border-b border-gray-200 font-medium">
                                    <div class="flex items-center">
                                        <span class="mr-2">{expandedGroups.has(groupKey) ? '▼' : '►'}</span>
                                        {formatGroupName(groupKey)}
                                    </div>
                                </td>
                                <td class="py-2 px-4 border-b border-gray-200">
                                    {groupTranslations.length} entries
                                </td>
                            </tr>
                            
                            <!-- Group items (shown when expanded) -->
                            {#if expandedGroups.has(groupKey)}
                                {#each groupTranslations as translation}
                                    <tr class="bg-gray-50 hover:bg-gray-100">
                                        <td class="py-2 px-4 border-b border-gray-200 pl-8">{getDisplayKey(translation.key, groupKey)}</td>
                                        <td class="py-2 px-4 border-b border-gray-200">{translation.value}</td>
                                    </tr>
                                {/each}
                            {/if}
                        {/each}
                    {/if}
                </tbody>
            </table>
        </div>
    {/if}
</div>