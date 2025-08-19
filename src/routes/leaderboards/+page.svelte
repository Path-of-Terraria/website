<script lang="ts">
    import {
        Table,
        TableBody,
        TableBodyCell,
        TableBodyRow,
        TableHead,
        TableHeadCell,
        Button,
        Select,
        Label
    } from 'flowbite-svelte';
	import {type IPlayer, PlayerService} from "$lib/services/player-service";
	let playerService = new PlayerService();

	let count: number = 50;
	let skip: number = 0;
	let lastResultLength: number = 0;

    async function refreshLeaderboards(): Promise<IPlayer[]> {
        let data = await playerService.getLeaderboards(count, skip);
        lastResultLength = data.length;
        return data;
    }

    let leaderboardsPromise: Promise<IPlayer[]> = refreshLeaderboards();

	function nextPage() {
		if (lastResultLength >= count) {
			skip += count;
			leaderboardsPromise = refreshLeaderboards();
		}
	}

	function prevPage() {
		skip = Math.max(0, skip - count);
		leaderboardsPromise = refreshLeaderboards();
	}
</script>

<div class="container mx-auto">
	<Table striped={true} hoverable={true}>
		<caption class="p-5 text-lg font-semibold text-left text-gray-900 bg-white dark:text-white dark:bg-gray-800">
			Path of Terraria Leaderboards
			<p class="mt-1 text-sm font-normal text-gray-500 dark:text-gray-400">
				The following list is comprised of unflagged players
			</p>
		</caption>
		<TableHead>
			<TableHeadCell>Character Name</TableHeadCell>
			<TableHeadCell>Level</TableHeadCell>
			<TableHeadCell>Strength</TableHeadCell>
			<TableHeadCell>Dexterity</TableHeadCell>
			<TableHeadCell>Intelligence</TableHeadCell>
		</TableHead>
		<TableBody tableBodyClass="divide-y">
			{#await leaderboardsPromise}
				<TableBodyRow>
					<TableBodyCell>Fetching...</TableBodyCell>
					<TableBodyCell>The...</TableBodyCell>
					<TableBodyCell>Data...</TableBodyCell>
					<TableBodyCell>...</TableBodyCell>
					<TableBodyCell>...</TableBodyCell>
				</TableBodyRow>
			{:then leaders}
				{#if leaders.length === 0}
					<TableBodyRow>
						<TableBodyCell>No</TableBodyCell>
						<TableBodyCell>player</TableBodyCell>
						<TableBodyCell>data</TableBodyCell>
						<TableBodyCell>found</TableBodyCell>
						<TableBodyCell>...</TableBodyCell>
					</TableBodyRow>
				{:else}
					{#each leaders as leader}
						<TableBodyRow>
							<TableBodyCell>{leader.name}</TableBodyCell>
							<TableBodyCell>{leader.stats.level}</TableBodyCell>
							<TableBodyCell>{leader.stats.strength}</TableBodyCell>
							<TableBodyCell>{leader.stats.dexterity}</TableBodyCell>
							<TableBodyCell>{leader.stats.intelligence}</TableBodyCell>
						</TableBodyRow>
					{/each}
				{/if}
			{:catch someError}
				Failed to load leaderboards
			{/await}
		</TableBody>
	</Table>
	<div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between p-4">
		<div class="flex items-center gap-2">
            <Select id="page-size" size="sm" class="w-40" bind:value={count} on:change={() => { count = +count; skip = 0; leaderboardsPromise = refreshLeaderboards(); }}>
                <option value={1}>1</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
            </Select>
		</div>
		<div class="flex items-center gap-3">
			<Button outline size="sm" on:click={prevPage} disabled={skip === 0}>Previous</Button>
			<span class="text-sm text-gray-700 dark:text-gray-300">Showing {skip + (lastResultLength ? 1 : 0)}–{skip + lastResultLength}</span>
			<Button outline size="sm" on:click={nextPage} disabled={lastResultLength < count}>Next</Button>
		</div>
	</div>
</div>