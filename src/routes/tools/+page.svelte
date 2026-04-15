<script lang="ts">
	import FeatureCard from '$lib/components/FeatureCard.svelte';
</script>

<div class="container mx-auto p-4">
	<h1 class="mb-4 text-2xl font-bold">Tools</h1>
	<p class="max-w-3xl text-sm text-gray-700">
		Planner and utility pages for Path of Terraria live here. This starts with a basic passive-tree
		planner driven by the same passive data file the mod uses.
	</p>

	<div class="container mx-auto mt-12">
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<div class="mx-auto">
				<FeatureCard
					title="Passive Planner"
					description="Prototype passive-tree editor with node selection, required level, and stat summaries."
					link="/tools/planner"
					target=""
					linkText="Open Planner"
				/>
			</div>
		</div>
	</div>
</div>
