<script lang="ts">
    import { UserService } from "$lib/services/user-service";
    import {onDestroy, onMount} from "svelte";
    import { Button, Card, Label, P } from "flowbite-svelte";
    import { ChevronDownOutline } from "flowbite-svelte-icons";
    import {type IUser, user} from "$lib/stores/user-store";

    let userService = new UserService();
    let loading = $state(false);
    let error = $state("");
    let saveLoading = $state(false);
    let saveSuccess = $state(false);
    let saveError = $state("");

    let availableBenefits = $state({ icons: [], colors: [] });
    let selectedIcon = $state("");
    let selectedColor = $state("");
    let iconDropdownOpen = $state(false);
    let colorDropdownOpen = $state(false);
    let currentUser: IUser | null = $state(null);
    let iconDropdownContainer: HTMLDivElement | null = $state(null);
    let colorDropdownContainer: HTMLDivElement | null = $state(null);

    const unsubscribe = user.subscribe(value => {
        currentUser = value as unknown as IUser;
        console.log("Current user:", currentUser);

        if (currentUser?.chosenBenefits) {
            selectedIcon = currentUser.chosenBenefits.chatIcon.value || "";
            selectedColor = currentUser.chosenBenefits.chatColor.value || "";
        }
    });

    // Cleanup on component destruction
    onDestroy(() => {
        unsubscribe();
    });

    async function loadMyBenefits() {
        loading = true;
        error = "";
        try {
            const response = await userService.getMyBenefits("");
            if (response && response.data) {
                availableBenefits = response.data;
            } else {
                availableBenefits = { icons: [], colors: [] };
            }
        } catch (e) {
            error = "Error loading benefits";
            console.error(e);
        } finally {
            loading = false;
        }
    }

    async function saveBenefits() {
        saveLoading = true;
        saveSuccess = false;
        saveError = "";

        try {
            const request = {
                chatIcon: selectedIcon,
                chatColor: selectedColor
            };

            const response = await userService.updateMyBenefits("", request);

            if (response) {
                saveSuccess = true;
                setTimeout(() => {
                    saveSuccess = false;
                }, 3000);
            } else {
                saveError = "Failed to update benefits";
            }
        } catch (e) {
            saveError = "Error saving benefits";
            console.error(e);
        } finally {
            saveLoading = false;
        }
    }

    onMount(() => {
        const handleDocumentClick = (event: MouseEvent) => {
            if (iconDropdownContainer && !iconDropdownContainer.contains(event.target as Node)) {
                iconDropdownOpen = false;
            }
            if (colorDropdownContainer && !colorDropdownContainer.contains(event.target as Node)) {
                colorDropdownOpen = false;
            }
        };

        document.addEventListener("click", handleDocumentClick);
        loadMyBenefits();

        return () => {
            document.removeEventListener("click", handleDocumentClick);
        };
    });
</script>

<div class="container mx-auto px-4 py-24 text-white">
    <div class="mb-4 flex items-center">
        <h1 class="text-3xl font-black tracking-tight text-white">Benefit Management</h1>
    </div>

    {#if loading}
        <div class="flex justify-center">
            <P>Loading benefits...</P>
        </div>
    {:else if error}
        <div class="flex justify-center">
            <P color="red">{error}</P>
        </div>
    {:else}
        <Card class="mx-auto max-w-md border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.07),transparent_30%),linear-gradient(180deg,rgba(17,24,39,0.96),rgba(9,14,24,0.94))] p-4 text-white shadow-[0_20px_60px_rgba(0,0,0,0.28)] sm:p-6 md:p-8">
            <div class="mb-6 flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h5 class="text-xl font-medium text-gray-300">Manage Your Benefits</h5>
                    <p class="mt-1 text-sm text-gray-400">Choose your available chat icon and color, or review current supporter packs.</p>
                </div>
                <div class="sm:pt-1">
                    <a
                        href="/supporter-packs"
                        class="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-gray-200 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                        View Supporter Packs
                    </a>
                </div>
            </div>

            <div class="space-y-6">

                <!-- Icon Selector -->
                <div class="relative" bind:this={iconDropdownContainer}>
                    <Label for="icon" class="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-gray-300">Chat Icon</Label>
                    <Button
                            id="icon"
                            class="w-full justify-between border-white/10 bg-white/8 font-normal text-white hover:bg-white/12"
                            disabled={availableBenefits.icons.length === 0}
                            onclick={() => {
                                if (availableBenefits.icons.length > 0) {
                                    colorDropdownOpen = false;
                                    iconDropdownOpen = !iconDropdownOpen;
                                }
                            }}
                        >
                        <span>{selectedIcon || "Select an icon"}</span>
                        <ChevronDownOutline class="ml-2 h-4 w-4 text-gray-400" />
                    </Button>
                    {#if iconDropdownOpen}
                        <div class="absolute left-0 right-0 top-full z-20 mt-2 max-h-60 overflow-y-auto rounded-lg border border-white/10 bg-[#111827] p-1 text-white shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
                            <button
                                type="button"
                                class="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-white transition hover:bg-white/10"
                                onclick={() => { selectedIcon = ""; iconDropdownOpen = false; }}
                            >
                                None
                            </button>
                            {#if availableBenefits.icons.length === 0}
                                <div class="px-3 py-2 text-sm text-gray-400">No icons available</div>
                            {:else}
                                {#each availableBenefits.icons as icon}
                                    <button
                                        type="button"
                                        class="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-white transition hover:bg-white/10"
                                        onclick={() => { selectedIcon = icon; iconDropdownOpen = false; }}
                                    >
                                        {icon}
                                    </button>
                                {/each}
                            {/if}
                        </div>
                    {/if}
                    {#if availableBenefits.icons.length === 0}
                        <p class="mt-1 text-sm text-gray-400">No icon benefits available to you</p>
                    {/if}
                </div>

                <!-- Color Selector -->
                <div class="relative" bind:this={colorDropdownContainer}>
                    <Label for="color-button" class="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-gray-300">Chat Color</Label>
                    <Button
                        id="color-button"
                        class="w-full justify-between border-white/10 bg-white/8 font-normal text-white hover:bg-white/12"
                        disabled={availableBenefits.colors.length === 0}
                        onclick={() => {
                            if (availableBenefits.colors.length > 0) {
                                iconDropdownOpen = false;
                                colorDropdownOpen = !colorDropdownOpen;
                            }
                        }}
                    >
                        <div class="flex items-center">
                            {#if selectedColor}
                                <div class="w-4 h-4 rounded-sm mr-2 border border-gray-200" style="background-color: {selectedColor}"></div>
                                {selectedColor}
                            {:else}
                                Select a color
                            {/if}
                        </div>
                        <ChevronDownOutline class="ml-2 h-4 w-4 text-gray-400" />
                    </Button>
                    {#if colorDropdownOpen}
                        <div class="absolute left-0 right-0 top-full z-20 mt-2 max-h-60 overflow-y-auto rounded-lg border border-white/10 bg-[#111827] p-1 text-white shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
                            <button
                                type="button"
                                class="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-white transition hover:bg-white/10"
                                onclick={() => { selectedColor = ""; colorDropdownOpen = false; }}
                            >
                                None
                            </button>
                            {#if availableBenefits.colors.length === 0}
                                <div class="px-3 py-2 text-sm text-gray-400">No colors available</div>
                            {:else}
                                {#each availableBenefits.colors as color}
                                    <button
                                        type="button"
                                        class="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-white transition hover:bg-white/10"
                                        onclick={() => { selectedColor = color; colorDropdownOpen = false; }}
                                    >
                                        <div class="mr-2 h-4 w-4 rounded-sm border border-gray-200" style="background-color: {color}"></div>
                                        {color}
                                    </button>
                                {/each}
                            {/if}
                        </div>
                    {/if}
                    {#if availableBenefits.colors.length === 0}
                        <p class="mt-1 text-sm text-gray-400">No color benefits available to you</p>
                    {/if}

                    <!-- Color Preview -->
                    {#if selectedColor}
                        <div class="mt-2">
                            <p class="text-sm text-gray-400">Preview:</p>
                            <div class="mt-1 flex items-center">
                                <div
                                    class="w-6 h-6 rounded border mr-2"
                                    style="background-color: {selectedColor};"
                                ></div>
                                <span style="color: {selectedColor};">Sample chat text</span>
                            </div>
                        </div>
                    {/if}
                </div>

                <!-- Save Button -->
                <div class="mt-6">
                    <Button
                        color="blue"
                        disabled={saveLoading || (availableBenefits.icons.length === 0 && availableBenefits.colors.length === 0)}
                        onclick={saveBenefits}
                        class="w-full"
                    >
                        {saveLoading ? 'Saving...' : 'Save Benefits'}
                    </Button>

                    {#if saveSuccess}
                        <P color="green" class="mt-2 text-center">Benefits updated successfully!</P>
                    {/if}

                    {#if saveError}
                        <P color="red" class="mt-2 text-center">{saveError}</P>
                    {/if}
                </div>

                {#if availableBenefits.icons.length === 0 && availableBenefits.colors.length === 0}
                    <div class="text-center mt-4">
                        <P class="text-gray-300">You don't have any benefits available at this time.</P>
                        <P class="mt-2 text-sm text-gray-400">Consider upgrading to a supporter pack to unlock chat customization options!</P>
                    </div>
                {/if}
            </div>
        </Card>
    {/if}
</div>
