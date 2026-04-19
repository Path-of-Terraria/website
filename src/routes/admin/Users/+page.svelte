<script lang="ts">
    import { UserService } from "$lib/services/user-service";
    import { BenefitsService } from "$lib/services/benefit-service";
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import { goto } from "$app/navigation";
    import { Button, Input, Card, Label, Checkbox, P, Select } from "flowbite-svelte";
    import type {IUser} from "$lib/stores/user-store";
    import type {AvailableBenefitsResponse} from "$lib/services/benefit-service";

    let userService = new UserService();
    let benefitsService = new BenefitsService();
    let profileName = $state("");
    let user: IUser | null = $state(null);
    let loading = $state(false);
    let error = $state("");
    let saveLoading = $state(false);
    let saveSuccess = $state(false);
    let saveError = $state("");

    let availableBenefits: AvailableBenefitsResponse = $state({ supporterPacks: [], subscriptions: [] });
    let selectedSupporterPacks: string[] = $state([]);
    let selectedSubscription = $state("");
    let newSupporterPack = $state("");
    let benefitsSaveLoading = $state(false);
    let benefitsSaveSuccess = $state(false);
    let benefitsSaveError = $state("");

    const availableRoles = ["ViewAdminPanel", "EditTranslations", "UpdateRoles", "ManageBenefits"];

    let selectedRoles: string[] = $state([]);

    async function loadAvailableBenefits() {
        try {
            availableBenefits = await benefitsService.GetAvailable();
        } catch (e) {
            console.error("Error loading available benefits:", e);
        }
    }

    function normalizeSubscription(subscription: string) {
        return subscription.replace(/\s+/g, '');
    }

    function findMatchingSubscription() {
        if (!user?.supporterSubscription) {
            console.log("User has no subscription");
            return "";
        }

        if (availableBenefits.subscriptions.includes(user.supporterSubscription)) {
            return user?.supporterSubscription;
        }

        const normalizedUser = normalizeSubscription(user?.supporterSubscription);
        console.log("Normalized user subscription:", normalizedUser);
        return availableBenefits.subscriptions.find(sub => normalizeSubscription(sub) === normalizedUser) || "";
    }

    onMount(() => {
        loadAvailableBenefits();
        const search = page.url.searchParams.get("search");
        if (search) {
            profileName = search;
            searchUser();
        }
    });

    async function searchUser(event?: SubmitEvent) {
        if (event) event.preventDefault();

        if (!profileName.trim()) {
            error = "Please enter a profile name";
            return;
        }

        error = "";
        loading = true;

        const url = new URL(page.url);
        url.searchParams.set("search", profileName);
        goto(url.toString(), { replaceState: true, keepFocus: true });

        try {
            user = await userService.getUser(profileName);
            if (!user) {
                error = `User with profile name "${profileName}" not found`;
            } else {
                selectedRoles = user.roles || [];
                selectedSupporterPacks = user.supporterPacks || [];
                selectedSubscription = findMatchingSubscription();
                console.log("Selected subscription:", selectedSubscription);
            }
        } catch (e) {
            error = "Error fetching user data";
            console.error(e);
        } finally {
            loading = false;
        }
    }

    function toggleRole(role: string) {
        if (selectedRoles.includes(role)) {
            selectedRoles = selectedRoles.filter(r => r !== role);
        } else {
            selectedRoles = [...selectedRoles, role];
        }
    }

    async function saveUserData() {
        if (!user) return;

        saveLoading = true;
        saveSuccess = false;
        saveError = "";

        try {
            const updatedUser = {
                ...user,
                roles: selectedRoles
            };
            const response = await userService.updateUserRoles(updatedUser);

            if (response) {
                saveSuccess = true;
                user = updatedUser;
            } else {
                saveError = "Failed to update user data";
            }
        } catch (e) {
            saveError = "Error updating user data";
            console.error(e);
        } finally {
            saveLoading = false;

            if (saveSuccess) {
                setTimeout(() => {
                    saveSuccess = false;
                }, 3000);
            }
        }
    }

    function addSupporterPack() {
        if (newSupporterPack && !selectedSupporterPacks.includes(newSupporterPack)) {
            selectedSupporterPacks = [...selectedSupporterPacks, newSupporterPack];
            newSupporterPack = "";
        }
    }

    function removeSupporterPack(packToRemove: string) {
        selectedSupporterPacks = selectedSupporterPacks.filter(pack => pack !== packToRemove);
    }

    async function saveBenefits() {
        if (!user) return;

        benefitsSaveLoading = true;
        benefitsSaveSuccess = false;
        benefitsSaveError = "";

        try {
            const request = {
                supporterPacks: selectedSupporterPacks,
                subscription: selectedSubscription
            };

            const response = await userService.updateBenefits(user.id, request);

            if (response) {
                benefitsSaveSuccess = true;
                // Update local user object with new benefits
                user = {
                    ...user,
                    supporterPacks: selectedSupporterPacks,
                    supporterSubscription: selectedSubscription
                };
            } else {
                benefitsSaveError = "Failed to update benefits";
            }
        } catch (e) {
            benefitsSaveError = "Error updating benefits";
            console.error(e);
        } finally {
            benefitsSaveLoading = false;

            // Clear success message after 3 seconds
            if (benefitsSaveSuccess) {
                setTimeout(() => {
                    benefitsSaveSuccess = false;
                }, 3000);
            }
        }
    }
</script>

<div class="container mx-auto px-4 py-24 text-white">
    <div class="mb-4 flex items-center">
        <a href="/admin" class="mr-3 text-sm font-semibold text-sky-300 hover:underline">← Back to Admin</a>
        <h1 class="text-3xl font-black tracking-tight text-white">User Management</h1>
    </div>

    <div class="mx-auto mb-8 max-w-md rounded-[1.75rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_30%),linear-gradient(180deg,rgba(17,24,39,0.96),rgba(9,14,24,0.94))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-sm">
        <form onsubmit={searchUser} class="flex flex-col gap-4">
            <div>
                <Label for="profileName" class="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-gray-300">Search User by Profile Name</Label>
                <div class="flex">
                    <Input
                        id="profileName"
                        bind:value={profileName}
                        placeholder="Enter profile name"
                        required
                        class="border-white/10 bg-white/8 text-white placeholder:text-gray-500"
                    />
                    <Button
                        type="submit"
                        class="ml-2 border-sky-400/20 bg-sky-500 text-white hover:bg-sky-400 disabled:border-white/10 disabled:bg-white/8 disabled:text-gray-400"
                        disabled={loading}
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </Button>
                </div>
                {#if error}
                    <p class="mt-2 text-sm text-red-300">{error}</p>
                {/if}
            </div>
        </form>
    </div>

    {#if user}
        <Card class="mx-auto max-w-md border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_30%),linear-gradient(180deg,rgba(17,24,39,0.98),rgba(9,14,24,0.96))] p-4 text-white shadow-[0_30px_90px_rgba(0,0,0,0.38)] sm:p-6 md:p-8">
            <h5 class="mb-4 text-xl font-semibold text-white">User Details</h5>
            <div class="space-y-2">
                <div class="flex justify-between">
                    <span class="text-base font-normal text-gray-400">Profile Name:</span>
                    <span class="font-semibold text-white">{user.profileName}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-base font-normal text-gray-400">Email:</span>
                    <span class="font-semibold text-white">{user.email}</span>
                </div>
                {#if user.steamId}
                    <div class="flex justify-between">
                        <span class="text-base font-normal text-gray-400">Steam ID:</span>
                        <span class="font-semibold text-white">{user.steamId}</span>
                    </div>
                {/if}

                <div class="mt-6 border-t border-white/10 pt-4">
                    <h6 class="mb-3 text-lg font-medium text-gray-200">Role Management</h6>

                    <div class="space-y-2">
                        {#each availableRoles as role}
                            <div class="flex items-center">
                                <Checkbox
                                    checked={selectedRoles.includes(role)}
                                    onchange={() => toggleRole(role)}
                                    class="border-white/20 bg-white/8 text-emerald-400 focus:ring-emerald-400/50"
                                />
                                <span class="ml-2 text-gray-100">{role}</span>
                            </div>
                        {/each}
                    </div>

                    <div class="mt-4">
                        <Button
                            size="sm"
                            class="border-sky-400/20 bg-sky-500 text-white hover:bg-sky-400 disabled:border-white/10 disabled:bg-white/8 disabled:text-gray-400"
                            disabled={saveLoading}
                            onclick={saveUserData}
                        >
                            {saveLoading ? 'Saving...' : 'Save Changes'}
                        </Button>

                        {#if saveSuccess}
                            <P color="green" class="mt-2">User data updated successfully!</P>
                        {/if}

                        {#if saveError}
                            <P color="red" class="mt-2">{saveError}</P>
                        {/if}
                    </div>
                </div>

                <!-- Benefits Management Section -->
                <div class="mt-6 border-t border-white/10 pt-4">
                    <h6 class="mb-3 text-lg font-medium text-gray-200">Benefits Management</h6>

                    <div class="space-y-4">
                        <!-- Supporter Packs -->
                        <div>
                            <Label class="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-gray-300">Supporter Packs</Label>

                            <!-- Display current supporter packs as chips -->
                            {#if selectedSupporterPacks.length > 0}
                                <div class="flex flex-wrap gap-2 mb-3">
                                    {#each selectedSupporterPacks as pack}
                                        <div class="flex items-center rounded-full border border-sky-400/20 bg-sky-400/12 px-3 py-1 text-sm font-medium text-sky-100">
                                            {pack}
                                            <button
                                                type="button"
                                                class="ml-2 text-sky-200 transition-colors hover:text-white"
                                                onclick={() => removeSupporterPack(pack)}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    {/each}
                                </div>
                            {:else}
                                <p class="mb-3 text-sm text-gray-400">No supporter packs assigned</p>
                            {/if}

                            <!-- Dropdown to add new supporter pack -->
                            <div class="flex gap-2">
                                <Select
                                    id="newSupporterPack"
                                    bind:value={newSupporterPack}
                                    placeholder="Select a supporter pack to add"
                                    class="flex-1 border-white/10 bg-white/8 text-white"
                                >
                                    <option value="">Select supporter pack</option>
                                    {#each availableBenefits.supporterPacks.filter(pack => !selectedSupporterPacks.includes(pack)) as pack}
                                        <option value={pack}>{pack}</option>
                                    {/each}
                                </Select>
                                <Button
                                    type="button"
                                    size="sm"
                                    class="border-sky-400/20 bg-sky-500 text-white hover:bg-sky-400 disabled:border-white/10 disabled:bg-white/8 disabled:text-gray-400"
                                    onclick={addSupporterPack}
                                    disabled={!newSupporterPack}
                                >
                                    Add
                                </Button>
                            </div>
                        </div>

                        <!-- Subscription Dropdown -->
                        <div>
                            <Label for="subscription" class="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-gray-300">Subscription</Label>
                            <Select
                                id="subscription"
                                bind:value={selectedSubscription}
                                placeholder="Select a subscription"
                                class="border-white/10 bg-white/8 text-white"
                            >
                                <option value="">None</option>
                                {#each availableBenefits.subscriptions as subscription}
                                    <option value={subscription}>{subscription}</option>
                                {/each}
                            </Select>
                        </div>

                        <!-- Benefits Save Button -->
                        <div class="mt-4">
                            <Button
                                size="sm"
                                class="border-emerald-400/20 bg-emerald-500 text-white hover:bg-emerald-400 disabled:border-white/10 disabled:bg-white/8 disabled:text-gray-400"
                                disabled={benefitsSaveLoading}
                                onclick={saveBenefits}
                            >
                                {benefitsSaveLoading ? 'Saving Benefits...' : 'Save Benefits'}
                            </Button>

                            {#if benefitsSaveSuccess}
                                <P class="mt-2 text-emerald-300">Benefits updated successfully!</P>
                            {/if}

                            {#if benefitsSaveError}
                                <P color="red" class="mt-2">{benefitsSaveError}</P>
                            {/if}
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    {/if}
</div>
