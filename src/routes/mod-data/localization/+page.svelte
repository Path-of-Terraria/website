<script lang="ts">
    import { onMount } from 'svelte';
    import { TranslationEntryService } from '$lib/services/translation-entry-service';
    import type { IEnglishTranslation, ITranslationEntry } from '$lib/models/localization';
    import { toast } from '@zerodevx/svelte-toast';

    // Available languages for translation
    const availableLanguages = [
        { code: 'es-ES', name: 'Spanish' },
        { code: 'fr-FR', name: 'French' },
        { code: 'it-IT', name: 'Italian' },
        { code: 'de-DE', name: 'German' },
        { code: 'pt-BR', name: 'Portuguese' },
        { code: 'ru-RU', name: 'Russian' },
        { code: 'zh-Hans', name: 'Chinese' },
        { code: 'pl-PL', name: 'Polish' }
    ];

    let selectedLanguage: string = '';
    let englishTranslations: IEnglishTranslation[] = [];
    let languageTranslations: ITranslationEntry[] = [];
    let categories: string[] = [];
    let categorizedTranslations: Record<string, IEnglishTranslation[]> = {};
    let activeCategory: string = '';
    let expandedGroups: Set<string> = new Set();
    let showTranslationTable: boolean = false;
    let newTranslations: Record<string, string> = {};
    let submitting: Record<string, boolean> = {};

    const translationService = new TranslationEntryService();

    onMount(async () => {
        // Only fetch English translations on mount
        await fetchEnglishTranslations();
    });

    /**
     * Fetches English translation entries from the API
     */
    async function fetchEnglishTranslations() {
        englishTranslations = await translationService.getEnglishTranslations();
    }
    
    /**
     * Fetches translations for the selected language and processes all translations
     */
    async function fetchLanguageTranslations() {
        if (!selectedLanguage) return;
        
        languageTranslations = await translationService.getByLanguage(selectedLanguage);
        processTranslations();
        showTranslationTable = true;
        
        if (categories.length > 0) {
            activeCategory = categories[0];
        }
    }

    /**
     * Processes the English translations and language-specific translations into categories
     * Extracts the category from each translation key (the first word after Mods.PathOfTerraria)
     * and groups translations by category, merging with language-specific translations if available
     */
    function processTranslations() {
        categorizedTranslations = {};
        
        // Create a map of language translations for quick lookup
        const languageTranslationsMap = new Map<string, string>();
        languageTranslations.forEach(translation => {
            languageTranslationsMap.set(translation.key, translation.value);
        });
        
        // Group translations by category (the first word after Mods.PathOfTerraria.)
        englishTranslations.forEach(englishTranslation => {
            const parts = englishTranslation.key.split('.');
            if (parts.length >= 3 && parts[0] === 'Mods' && parts[1] === 'PathOfTerraria') {
                const category = parts[2];
                
                if (!categorizedTranslations[category]) {
                    categorizedTranslations[category] = [];
                }
                
                // Create a new translation object that includes both English and language-specific values
                const mergedTranslation = {
                    key: englishTranslation.key,
                    value: englishTranslation.value,
                    translatedValue: languageTranslationsMap.get(englishTranslation.key) || ''
                };
                
                categorizedTranslations[category].push(mergedTranslation);
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
    function getGroupedTranslations(categoryTranslations: any[]) {
        const result: Record<string, any[]> = {};
        const nonGrouped: any[] = [];
        
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
    
    /**
     * Submits a new translation for a key that doesn't have one yet
     * 
     * @param key The translation key
     */
    async function submitTranslation(key: string) {
        if (!newTranslations[key] || newTranslations[key].trim() === '') {
            toast.push('Please enter a translation', {
                theme: {
                    '--toastBackground': '#F56565',
                    '--toastColor': 'white',
                }
            });
            return;
        }
        
        try {
            submitting[key] = true;
            submitting = {...submitting}; // Trigger reactivity
            
            // Extract category from key
            const parts = key.split('.');
            const category = parts.length >= 3 ? parts[2] : '';
            
            // Create new translation entry
            const newTranslation: ITranslationEntry = {
                id: '', // Will be assigned by the server
                key: key,
                value: newTranslations[key],
                language: selectedLanguage,
                category: category
            };
            
            await translationService.create(newTranslation);
            
            // Update the UI to show the new translation
            const updatedTranslations = [...languageTranslations];
            updatedTranslations.push(newTranslation);
            languageTranslations = updatedTranslations;
            
            // Update the categorized translations
            processTranslations();
            
            // Clear the input
            delete newTranslations[key];
            newTranslations = {...newTranslations}; // Trigger reactivity
            
            toast.push('Translation added successfully', {
                theme: {
                    '--toastBackground': '#48BB78',
                    '--toastColor': 'white',
                }
            });
        } catch (error) {
            console.error('Error submitting translation:', error);
            toast.push('Failed to add translation', {
                theme: {
                    '--toastBackground': '#F56565',
                    '--toastColor': 'white',
                }
            });
        } finally {
            submitting[key] = false;
            submitting = {...submitting}; // Trigger reactivity
        }
    }
</script>

<div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-6">Terraria Mod Localization</h1>
    
    <!-- Language Selection -->
    {#if !showTranslationTable}
        <div class="mb-8 p-6 bg-white rounded-lg shadow-md">
            <h2 class="text-xl font-semibold mb-4">Select a Language</h2>
            <p class="mb-4">Please select a language to view and edit translations:</p>
            
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {#each availableLanguages as language}
                    <button 
                        class="p-3 border rounded-md hover:bg-blue-50 transition-colors {selectedLanguage === language.code ? 'bg-blue-100 border-blue-500' : 'border-gray-300'}"
                        on:click={() => selectedLanguage = language.code}
                    >
                        {language.name}
                    </button>
                {/each}
            </div>
            
            <div class="mt-6 flex justify-end">
                <button 
                    class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!selectedLanguage}
                    on:click={fetchLanguageTranslations}
                >
                    Continue
                </button>
            </div>
        </div>
    {:else if categories.length === 0}
        <div class="flex justify-center items-center h-64">
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    {:else}
        <!-- Header with language info and back button -->
        <div class="flex justify-between items-center mb-4">
            <div>
                <span class="text-lg font-medium">Selected language: </span>
                <span class="text-lg font-bold">{availableLanguages.find(l => l.code === selectedLanguage)?.name}</span>
            </div>
            <button 
                class="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center"
                on:click={() => showTranslationTable = false}
            >
                <span class="mr-1">←</span> Change Language
            </button>
        </div>
        
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
                        <th class="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">English</th>
                        <th class="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{availableLanguages.find(l => l.code === selectedLanguage)?.name || 'Translation'}</th>
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
                                <td class="py-2 px-4 border-b border-gray-200">
                                    {#if translation.translatedValue}
                                        {translation.translatedValue}
                                    {:else}
                                        <div class="flex items-center space-x-2">
                                            <input 
                                                type="text" 
                                                class="flex-grow px-2 py-1 border rounded-md text-sm"
                                                placeholder="Add translation"
                                                bind:value={newTranslations[translation.key]}
                                            />
                                            <button 
                                                class="px-3 py-1 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                                on:click={() => submitTranslation(translation.key)}
                                                disabled={submitting[translation.key]}
                                            >
                                                {#if submitting[translation.key]}
                                                    <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                                                    Saving
                                                {:else}
                                                    Add
                                                {/if}
                                            </button>
                                        </div>
                                    {/if}
                                </td>
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
                                <td class="py-2 px-4 border-b border-gray-200" colspan="2">
                                    {groupTranslations.length} entries
                                </td>
                            </tr>
                            
                            <!-- Group items (shown when expanded) -->
                            {#if expandedGroups.has(groupKey)}
                                {#each groupTranslations as translation}
                                    <tr class="bg-gray-50 hover:bg-gray-100">
                                        <td class="py-2 px-4 border-b border-gray-200 pl-8">{getDisplayKey(translation.key, groupKey)}</td>
                                        <td class="py-2 px-4 border-b border-gray-200">{translation.value}</td>
                                        <td class="py-2 px-4 border-b border-gray-200">
                                            {#if translation.translatedValue}
                                                {translation.translatedValue}
                                            {:else}
                                                <div class="flex items-center space-x-2">
                                                    <input 
                                                        type="text" 
                                                        class="flex-grow px-2 py-1 border rounded-md text-sm"
                                                        placeholder="Add translation"
                                                        bind:value={newTranslations[translation.key]}
                                                    />
                                                    <button 
                                                        class="px-3 py-1 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                                        on:click={() => submitTranslation(translation.key)}
                                                        disabled={submitting[translation.key]}
                                                    >
                                                        {#if submitting[translation.key]}
                                                            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                                                            Saving
                                                        {:else}
                                                            Add
                                                        {/if}
                                                    </button>
                                                </div>
                                            {/if}
                                        </td>
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