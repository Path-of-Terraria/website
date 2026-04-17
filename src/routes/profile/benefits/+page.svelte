<script lang="ts">
    import { UserService } from "$lib/services/user-service";
    import {onDestroy, onMount} from "svelte";
    import { Button, Card, Label, Select, P, Dropdown, DropdownItem } from "flowbite-svelte";
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
    let colorDropdownOpen = $state(false);
    let currentUser: IUser | null = $state(null);

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
        loadMyBenefits();
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
            <h5 class="mb-4 text-xl font-medium text-gray-300">Manage Your Benefits</h5>

            <div class="space-y-6">
                <!-- Icon Selector -->
                <div>
                    <Label for="icon" class="mb-2">Chat Icon</Label>
                    <Select
                        id="icon"
                        bind:value={selectedIcon}
                        placeholder="Select an icon"
                        disabled={availableBenefits.icons.length === 0}
                    >
                        <option value="">None</option>
                        {#if availableBenefits.icons.length === 0}
                            <option value="" disabled>No icons available</option>
                        {:else}
                            {#each availableBenefits.icons as icon}
                                <option value={icon}>{icon}</option>
                            {/each}
                        {/if}
                    </Select>
                    {#if availableBenefits.icons.length === 0}
                        <p class="mt-1 text-sm text-gray-400">No icon benefits available to you</p>
                    {/if}
                </div>

                <!-- Color Selector -->
                <div>
                    <Label for="color-button" class="mb-2">Chat Color</Label>
                    <Button id="color-button" class="w-full justify-between border-white/10 bg-white/8 font-normal text-white hover:bg-white/12" disabled={availableBenefits.colors.length === 0}>
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
                    <Dropdown triggeredBy="#color-button" bind:isOpen={colorDropdownOpen} class="max-h-60 overflow-y-auto border border-white/10 bg-[#111827] text-white shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
                        <DropdownItem onclick={() => { selectedColor = ""; colorDropdownOpen = false; }}>None</DropdownItem>
                        {#if availableBenefits.colors.length === 0}
                            <DropdownItem disabled>No colors available</DropdownItem>
                        {:else}
                            {#each availableBenefits.colors as color}
                                <DropdownItem onclick={() => { selectedColor = color; colorDropdownOpen = false; }}>
                                    <div class="flex items-center">
                                        <div class="w-4 h-4 rounded-sm mr-2 border border-gray-200" style="background-color: {color}"></div>
                                        {color}
                                    </div>
                                </DropdownItem>
                            {/each}
                        {/if}
                    </Dropdown>
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
