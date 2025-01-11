<script lang="ts">
    import type { PageData } from './$types';
    import {Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell} from "flowbite-svelte";
    import {type IPlayer} from "$lib/services/player-service";
    import {UserService} from "$lib/services/user-service";
    let userService = new UserService();

    let { data }: { data: PageData } = $props();

    let playerPromise: Promise<IPlayer[]> = getPlayer();
    async function getPlayer() {
        return await userService.getPlayers(data.slug);
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
        </TableHead>
        <TableBody tableBodyClass="divide-y">
            {#await playerPromise}
                <TableBodyRow>
                    <TableBodyCell>Fetching...</TableBodyCell>
                    <TableBodyCell>The...</TableBodyCell>
                    <TableBodyCell>Player...</TableBodyCell>
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
                    </TableBodyRow>
                {:else}
                    {#each players as player}
                        <TableBodyRow>
                            <TableBodyCell>{player.name}</TableBodyCell>
                            <TableBodyCell>{player.stats.level}</TableBodyCell>
                            <TableBodyCell>{player.stats.strength}</TableBodyCell>
                            <TableBodyCell>{player.stats.dexterity}</TableBodyCell>
                            <TableBodyCell>{player.stats.intelligence}</TableBodyCell>
                        </TableBodyRow>
                    {/each}
                {/if}
            {:catch someError}
                Failed to load leaderboards
            {/await}
        </TableBody>
    </Table>
</div>