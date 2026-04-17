<script lang="ts">
	import MechanicToken from '$lib/components/MechanicToken.svelte';
	import { parseMechanicText, type MechanicTextSegment } from '$lib/planner/mechanics';

	interface Props {
		text: string;
		depth?: number;
	}

	let { text, depth = 0 }: Props = $props();

	const maxDepth = 3;
	const segments = $derived.by(
		(): MechanicTextSegment[] => (depth >= maxDepth ? [{ type: 'text', value: text }] : parseMechanicText(text))
	);
</script>

{#each segments as segment, index (`${segment.type}:${index}:${segment.value}`)}
	{#if segment.type === 'mechanic'}
		<MechanicToken label={segment.value} mechanic={segment.mechanic} {depth} />
	{:else}
		<span>{segment.value}</span>
	{/if}
{/each}
