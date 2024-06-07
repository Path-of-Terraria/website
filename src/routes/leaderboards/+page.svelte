<script lang="ts">
    import {Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell} from 'flowbite-svelte';

    let data = [
        {
            name: 'Player 1',
            level: 1,
            experience: '500'
        },
        {
            name: 'Player 2',
            level: 2,
            experience: '1000'
        },
        {
            name: 'Player 3',
            level: 3,
            experience: '2000'
        }
    ]
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
			<TableBodyRow>
				<TableBodyCell>Player 1</TableBodyCell>
				<TableBodyCell>Sliver</TableBodyCell>
				<TableBodyCell>Laptop</TableBodyCell>
			</TableBodyRow>
			<TableBodyRow>
				<TableBodyCell>Microsoft Surface Pro</TableBodyCell>
				<TableBodyCell>White</TableBodyCell>
				<TableBodyCell>Laptop PC</TableBodyCell>
			</TableBodyRow>
			<TableBodyRow>
				<TableBodyCell>Magic Mouse 2</TableBodyCell>
				<TableBodyCell>Black</TableBodyCell>
				<TableBodyCell>Accessories</TableBodyCell>
			</TableBodyRow>
		</TableBody>
	</Table>
</div>