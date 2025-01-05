<script lang="ts">
	import FeatureCard from "$lib/components/FeatureCard.svelte";
</script>

<div class="container mx-auto p-4">
	<h1 class="text-2xl font-bold mb-4">Mod Data</h1>

	<div class="container mx-auto mt-12">
		<div class="grid grid-cols-2 gap-4">
			<div class="mx-auto" >
				<FeatureCard
						title="Edit Mob Data"
						description="View and edit the mob data for the site"
						link="/mod-data/mobs"
						target=""
						linkText="See Data"
				></FeatureCard>
			</div>
		</div>
	</div>
</div>