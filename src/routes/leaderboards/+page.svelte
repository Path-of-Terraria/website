<script lang="ts">
    import {Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell} from 'flowbite-svelte';
	import {type IPlayer, PlayerService} from "$lib/services/player-service";
	let playerService = new PlayerService();

	let leaderboardsPromise: Promise<IPlayer[]> = getLeaderboards();
	async function getLeaderboards() {
		let response = await playerService.getTop50Players();
		console.log(response)
		return response;
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
			<TableHeadCell>Player Name</TableHeadCell>
			<TableHeadCell>Level</TableHeadCell>
			<TableHeadCell>Experience</TableHeadCell>
		</TableHead>
		<TableBody tableBodyClass="divide-y">
			{#await leaderboardsPromise}
				<TableBodyRow>
					<TableBodyCell>Fetching...</TableBodyCell>
					<TableBodyCell>The...</TableBodyCell>
					<TableBodyCell>Data...</TableBodyCell>
				</TableBodyRow>
			{:then leaders}
				{#each leaders as leader}
					<TableBodyRow>
						<TableBodyCell>{leader.name}</TableBodyCell>
						<TableBodyCell>{leader.stats.level}</TableBodyCell>
						<TableBodyCell>{leader.stats.experience}</TableBodyCell>
					</TableBodyRow>
				{/each}
			{:catch someError}
				Failed to load leaderboards
			{/await}
		</TableBody>
	</Table>
</div>