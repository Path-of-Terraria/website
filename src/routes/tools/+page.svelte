<script lang="ts">
	import FeatureCard from '$lib/components/FeatureCard.svelte';
</script>

<div class="container mx-auto px-4 py-24">
	<h1 class="mb-4 text-3xl font-black tracking-tight text-white">Tools</h1>
	<p class="max-w-3xl text-sm text-gray-300">
		Planner, utility, and mod data pages for Path of Terraria live here.
	</p>

	<div class="container mx-auto mt-12 px-0">
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
			<div class="mx-auto w-full">
				<FeatureCard
					title="Passive Planner"
					description="Prototype passive-tree editor with node selection, required level, and stat summaries."
					link="/tools/planner"
					target=""
					linkText="Open Planner"
				/>
			</div>
			<div class="mx-auto w-full">
				<FeatureCard
					title="Edit Mob Data"
					description="View and edit the mob data for the mod."
					link="/mod-data/mobs"
					target=""
					linkText="See Data"
				/>
			</div>
			<div class="mx-auto w-full">
				<FeatureCard
					title="View Passives"
					description="Browse passive tree data by type."
					link="/mod-data/passives"
					target=""
					linkText="See Data"
				/>
			</div>
			<div class="mx-auto w-full">
				<FeatureCard
					title="View Gear Affixes"
					description="Browse gear types and their possible affix rolls."
					link="/mod-data/affixes"
					target=""
					linkText="See Data"
				/>
			</div>
			<div class="mx-auto w-full">
				<FeatureCard
					title="Edit Localization"
					description="View and edit the localization for the mod."
					link="/mod-data/localization"
					target=""
					linkText="See Data"
				/>
			</div>
		</div>
	</div>
</div>
