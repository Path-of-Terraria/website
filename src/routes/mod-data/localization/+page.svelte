<script lang="ts">
    import {onMount} from 'svelte';
    import {TranslationEntryService} from '$lib/services/translation-entry-service';
    import {HjsonParserService} from '$lib/services/hjson-parser-service';
    import type {IEnglishTranslation, ITranslationEntry} from '$lib/models/localization';
    import {toast} from '@zerodevx/svelte-toast';
    import {UserService} from '$lib/services/user-service';

    // Available languages for translation
    const availableLanguages = [
        {code: 'es-ES', name: 'Spanish'},
        {code: 'fr-FR', name: 'French'},
        {code: 'it-IT', name: 'Italian'},
        {code: 'de-DE', name: 'German'},
        {code: 'pt-BR', name: 'Brazilian Portuguese'},
        {code: 'ru-RU', name: 'Russian'},
        {code: 'zh-Hans', name: 'Chinese'},
        {code: 'pl-PL', name: 'Polish'}
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

    // Filter options
    let hideTranslatedEntries: boolean = false;
    
    // Edit related variables
    let editingTranslations: Record<string, boolean> = {};
    let editedTranslations: Record<string, string> = {};
    let updatingTranslations: Record<string, boolean> = {};

    // HJSON import related variables
    let hjsonContent: string = '';
    let importedTranslations: Record<string, string> = {};
    let importStats = {total: 0, added: 0, skipped: 0};
    let isImporting: boolean = false;
    let selectedImportCategory: string = '';

    const translationService = new TranslationEntryService();
    const hjsonParserService = new HjsonParserService();
    const userService = new UserService();
    
    // Flag to track if user has edit permissions
    let canEditTranslations = false;

    onMount(async () => {
        // Only fetch English translations on mount
        await fetchEnglishTranslations();
        
        // Check if user has EditTranslations role
        canEditTranslations = await userService.hasRole("EditTranslations");
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

        // Create maps of language translations for quick lookup
        const languageTranslationsMap = new Map<string, string>();
        const translationIdsMap = new Map<string, string>();
        languageTranslations.forEach(translation => {
            languageTranslationsMap.set(translation.key, translation.value);
            if (translation.id) {
                translationIdsMap.set(translation.key, translation.id);
            }
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
                    translatedValue: languageTranslationsMap.get(englishTranslation.key) || '',
                    id: translationIdsMap.get(englishTranslation.key) || undefined
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

        return {grouped: result, nonGrouped};
    }

    /**
     * Filters translations based on the hideTranslatedEntries setting
     *
     * @param translations The translations to filter
     * @returns Filtered translations array
     */
    function filterTranslations(translations: any[]): any[] {
        if (!hideTranslatedEntries) {
            return translations;
        }

        return translations.filter(translation => !translation.translatedValue);
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
    
    /**
     * Updates an existing translation
     *
     * @param translationEntry The translation entry to update
     */
    async function updateTranslation(translationEntry: ITranslationEntry) {
        if (!editedTranslations[translationEntry.key] || editedTranslations[translationEntry.key].trim() === '') {
            toast.push('Please enter a translation', {
                theme: {
                    '--toastBackground': '#F56565',
                    '--toastColor': 'white',
                }
            });
            return;
        }

        try {
            updatingTranslations[translationEntry.key] = true;
            updatingTranslations = {...updatingTranslations}; // Trigger reactivity

            // Create updated translation entry
            const updatedTranslation: ITranslationEntry = {
                ...translationEntry,
                id: translationEntry.id, // Explicitly include the ID
                value: editedTranslations[translationEntry.key]
            };

            await translationService.update(updatedTranslation);

            // Update the UI to show the updated translation
            const updatedTranslations = languageTranslations.map(t => 
                t.key === translationEntry.key ? updatedTranslation : t
            );
            languageTranslations = updatedTranslations;

            // Update the categorized translations
            processTranslations();

            // Exit edit mode
            editingTranslations[translationEntry.key] = false;
            editingTranslations = {...editingTranslations}; // Trigger reactivity
            
            // Clear the edited value
            delete editedTranslations[translationEntry.key];
            editedTranslations = {...editedTranslations}; // Trigger reactivity

            toast.push('Translation updated successfully', {
                theme: {
                    '--toastBackground': '#48BB78',
                    '--toastColor': 'white',
                }
            });
        } catch (error) {
            console.error('Error updating translation:', error);
            toast.push('Failed to update translation', {
                theme: {
                    '--toastBackground': '#F56565',
                    '--toastColor': 'white',
                }
            });
        } finally {
            updatingTranslations[translationEntry.key] = false;
            updatingTranslations = {...updatingTranslations}; // Trigger reactivity
        }
    }
    
    /**
     * Starts editing a translation
     *
     * @param translationEntry The translation entry to edit
     */
    function startEditing(translationEntry: ITranslationEntry) {
        editingTranslations[translationEntry.key] = true;
        editingTranslations = {...editingTranslations}; // Trigger reactivity
        
        // Initialize the edited value with the current translated value (not the English one)
        editedTranslations[translationEntry.key] = translationEntry.translatedValue;
        editedTranslations = {...editedTranslations}; // Trigger reactivity
    }
    
    /**
     * Cancels editing a translation
     *
     * @param key The key of the translation being edited
     */
    function cancelEditing(key: string) {
        editingTranslations[key] = false;
        editingTranslations = {...editingTranslations}; // Trigger reactivity
        
        // Clear the edited value
        delete editedTranslations[key];
        editedTranslations = {...editedTranslations}; // Trigger reactivity
    }

    /**
     * Parses HJSON content and imports translations
     * This function handles the import of HJSON content and fills in missing translations
     */
    async function importHjsonTranslations() {
        if (!hjsonContent.trim()) {
            toast.push('Please enter HJSON content', {
                theme: {
                    '--toastBackground': '#F56565',
                    '--toastColor': 'white',
                }
            });
            return;
        }

        if (!selectedImportCategory) {
            toast.push('Please select a category', {
                theme: {
                    '--toastBackground': '#F56565',
                    '--toastColor': 'white',
                }
            });
            return;
        }

        try {
            isImporting = true;
            importStats = {total: 0, added: 0, skipped: 0};

            // Create a set of existing translations for quick lookup
            const existingTranslationsSet = new Set<string>();
            languageTranslations.forEach(translation => {
                existingTranslationsSet.add(translation.key);
            });

            // Parse the HJSON content using the service
            const parsedTranslations = hjsonParserService.parseHjsonContent(hjsonContent, selectedImportCategory);

            // Create translation entries from the parsed content
            const result = hjsonParserService.createTranslationEntries(
                parsedTranslations,
                selectedLanguage,
                selectedImportCategory,
                existingTranslationsSet
            );

            // Update import statistics
            importStats = result.stats;

            // Submit all new translations
            for (const translation of result.translationsToAdd) {
                await translationService.create(translation);
            }

            // Update the UI with the new translations
            if (result.translationsToAdd.length > 0) {
                languageTranslations = [...languageTranslations, ...result.translationsToAdd];
                processTranslations();
            }

            toast.push(`Imported ${importStats.added} translations successfully`, {
                theme: {
                    '--toastBackground': '#48BB78',
                    '--toastColor': 'white',
                }
            });
        } catch (error) {
            console.error('Error importing HJSON:', error);
            toast.push('Failed to import HJSON content', {
                theme: {
                    '--toastBackground': '#F56565',
                    '--toastColor': 'white',
                }
            });
        } finally {
            isImporting = false;
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
            <div class="flex space-x-2">
                <button
                        class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
                        on:click={() => document.getElementById('hjsonImportModal')?.classList.remove('hidden')}
                >
                    Import HJSON
                </button>
                <button
                        class="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center"
                        on:click={() => showTranslationTable = false}
                >
                    <span class="mr-1">←</span> Change Language
                </button>
            </div>
        </div>

        <!-- HJSON Import Modal -->
        <div id="hjsonImportModal"
             class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
            <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                <h2 class="text-xl font-semibold mb-4">Import HJSON Translations</h2>
                <p class="mb-4">Paste your HJSON content below. This will fill in missing translations for the selected
                    language ({availableLanguages.find(l => l.code === selectedLanguage)?.name}).</p>

                <textarea
                        class="w-full h-64 p-2 border rounded-md mb-4 font-mono text-sm"
                        placeholder="Paste your HJSON content here..."
                        bind:value={hjsonContent}
                ></textarea>

                <div class="mb-4">
                    <label for="categorySelect" class="block text-sm font-medium text-gray-700 mb-1">Select
                        Category</label>
                    <select
                            id="categorySelect"
                            class="w-full p-2 border rounded-md"
                            bind:value={selectedImportCategory}
                            required
                    >
                        <option value="" disabled>Select a category</option>
                        {#each categories as category}
                            <option value={category}>{category}</option>
                        {/each}
                    </select>
                    <p class="mt-1 text-sm text-gray-500">All imported translations will be assigned to this
                        category.</p>
                    {#if categories.length === 0}
                        <p class="mt-1 text-sm text-red-500">No categories available. Please select a language
                            first.</p>
                    {/if}
                </div>

                {#if importStats.total > 0}
                    <div class="mb-4 p-3 bg-blue-50 rounded-md">
                        <p>Import results:</p>
                        <ul class="list-disc pl-5">
                            <li>Total entries: {importStats.total}</li>
                            <li>Added translations: {importStats.added}</li>
                            <li>Skipped (already translated): {importStats.skipped}</li>
                        </ul>
                    </div>
                {/if}

                <div class="flex justify-end space-x-2">
                    <button
                            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                            on:click={() => document.getElementById('hjsonImportModal')?.classList.add('hidden')}
                    >
                        Cancel
                    </button>
                    <button
                            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            on:click={importHjsonTranslations}
                            disabled={!hjsonContent.trim() || !selectedImportCategory || isImporting}
                    >
                        {#if isImporting}
                            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Importing...
                        {:else}
                            Import
                        {/if}
                    </button>
                </div>
            </div>
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

        <!-- Filter Options -->
        <div class="mb-4 flex items-center">
            <label class="flex items-center">
                <input
                        type="checkbox"
                        class="mr-2"
                        bind:checked={hideTranslatedEntries}
                />
                <span class="text-sm text-gray-700">Hide already translated entries</span>
            </label>
        </div>

        <!-- Translation Table -->
        <div class="overflow-x-auto">
            <table class="min-w-full bg-white border border-gray-200">
                <thead>
                <tr>
                    <th class="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Key
                    </th>
                    <th class="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        English
                    </th>
                    <th class="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{availableLanguages.find(l => l.code === selectedLanguage)?.name || 'Translation'}</th>
                </tr>
                </thead>
                <tbody>
                {#if categorizedTranslations[activeCategory]}
                    {@const {grouped, nonGrouped} = getGroupedTranslations(categorizedTranslations[activeCategory])}
                    {@const filteredNonGrouped = filterTranslations(nonGrouped)}

                    <!-- Non-grouped translations -->
                    {#each filteredNonGrouped as translation}
                        <tr class="hover:bg-gray-50">
                            <td class="py-2 px-4 border-b border-gray-200">{getDisplayKey(translation.key)}</td>
                            <td class="py-2 px-4 border-b border-gray-200">{translation.value}</td>
                            <td class="py-2 px-4 border-b border-gray-200">
                                {#if translation.translatedValue}
                                    {#if canEditTranslations && editingTranslations[translation.key]}
                                        <div class="flex items-center space-x-2">
                                            <input
                                                    type="text"
                                                    class="flex-grow px-2 py-1 border rounded-md text-sm"
                                                    placeholder="Edit translation"
                                                    bind:value={editedTranslations[translation.key]}
                                            />
                                            <button
                                                    class="px-3 py-1 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                                    on:click={() => updateTranslation(translation)}
                                                    disabled={updatingTranslations[translation.key]}
                                            >
                                                {#if updatingTranslations[translation.key]}
                                                    <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                                                    Saving
                                                {:else}
                                                    Save
                                                {/if}
                                            </button>
                                            <button
                                                    class="px-3 py-1 bg-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-400"
                                                    on:click={() => cancelEditing(translation.key)}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    {:else}
                                        <div class="flex items-center justify-between">
                                            <span>{translation.translatedValue}</span>
                                            {#if canEditTranslations}
                                                <button
                                                        class="ml-2 px-2 py-1 bg-blue-500 text-white rounded-md text-xs hover:bg-blue-600"
                                                        on:click={() => startEditing(translation)}
                                                >
                                                    Edit
                                                </button>
                                            {/if}
                                        </div>
                                    {/if}
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
                        {@const filteredGroupTranslations = filterTranslations(groupTranslations)}
                        {#if filteredGroupTranslations.length > 0}
                            <!-- Group header -->
                            <tr class="bg-gray-100 hover:bg-gray-200 cursor-pointer"
                                on:click={() => toggleGroup(groupKey)}>
                                <td class="py-2 px-4 border-b border-gray-200 font-medium">
                                    <div class="flex items-center">
                                        <span class="mr-2">{expandedGroups.has(groupKey) ? '▼' : '►'}</span>
                                        {formatGroupName(groupKey)}
                                    </div>
                                </td>
                                <td class="py-2 px-4 border-b border-gray-200" colspan="2">
                                    {filteredGroupTranslations.length} entries
                                </td>
                            </tr>

                            <!-- Group items (shown when expanded) -->
                            {#if expandedGroups.has(groupKey)}
                                {#each filteredGroupTranslations as translation}
                                    <tr class="bg-gray-50 hover:bg-gray-100">
                                        <td class="py-2 px-4 border-b border-gray-200 pl-8">{getDisplayKey(translation.key, groupKey)}</td>
                                        <td class="py-2 px-4 border-b border-gray-200">{translation.value}</td>
                                        <td class="py-2 px-4 border-b border-gray-200">
                                            {#if translation.translatedValue}
                                                {#if canEditTranslations && editingTranslations[translation.key]}
                                                    <div class="flex items-center space-x-2">
                                                        <input
                                                                type="text"
                                                                class="flex-grow px-2 py-1 border rounded-md text-sm"
                                                                placeholder="Edit translation"
                                                                bind:value={editedTranslations[translation.key]}
                                                        />
                                                        <button
                                                                class="px-3 py-1 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                                                on:click={() => updateTranslation(translation)}
                                                                disabled={updatingTranslations[translation.key]}
                                                        >
                                                            {#if updatingTranslations[translation.key]}
                                                                <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                                                                Saving
                                                            {:else}
                                                                Save
                                                            {/if}
                                                        </button>
                                                        <button
                                                                class="px-3 py-1 bg-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-400"
                                                                on:click={() => cancelEditing(translation.key)}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                {:else}
                                                    <div class="flex items-center justify-between">
                                                        <span>{translation.translatedValue}</span>
                                                        {#if canEditTranslations}
                                                            <button
                                                                    class="ml-2 px-2 py-1 bg-blue-500 text-white rounded-md text-xs hover:bg-blue-600"
                                                                    on:click={() => startEditing(translation)}
                                                            >
                                                                Edit
                                                            </button>
                                                        {/if}
                                                    </div>
                                                {/if}
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
                        {/if}
                    {/each}
                {/if}
                </tbody>
            </table>
        </div>
    {/if}
</div>