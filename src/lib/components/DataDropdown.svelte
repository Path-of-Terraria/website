<script lang="ts">
	import { onMount } from 'svelte';
	import { Button, Label } from 'flowbite-svelte';
	import { ChevronDownOutline } from 'flowbite-svelte-icons';

	interface DropdownOption {
		value: string;
		label: string;
	}

	let {
		id,
		label,
		options,
		value = $bindable(''),
		placeholder = 'Select an option',
		disabled = false
	} = $props<{
		id: string;
		label: string;
		options: DropdownOption[];
		value?: string;
		placeholder?: string;
		disabled?: boolean;
	}>();

	let open = $state(false);
	let container: HTMLDivElement | null = $state(null);

	const selectedLabel = $derived(options.find((option) => option.value === value)?.label ?? placeholder);

	function selectOption(nextValue: string) {
		value = nextValue;
		open = false;
	}

	function handleDocumentClick(event: MouseEvent) {
		if (container && !container.contains(event.target as Node)) {
			open = false;
		}
	}

	onMount(() => {
		document.addEventListener('click', handleDocumentClick);

		return () => {
			document.removeEventListener('click', handleDocumentClick);
		};
	});
</script>

<div class="relative" bind:this={container}>
	<Label for={id} class="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-gray-300">{label}</Label>
	<Button
		id={id}
		class="w-full justify-between border-white/10 bg-white/8 font-normal text-white hover:bg-white/12"
		{disabled}
		onclick={() => {
			if (!disabled) {
				open = !open;
			}
		}}
	>
		<span class="min-w-0 truncate text-left">{selectedLabel}</span>
		<ChevronDownOutline class="ml-2 h-4 w-4 shrink-0 text-gray-400" />
	</Button>
	{#if open}
		<div class="absolute left-0 right-0 top-full z-30 mt-2 max-h-60 overflow-y-auto rounded-lg border border-white/10 bg-[#111827] p-1 text-white shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
			{#if options.length === 0}
				<div class="px-3 py-2 text-sm text-gray-400">No options available</div>
			{:else}
				{#each options as option}
					<button
						type="button"
						class={`flex w-full items-center rounded-md px-3 py-2 text-left text-sm transition hover:bg-white/10 ${
							option.value === value ? 'bg-white/10 text-white' : 'text-gray-200'
						}`}
						onclick={() => selectOption(option.value)}
					>
						<span class="min-w-0 truncate">{option.label}</span>
					</button>
				{/each}
			{/if}
		</div>
	{/if}
</div>
