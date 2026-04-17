<script lang="ts">
	import MechanicRichText from '$lib/components/MechanicRichText.svelte';
	import type { MechanicDefinition } from '$lib/planner/mechanics';

	interface Props {
		label: string;
		mechanic?: MechanicDefinition;
		depth?: number;
	}

	let { label, mechanic, depth = 0 }: Props = $props();

	const isNested = $derived(depth > 0);

	let hovered = $state(false);
	let focused = $state(false);
	let popoverHovered = $state(false);

	const visible = $derived(hovered || focused || popoverHovered);
</script>

{#if mechanic}
	<span
		class="mechanic-token"
		class:nested={isNested}
		class:visible
		style={`--mechanic-depth:${depth};`}
		onmouseenter={() => (hovered = true)}
		onmouseleave={() => (hovered = false)}
	>
		<button
			type="button"
			class="mechanic-label"
			onfocus={() => (focused = true)}
			onblur={() => (focused = false)}
		>{label}</button>
		{#if visible}
			<span
				class="mechanic-popover"
				role="tooltip"
				onmouseenter={() => (popoverHovered = true)}
				onmouseleave={() => (popoverHovered = false)}
			>
				<strong>{mechanic.tag}</strong>
				{#if mechanic.description}
					<span class="mechanic-description">
						<MechanicRichText text={mechanic.description} depth={depth + 1} />
					</span>
				{/if}
			</span>
		{/if}
	</span>
{:else}
	<span>{label}</span>
{/if}

<style>
	.mechanic-token {
		position: relative;
		display: inline-flex;
		align-items: baseline;
		z-index: 0;
	}

	.mechanic-token.visible {
		z-index: 50;
	}

	.mechanic-token.nested {
		z-index: calc(40 + var(--mechanic-depth));
	}

	.mechanic-token.nested.visible {
		z-index: calc(90 + var(--mechanic-depth));
	}

	.mechanic-label {
		border: 0;
		background: transparent;
		padding: 0;
		font: inherit;
		cursor: help;
		text-decoration-line: underline;
		text-decoration-style: dotted;
		text-decoration-thickness: 0.08em;
		text-underline-offset: 0.18em;
		color: #f3d48b;
	}

	.mechanic-popover {
		position: absolute;
		left: 0;
		bottom: calc(100% + 0.5rem);
		z-index: 40;
		width: min(18rem, 70vw);
		border: 1px solid rgba(243, 212, 139, 0.3);
		border-radius: 0.75rem;
		background: rgba(15, 23, 42, 0.96);
		box-shadow: 0 18px 45px rgba(0, 0, 0, 0.35);
		padding: 0.7rem 0.85rem;
		color: #f8fafc;
		line-height: 1.5;
		white-space: normal;
	}

	.mechanic-token.nested .mechanic-popover {
		left: calc(100% + 0.75rem);
		top: 50%;
		bottom: auto;
		transform: translateY(-50%);
	}

	.mechanic-popover strong {
		display: block;
		margin-bottom: 0.35rem;
		color: #f3d48b;
		font-size: 0.92rem;
	}

	.mechanic-description {
		display: block;
		font-size: 0.88rem;
		color: rgba(248, 250, 252, 0.92);
	}

	@media (max-width: 640px) {
		.mechanic-popover {
			left: 50%;
			top: auto;
			bottom: calc(100% + 0.5rem);
			transform: translateX(-50%);
		}
	}
</style>
