<script lang="ts">
    import { UserService } from "$lib/services/user-service";
    import { onMount } from "svelte";
    import { Button, Input, Card, Label, Checkbox, P } from "flowbite-svelte";
    import type {IUser} from "$lib/stores/user-store";
    
    let userService = new UserService();
    let profileName = "";
    let user: IUser | null = null;
    let loading = false;
    let error = "";
    let saveLoading = false;
    let saveSuccess = false;
    let saveError = "";
    
    // Available roles
    const availableRoles = ["ViewAdminPanel", "EditTranslations"];
    
    // Selected roles
    let selectedRoles: string[] = [];
    
    async function searchUser() {
        if (!profileName.trim()) {
            error = "Please enter a profile name";
            return;
        }
        
        error = "";
        loading = true;
        try {
            user = await userService.getUser(profileName);
            if (!user) {
                error = `User with profile name "${profileName}" not found`;
            } else {
                // Initialize selected roles from user
                selectedRoles = user.roles || [];
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
    
    async function saveRoles() {
        if (!user) return;
        
        saveLoading = true;
        saveSuccess = false;
        saveError = "";
        
        try {
            // Update user with selected roles
            const updatedUser = { ...user, roles: selectedRoles };
            const response = await userService.updateUserRoles(updatedUser);
            
            if (response) {
                saveSuccess = true;
                // Update local user object
                user = updatedUser;
            } else {
                saveError = "Failed to update user roles";
            }
        } catch (e) {
            saveError = "Error updating user roles";
            console.error(e);
        } finally {
            saveLoading = false;
            
            // Clear success message after 3 seconds
            if (saveSuccess) {
                setTimeout(() => {
                    saveSuccess = false;
                }, 3000);
            }
        }
    }
</script>

<div class="container mx-auto p-4">
    <div class="flex items-center mb-4">
        <a href="/Admin" class="text-blue-600 hover:underline mr-2">← Back to Admin</a>
        <h1 class="text-2xl font-bold">User Management</h1>
    </div>
    
    <div class="max-w-md mx-auto mb-8">
        <form on:submit|preventDefault={searchUser} class="flex flex-col gap-4">
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
        <Card class="max-w-md mx-auto">
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
                                    on:change={() => toggleRole(role)}
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
                            on:click={saveRoles}
                        >
                            {saveLoading ? 'Saving...' : 'Save Roles'}
                        </Button>
                        
                        {#if saveSuccess}
                            <P color="green" class="mt-2">Roles updated successfully!</P>
                        {/if}
                        
                        {#if saveError}
                            <P color="red" class="mt-2">{saveError}</P>
                        {/if}
                    </div>
                </div>
            </div>
        </Card>
    {/if}
</div>