<script lang="ts">
    import { UserService } from "$lib/services/user-service";
    import { BenefitsService } from "$lib/services/benefit-service";
    import { onMount } from "svelte";
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
    });

    async function searchUser(event: SubmitEvent) {
        event.preventDefault();

        if (!profileName.trim()) {
            error = "Please enter a profile name";
            return;
        }

        error = "";
        loading = true;
        try {
            user = await userService.getUser(profileName);
            console.log('user', user);
            if (!user) {
                error = `User with profile name "${profileName}" not found`;
            } else {
                selectedRoles = user.roles || [];
                selectedSupporterPacks = user.supporterPacks || [];
                selectedSubscription = findMatchingSubscription();
                console.log(selectedSubscription);
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

<div class="container mx-auto p-4">
    <div class="flex items-center mb-4">
        <a href="/admin" class="text-blue-600 hover:underline mr-2">← Back to Admin</a>
        <h1 class="text-2xl font-bold">User Management</h1>
    </div>

    <div class="max-w-md mx-auto mb-8">
        <form onsubmit={searchUser} class="flex flex-col gap-4">
            <div>
                <Label for="profileName" class="mb-2">Search User by Profile Name</Label>
                <div class="flex">
                    <Input id="profileName" bind:value={profileName} placeholder="Enter profile name" required />
                    <Button type="submit" color="blue" class="ml-2" disabled={loading}>
                        {loading ? 'Searching...' : 'Search'}
                    </Button>
                </div>
                {#if error}
                    <p class="text-red-500 mt-2">{error}</p>
                {/if}
            </div>
        </form>
    </div>

    {#if user}
        <Card class="max-w-md mx-auto p-4 sm:p-6 md:p-8">
            <h5 class="mb-4 text-xl font-medium text-gray-500 dark:text-gray-400">User Details</h5>
            <div class="space-y-2">
                <div class="flex justify-between">
                    <span class="text-base font-normal text-gray-500 dark:text-gray-400">Profile Name:</span>
                    <span class="font-semibold">{user.profileName}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-base font-normal text-gray-500 dark:text-gray-400">Email:</span>
                    <span class="font-semibold">{user.email}</span>
                </div>
                {#if user.steamId}
                    <div class="flex justify-between">
                        <span class="text-base font-normal text-gray-500 dark:text-gray-400">Steam ID:</span>
                        <span class="font-semibold">{user.steamId}</span>
                    </div>
                {/if}

                <!-- Role Management Section -->
                <div class="mt-6 pt-4 border-t border-gray-200">
                    <h6 class="mb-3 text-lg font-medium text-gray-500 dark:text-gray-400">Role Management</h6>

                    <div class="space-y-2">
                        {#each availableRoles as role}
                            <div class="flex items-center">
                                <Checkbox
                                    checked={selectedRoles.includes(role)}
                                    onchange={() => toggleRole(role)}
                                />
                                <span class="ml-2">{role}</span>
                            </div>
                        {/each}
                    </div>

                    <div class="mt-4">
                        <Button
                            color="blue"
                            size="sm"
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
                <div class="mt-6 pt-4 border-t border-gray-200">
                    <h6 class="mb-3 text-lg font-medium text-gray-500 dark:text-gray-400">Benefits Management</h6>

                    <div class="space-y-4">
                        <!-- Supporter Packs -->
                        <div>
                            <Label class="mb-2">Supporter Packs</Label>

                            <!-- Display current supporter packs as chips -->
                            {#if selectedSupporterPacks.length > 0}
                                <div class="flex flex-wrap gap-2 mb-3">
                                    {#each selectedSupporterPacks as pack}
                                        <div class="flex items-center bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                                            {pack}
                                            <button
                                                type="button"
                                                class="ml-2 text-blue-600 hover:text-blue-800"
                                                onclick={() => removeSupporterPack(pack)}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    {/each}
                                </div>
                            {:else}
                                <p class="text-gray-500 text-sm mb-3">No supporter packs assigned</p>
                            {/if}

                            <!-- Dropdown to add new supporter pack -->
                            <div class="flex gap-2">
                                <Select
                                    id="newSupporterPack"
                                    bind:value={newSupporterPack}
                                    placeholder="Select a supporter pack to add"
                                    class="flex-1"
                                >
                                    <option value="">Select supporter pack</option>
                                    {#each availableBenefits.supporterPacks.filter(pack => !selectedSupporterPacks.includes(pack)) as pack}
                                        <option value={pack}>{pack}</option>
                                    {/each}
                                </Select>
                                <Button
                                    type="button"
                                    color="blue"
                                    size="sm"
                                    onclick={addSupporterPack}
                                    disabled={!newSupporterPack}
                                >
                                    Add
                                </Button>
                            </div>
                        </div>

                        <!-- Subscription Dropdown -->
                        <div>
                            <Label for="subscription" class="mb-2">Subscription</Label>
                            <Select
                                id="subscription"
                                bind:value={selectedSubscription}
                                placeholder="Select a subscription"
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
                                color="green"
                                size="sm"
                                disabled={benefitsSaveLoading}
                                onclick={saveBenefits}
                            >
                                {benefitsSaveLoading ? 'Saving Benefits...' : 'Save Benefits'}
                            </Button>

                            {#if benefitsSaveSuccess}
                                <P color="green" class="mt-2">Benefits updated successfully!</P>
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
