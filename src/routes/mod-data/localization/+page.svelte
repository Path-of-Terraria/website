<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import { TranslationEntryService } from '$lib/services/translation-entry-service';
    import { HjsonParserService } from '$lib/services/hjson-parser-service';
    import type { IEnglishTranslation, ITranslationEntry } from '$lib/models/localization';
    import { toast } from '$lib/toast';
    import { UserService } from '$lib/services/user-service';
    import {IsLoggedIn} from "$lib/services/session-service";
    import { Button } from 'flowbite-svelte';
    import { ChevronDownOutline } from 'flowbite-svelte-icons';

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

    let selectedLanguage: string = $state('');
    let englishTranslations: IEnglishTranslation[] = [];
    let languageTranslations: ITranslationEntry[] = [];
    let categories: string[] = $state([]);
    let categorizedTranslations: Record<string, IEnglishTranslation[]> = $state({});
    let activeCategory: string = $state('');
    let expandedGroups: Set<string> = $state(new Set());
    let showTranslationTable: boolean = $state(false);
    let newTranslations: Record<string, string> = $state({});
    let submitting: Record<string, boolean> = $state({});

    // Filter options
    let hideTranslatedEntries: boolean = $state(false);
    let searchQuery: string = $state('');

    // Edit related variables
    let editingTranslations: Record<string, boolean> = $state({});
    let editedTranslations: Record<string, string> = $state({});
    let updatingTranslations: Record<string, boolean> = $state({});

    // HJSON import related variables
    let hjsonContent: string = $state('');
    let importStats = $state({total: 0, added: 0, skipped: 0});
    let isImporting: boolean = $state(false);
    let selectedImportCategory: string = $state('');
    let importCategoryDropdownOpen: boolean = $state(false);
    let importCategoryDropdownContainer: HTMLDivElement | null = $state(null);
    let hjsonImportModal: HTMLDivElement | null = $state(null);
    const translationService = new TranslationEntryService();
    const hjsonParserService = new HjsonParserService();
    const userService = new UserService();
    
    // Flag to track if user has edit permissions
    let canEditTranslations = $state(false);

    function isValidLanguage(languageCode: string) {
        return availableLanguages.some((language) => language.code === languageCode);
    }

    function getSelectedLanguageName() {
        return availableLanguages.find((language) => language.code === selectedLanguage)?.name ?? '';
    }

    async function updateLanguageQueryParam(languageCode: string) {
        const url = new URL(page.url);

        if (languageCode) {
            url.searchParams.set("language", languageCode);
        } else {
            url.searchParams.delete("language");
        }

        await goto(url.toString(), { replaceState: true, keepFocus: true, noScroll: true });
    }

    async function applySelectedLanguage(languageCode: string) {
        if (!isValidLanguage(languageCode)) {
            return;
        }

        selectedLanguage = languageCode;
        selectedImportCategory = '';
        importCategoryDropdownOpen = false;
        hjsonContent = '';
        importStats = { total: 0, added: 0, skipped: 0 };
        await updateLanguageQueryParam(languageCode);
        await fetchLanguageTranslations();
    }

    async function clearSelectedLanguage() {
        selectedLanguage = '';
        languageTranslations = [];
        categories = [];
        categorizedTranslations = {};
        activeCategory = '';
        expandedGroups = new Set();
        showTranslationTable = false;
        selectedImportCategory = '';
        importCategoryDropdownOpen = false;
        hjsonContent = '';
        importStats = { total: 0, added: 0, skipped: 0 };
        await updateLanguageQueryParam('');
    }

    function openHjsonImportModal() {
        hjsonImportModal?.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeHjsonImportModal() {
        hjsonImportModal?.classList.add('hidden');
        document.body.style.overflow = '';
        importCategoryDropdownOpen = false;
    }

    onMount(() => {
        const handleDocumentClick = (event: MouseEvent) => {
            if (importCategoryDropdownContainer && !importCategoryDropdownContainer.contains(event.target as Node)) {
                importCategoryDropdownOpen = false;
            }
        };

        document.addEventListener("click", handleDocumentClick);

        (async () => {
            await fetchEnglishTranslations();
            canEditTranslations = await userService.hasRole("EditTranslations");

            const languageFromQuery = page.url.searchParams.get("language");
            if (languageFromQuery && isValidLanguage(languageFromQuery)) {
                await applySelectedLanguage(languageFromQuery);
            }
        })();

        return () => {
            document.removeEventListener("click", handleDocumentClick);
            document.body.style.overflow = '';
        };
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
     * Filters translations based on the hideTranslatedEntries setting and search query
     *
     * @param translations The translations to filter
     * @returns Filtered translations array
     */
    function filterTranslations(translations: any[]): any[] {
        let result = translations;

        if (hideTranslatedEntries) {
            result = result.filter(t => !t.translatedValue);
        }

        const q = searchQuery?.trim().toLowerCase();
        if (q) {
            result = result.filter(t => t.key.toLowerCase().includes(q));
        }

        return result;
    }

    /**
     * Toggles the expanded/collapsed state of a group
     *
     * @param groupKey The key of the group to toggle
     */
    function toggleGroup(groupKey: string) {
        // Reassign a new Set instance to trigger Svelte 5 runes reactivity for Set mutations
        const next = new Set(expandedGroups);
        if (next.has(groupKey)) {
            next.delete(groupKey);
        } else {
            next.add(groupKey);
        }
        expandedGroups = next;
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
        if (!key) return;
        if (!IsLoggedIn()) {
            toast.push('Please log in to add translations', {})
            return;
        }
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

<div class="container mx-auto px-4 py-24 text-white">
    <h1 class="mb-6 text-3xl font-black tracking-tight text-white">Terraria Mod Localization</h1>

    <!-- Language Selection -->
    {#if !showTranslationTable}
        <div class="mb-8 rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.07),transparent_30%),linear-gradient(180deg,rgba(17,24,39,0.96),rgba(9,14,24,0.94))] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.3)]">
            <h2 class="mb-4 text-xl font-semibold text-white">Select a Language</h2>
            <p class="mb-4 text-gray-300">Please select a language to view and edit translations:</p>

            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {#each availableLanguages as language}
                    <Button
                        class="cursor-pointer border-white/10 bg-white/8 text-white hover:bg-white/12"
                        onclick={() => {
                            selectedLanguage = language.code;
                        }}
                        type="button"
                    >
                        {language.name}
                    </Button>
                {/each}
            </div>

            <div class="mt-6 flex justify-end">
                <button
                        class="cursor-pointer rounded-md bg-sky-500 px-4 py-2 text-white hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={!selectedLanguage}
                        onclick={() => applySelectedLanguage(selectedLanguage)}
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
        <!-- Header with language info and reset button -->
        <div class="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
                <button
                    class="mb-3 flex cursor-pointer items-center rounded-md border border-white/10 bg-white/8 px-3 py-1.5 text-gray-200 hover:bg-white/12 hover:text-white"
                    onclick={clearSelectedLanguage}
                >
                    <span class="mr-1">&larr;</span> Select a Language
                </button>
                <span class="text-lg font-medium text-gray-300">Selected language: </span>
                <span class="text-lg font-bold text-white">{getSelectedLanguageName()}</span>
            </div>
            <div class="flex flex-wrap gap-3">
                <button
                    class="flex cursor-pointer items-center rounded-md bg-sky-500 px-3 py-1.5 text-white hover:bg-sky-400"
                    onclick={openHjsonImportModal}
                >
                    Import HJSON
                </button>
            </div>
        </div>

        <!-- HJSON Import Modal -->
        <div id="hjsonImportModal"
               bind:this={hjsonImportModal}
               class="fixed inset-0 z-50 hidden flex items-center justify-center bg-black/65">
            <div class="max-h-[88vh] w-[min(92vw,72rem)] overflow-y-auto overscroll-contain rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_30%),linear-gradient(180deg,rgba(17,24,39,0.98),rgba(9,14,24,0.97))] p-6 text-white shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:p-8">
                <h2 class="mb-4 text-xl font-semibold text-white">Import HJSON Translations</h2>
                <p class="mb-4 text-gray-300">Paste your HJSON content below. This will fill in missing translations for the selected
                    language ({availableLanguages.find(l => l.code === selectedLanguage)?.name}).</p>

                <div class="relative mb-4" bind:this={importCategoryDropdownContainer}>
                    <label for="categorySelect" class="mb-1 block text-sm font-medium text-gray-300">Select
                        Category</label>
                    <Button
                            id="categorySelect"
                            class="w-full justify-between border-white/10 bg-white/8 font-normal text-white hover:bg-white/12"
                            disabled={categories.length === 0}
                            onclick={() => {
                                if (categories.length > 0) {
                                    importCategoryDropdownOpen = !importCategoryDropdownOpen;
                                }
                            }}
                    >
                        <span>{selectedImportCategory || "Select a category"}</span>
                        <ChevronDownOutline class="ml-2 h-4 w-4 text-gray-400" />
                    </Button>
                    {#if importCategoryDropdownOpen}
                        <div class="absolute left-0 right-0 top-full z-20 mt-2 max-h-96 overflow-y-auto rounded-lg border border-white/10 bg-[#111827] p-1 text-white shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
                            {#each categories as category}
                                <button
                                        type="button"
                                        class="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-white transition hover:bg-white/10"
                                        onclick={() => {
                                            selectedImportCategory = category;
                                            importCategoryDropdownOpen = false;
                                        }}
                                >
                                    {category}
                                </button>
                            {/each}
                        </div>
                    {/if}
                    <p class="mt-1 text-sm text-gray-400">All imported translations will be assigned to this
                        category.</p>
                    {#if categories.length === 0}
                        <p class="mt-1 text-sm text-red-500">No categories available. Please select a language
                            first.</p>
                    {/if}
                </div>

                <textarea
                        class="mb-4 h-80 w-full rounded-md border border-white/10 bg-white/8 p-3 font-mono text-sm text-white placeholder:text-gray-500 lg:h-[28rem]"
                        placeholder="Paste your HJSON content here..."
                        bind:value={hjsonContent}
                ></textarea>

                {#if importStats.total > 0}
                    <div class="mb-4 rounded-md border border-sky-400/20 bg-sky-400/10 p-3">
                        <p class="text-sky-100">Import results:</p>
                        <ul class="list-disc pl-5">
                            <li>Total entries: {importStats.total}</li>
                            <li>Added translations: {importStats.added}</li>
                            <li>Skipped (already translated): {importStats.skipped}</li>
                        </ul>
                    </div>
                {/if}

                <div class="flex justify-end space-x-2">
                    <button
                            class="cursor-pointer rounded-md border border-white/10 bg-white/8 px-4 py-2 text-gray-200 hover:bg-white/12 hover:text-white"
                            onclick={closeHjsonImportModal}
                    >
                        Cancel
                    </button>
                    <button
                            class="flex cursor-pointer items-center rounded-md bg-sky-500 px-4 py-2 text-white hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
                            onclick={importHjsonTranslations}
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
        <div class="mb-4 border-b border-white/10">
            <ul class="flex flex-wrap -mb-px">
                {#each categories as category}
                    <li class="mr-2">
                        <button
                                class="inline-block rounded-t-lg border-b-2 p-4 {activeCategory === category ? 'border-sky-400 text-sky-300' : 'border-transparent text-gray-400 hover:border-white/10 hover:text-gray-200'}"
                                onclick={() => activeCategory = category}
                        >
                            {category}
                        </button>
                    </li>
                {/each}
            </ul>
        </div>

        <!-- Filter Options -->
        <div class="mb-4 flex items-center justify-between gap-4 flex-wrap">
            <label class="flex items-center">
                <input
                        type="checkbox"
                        class="mr-2"
                        bind:checked={hideTranslatedEntries}
                />
                <span class="text-sm text-gray-300">Hide already translated entries</span>
            </label>
            <div class="w-full sm:w-auto">
                <input
                        type="text"
                        class="mt-2 w-full rounded-md border border-white/10 bg-white/8 px-2 py-1 text-sm text-white placeholder:text-gray-500 sm:mt-0 sm:w-64"
                        placeholder="Search by key..."
                        bind:value={searchQuery}
                        aria-label="Search by key"
                />
            </div>
        </div>

        <!-- Translation Table -->
        <div class="overflow-x-auto rounded-[1.5rem] border border-white/10 bg-[#0a1016] shadow-[0_18px_50px_rgba(0,0,0,0.3)]">
            <table class="min-w-full border-collapse">
                <thead>
                <tr>
                    <th class="bg-white/[0.04] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                        Key
                    </th>
                    <th class="bg-white/[0.04] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                        English
                    </th>
                    <th class="bg-white/[0.04] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">{availableLanguages.find(l => l.code === selectedLanguage)?.name || 'Translation'}</th>
                </tr>
                </thead>
                <tbody>
                {#if categorizedTranslations[activeCategory]}
                    {@const {grouped, nonGrouped} = getGroupedTranslations(categorizedTranslations[activeCategory])}
                    {@const filteredNonGrouped = filterTranslations(nonGrouped)}

                    <!-- Non-grouped translations -->
                    {#each filteredNonGrouped as translation}
                        <tr class="border-t border-white/8 hover:bg-white/[0.025]">
                            <td class="px-4 py-3 text-gray-200">{getDisplayKey(translation.key)}</td>
                            <td class="px-4 py-3 text-gray-300">{translation.value}</td>
                            <td class="px-4 py-3 text-gray-200">
                                {#if translation.translatedValue}
                                    {#if canEditTranslations && editingTranslations[translation.key]}
                                        <div class="flex items-center space-x-2">
                                            <input
                                                    type="text"
                                                    class="grow rounded-md border border-white/10 bg-white/8 px-2 py-1 text-sm text-white placeholder:text-gray-500"
                                                    placeholder="Edit translation"
                                                    bind:value={editedTranslations[translation.key]}
                                            />
                                            <button
                                                    class="flex items-center rounded-md bg-emerald-500 px-3 py-1 text-sm text-white hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                                                    onclick={() => updateTranslation(translation)}
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
                                                    class="rounded-md border border-white/10 bg-white/8 px-3 py-1 text-sm text-gray-200 hover:bg-white/12 hover:text-white"
                                                    onclick={() => cancelEditing(translation.key)}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    {:else}
                                        <div class="flex items-center justify-between">
                                            <span>{translation.translatedValue}</span>
                                            {#if canEditTranslations}
                                                <button
                                                        class="ml-2 rounded-md bg-sky-500 px-2 py-1 text-xs text-white hover:bg-sky-400"
                                                        onclick={() => startEditing(translation)}
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
                                                class="grow rounded-md border border-white/10 bg-white/8 px-2 py-1 text-sm text-white placeholder:text-gray-500"
                                                placeholder="Add translation"
                                                bind:value={newTranslations[translation.key]}
                                        />
                                        <button
                                                class="flex items-center rounded-md bg-emerald-500 px-3 py-1 text-sm text-white hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                                                onclick={() => submitTranslation(translation.key)}
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
                            <tr class="cursor-pointer bg-white/[0.05] hover:bg-white/[0.08]"
                                onclick={() => toggleGroup(groupKey)}>
                                <td class="border-t border-white/8 px-4 py-3 font-medium text-white">
                                    <div class="flex items-center">
                                        <span class="mr-2">{expandedGroups.has(groupKey) ? '▼' : '►'}</span>
                                        {formatGroupName(groupKey)}
                                    </div>
                                </td>
                                <td class="border-t border-white/8 px-4 py-3 text-gray-300" colspan="2">
                                    {filteredGroupTranslations.length} entries
                                </td>
                            </tr>

                            <!-- Group items (shown when expanded) -->
                            {#if expandedGroups.has(groupKey)}
                                {#each filteredGroupTranslations as translation}
                                    <tr class="border-t border-white/8 bg-white/[0.02] hover:bg-white/[0.04]">
                                        <td class="px-4 py-3 pl-8 text-gray-200">{getDisplayKey(translation.key, groupKey)}</td>
                                        <td class="px-4 py-3 text-gray-300">{translation.value}</td>
                                        <td class="px-4 py-3 text-gray-200">
                                            {#if translation.translatedValue}
                                                {#if canEditTranslations && editingTranslations[translation.key]}
                                                    <div class="flex items-center space-x-2">
                                                        <input
                                                                type="text"
                                                                class="grow rounded-md border border-white/10 bg-white/8 px-2 py-1 text-sm text-white placeholder:text-gray-500"
                                                                placeholder="Edit translation"
                                                                bind:value={editedTranslations[translation.key]}
                                                        />
                                                        <button
                                                                class="flex items-center rounded-md bg-emerald-500 px-3 py-1 text-sm text-white hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                                                                onclick={() => updateTranslation(translation)}
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
                                                                class="rounded-md border border-white/10 bg-white/8 px-3 py-1 text-sm text-gray-200 hover:bg-white/12 hover:text-white"
                                                                onclick={() => cancelEditing(translation.key)}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                {:else}
                                                    <div class="flex items-center justify-between">
                                                        <span>{translation.translatedValue}</span>
                                                        {#if canEditTranslations}
                                                            <button
                                                                    class="ml-2 rounded-md bg-sky-500 px-2 py-1 text-xs text-white hover:bg-sky-400"
                                                                    onclick={() => startEditing(translation)}
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
                                                            class="grow rounded-md border border-white/10 bg-white/8 px-2 py-1 text-sm text-white placeholder:text-gray-500"
                                                            placeholder="Add translation"
                                                            bind:value={newTranslations[translation.key]}
                                                    />
                                                    <button
                                                            class="flex items-center rounded-md bg-emerald-500 px-3 py-1 text-sm text-white hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                                                            onclick={() => submitTranslation(translation.key)}
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
