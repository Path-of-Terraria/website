<script lang="ts">
    import type { PageData } from './$types';
    import {Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Modal, Button} from "flowbite-svelte";
    import {type IPlayer, PlayerService} from "$lib/services/player-service";
    import {UserService} from "$lib/services/user-service";
    let userService = new UserService();
    let playerService = new PlayerService();
    import {toast} from "@zerodevx/svelte-toast";

    let { data }: { data: PageData } = $props();

    let playerPromise = $state<Promise<IPlayer[]>>(getPlayer());
    async function getPlayer() {
        return await userService.getPlayers(data.slug);
    }
    
    // Delete confirmation modal
    let deleteModalOpen = $state(false);
    let playerNameToDelete = $state("");
    let playerIdToDelete = $state("");
    
    function openDeleteModal(playerName: string, playerId: string) {
        playerNameToDelete = playerName;
        playerIdToDelete = playerId;
        deleteModalOpen = true;
    }
    
    async function confirmDelete() {
        try {
            await playerService.deletePlayer(playerIdToDelete);
            // Refresh the player list
            playerPromise = getPlayer();
            deleteModalOpen = false;
            toast.push("Player deleted successfully");
        } catch (error) {
            console.error("Error deleting player:", error);
            alert("Failed to delete player. Please try again.");
        }
    }
</script>

<div class="container mx-auto">
    <Table striped={true} hoverable={true}>
        <caption class="p-5 text-lg font-semibold text-left text-gray-900 bg-white dark:text-white dark:bg-gray-800">
            {data.slug}'s Characters
        </caption>
        <TableHead>
            <TableHeadCell>Character Name</TableHeadCell>
            <TableHeadCell>Level</TableHeadCell>
            <TableHeadCell>Strength</TableHeadCell>
            <TableHeadCell>Dexterity</TableHeadCell>
            <TableHeadCell>Intelligence</TableHeadCell>
            <TableHeadCell>Actions</TableHeadCell>
        </TableHead>
        <TableBody tableBodyClass="divide-y">
            {#await playerPromise}
                <TableBodyRow>
                    <TableBodyCell>Fetching...</TableBodyCell>
                    <TableBodyCell>The...</TableBodyCell>
                    <TableBodyCell>Player...</TableBodyCell>
                    <TableBodyCell>...</TableBodyCell>
                    <TableBodyCell>...</TableBodyCell>
                    <TableBodyCell>...</TableBodyCell>
                </TableBodyRow>
            {:then players}
                {#if players.length === 0}
                    <TableBodyRow>
                        <TableBodyCell>No</TableBodyCell>
                        <TableBodyCell>player</TableBodyCell>
                        <TableBodyCell>data</TableBodyCell>
                        <TableBodyCell>found</TableBodyCell>
                        <TableBodyCell>...</TableBodyCell>
                        <TableBodyCell>...</TableBodyCell>
                    </TableBodyRow>
                {:else}
                    {#each players as player}
                        <TableBodyRow>
                            <TableBodyCell>{player.name}</TableBodyCell>
                            <TableBodyCell>{player.stats.level}</TableBodyCell>
                            <TableBodyCell>{player.stats.strength}</TableBodyCell>
                            <TableBodyCell>{player.stats.dexterity}</TableBodyCell>
                            <TableBodyCell>{player.stats.intelligence}</TableBodyCell>
                            <TableBodyCell>
                                <Button on:click={() => (openDeleteModal(player.name, player.id))}>Delete</Button>
                            </TableBodyCell>
                        </TableBodyRow>
                    {/each}
                {/if}
            {:catch someError}
                Failed to load leaderboards
            {/await}
        </TableBody>
    </Table>
</div>

<Modal title="Confirm Deletion" bind:open={deleteModalOpen} autoclose>
    <p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
        Are you sure you want to delete {playerNameToDelete}? This action cannot be undone.
    </p>
    <svelte:fragment slot="footer">
        <div class="flex justify-end w-full">
            <Button color="alternative" on:click={() => deleteModalOpen = false} class="mr-6">
                Cancel
            </Button>
            <Button color="red" on:click={confirmDelete}>
                Delete
            </Button>
        </div>
    </svelte:fragment>
</Modal>