<script>
	import FeatureCard from "$lib/components/FeatureCard.svelte";
	import {Heading} from "flowbite-svelte";
</script>

<svelte:head>
	<title>Path of Terraria</title>
	<meta name="description" content="Path of Terraria is a game changing mod bringing the ARPG experience into Terraria" />
</svelte:head>
<div class="header">
	<div class="container mx-auto mt-8">
		<Heading tag="h1" class="mb-4" customSize="text-1xl font-extrabold  md:text-3xl lg:text-4xl">
			Introducing the ARPG mod for Terraria
		</Heading>
	</div>
</div>
<div class="container mx-auto mt-12">
	<div class="grid grid-cols-2 gap-4">
		<div class="mx-auto" >
			<FeatureCard
					title="Redesigned Item System"
					description="Items drops with affix. Prefixes and suffixes can be combined to create powerful items."
					link="https://wiki.pathofterraria.com/Gear"
			></FeatureCard>
		</div>
		<div class="mx-auto" >
			<FeatureCard
					title="Questing System"
					description="Complete quests for NPCs and get rewards."
					link="https://wiki.pathofterraria.com/Towns"
			></FeatureCard>
		</div>
	</div>
</div>