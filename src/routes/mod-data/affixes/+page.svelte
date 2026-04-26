<script lang="ts">
	import DataDropdown from '$lib/components/DataDropdown.svelte';
	import {
		affixEntries,
		formatTierRange,
		gearAffixSummaries,
		sourceFiles,
		type AffixEntry,
		type GearAffixSummary
	} from '$lib/affixes/affix-data';

	let selectedGearType = $state(gearAffixSummaries[0]?.type ?? '');
	let searchQuery = $state('');
	let selectedSourceFile = $state('all');
	let selectedMinimumLevel = $state(1);
	const sourceFileOptions = [
		{ value: 'all', label: 'All files' },
		...sourceFiles.map((sourceFile) => ({ value: sourceFile, label: sourceFile }))
	];

	const selectedGear = $derived(
		gearAffixSummaries.find((summary) => summary.type === selectedGearType) ?? gearAffixSummaries[0]
	);

	const normalizedSearch = $derived(searchQuery.trim().toLocaleLowerCase());

	const filteredGearSummaries = $derived.by(() => {
		if (!normalizedSearch) {
			return gearAffixSummaries;
		}

		return gearAffixSummaries.filter((summary) => summary.searchText.includes(normalizedSearch));
	});

	const filteredAffixes = $derived.by(() => {
		if (!selectedGear) {
			return [];
		}

		return selectedGear.affixes.filter((affix) => {
			const matchesSearch = !normalizedSearch || affix.searchText.includes(normalizedSearch);
			const matchesSource = selectedSourceFile === 'all' || affix.sourceFile === selectedSourceFile;
			const hasEligibleTier = affix.tiers.some((tier) => tier.minimumLevel <= selectedMinimumLevel);

			return matchesSearch && matchesSource && hasEligibleTier;
		});
	});

	const totalAffixCount = $derived(affixEntries.length);
	const visibleTierCount = $derived(filteredAffixes.reduce((count, affix) => count + affix.tiers.length, 0));

	function selectGear(summary: GearAffixSummary) {
		selectedGearType = summary.type;
	}

	function getEligibleTiers(affix: AffixEntry) {
		return affix.tiers.filter((tier) => tier.minimumLevel <= selectedMinimumLevel);
	}

	function getLockedTierCount(affix: AffixEntry) {
		return affix.tiers.length - getEligibleTiers(affix).length;
	}

	function formatList(values: string[]): string {
		return values.length > 0 ? values.join(', ') : 'None';
	}
</script>

<div class="container mx-auto px-4 py-24 text-white">
	<div class="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
		<div>
			<h1 class="mb-2 text-3xl font-black tracking-tight text-white">Gear Affix Data</h1>
			<p class="max-w-3xl text-sm text-gray-300">
				Read-only browser for copied affix JSON. Choose a concrete gear type to see every affix that can roll on it.
			</p>
		</div>
		<div class="grid grid-cols-3 gap-3 text-right text-sm">
			<div class="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
				<div class="text-xs uppercase text-gray-400">Gear types</div>
				<div class="text-lg font-bold text-white">{gearAffixSummaries.length}</div>
			</div>
			<div class="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
				<div class="text-xs uppercase text-gray-400">Affixes</div>
				<div class="text-lg font-bold text-white">{totalAffixCount}</div>
			</div>
			<div class="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
				<div class="text-xs uppercase text-gray-400">Files</div>
				<div class="text-lg font-bold text-white">{sourceFiles.length}</div>
			</div>
		</div>
	</div>

	<div class="mb-6 grid gap-4 rounded-[1.5rem] border border-white/10 bg-[#0a1016] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.3)] md:grid-cols-[minmax(0,1fr)_220px_220px]">
		<label class="grid gap-2 text-sm font-medium text-gray-300" for="affix-search">
			Search affixes
			<input
				id="affix-search"
				type="text"
				bind:value={searchQuery}
				placeholder="Gear type, affix, roll text, source file..."
				class="block w-full rounded-lg border border-white/10 bg-white/8 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-sky-400 focus:outline-hidden focus:ring-2 focus:ring-sky-400/30"
			/>
		</label>

		<DataDropdown id="affix-source" label="Source file" options={sourceFileOptions} bind:value={selectedSourceFile} />

		<label class="grid gap-2 text-sm font-medium text-gray-300" for="affix-level">
			Item level
			<input
				id="affix-level"
				type="number"
				min="1"
				max="100"
				bind:value={selectedMinimumLevel}
				class="block w-full rounded-lg border border-white/10 bg-white/8 px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-hidden focus:ring-2 focus:ring-sky-400/30"
			/>
		</label>
	</div>

	<div class="grid gap-6 xl:h-[calc(100vh-23rem)] xl:min-h-[520px] xl:grid-cols-[360px_minmax(0,1fr)]">
		<aside class="xl:min-h-0">
			<div class="mb-3 flex items-center justify-between gap-3">
				<h2 class="text-lg font-bold text-white">Gear types</h2>
				<span class="text-sm text-gray-400">{filteredGearSummaries.length} shown</span>
			</div>

			<div class="grid gap-3 sm:grid-cols-2 xl:max-h-[calc(100%-2.25rem)] xl:grid-cols-1 xl:overflow-y-auto xl:pr-2">
				{#each filteredGearSummaries as summary (summary.type)}
					<button
						type="button"
						class={`w-full rounded-xl border p-4 text-left transition ${
							selectedGearType === summary.type
								? 'border-sky-300 bg-sky-300/12 shadow-[0_0_0_4px_rgba(125,211,252,0.12)]'
								: 'border-white/10 bg-[#0a1016] hover:border-white/20 hover:bg-white/[0.04]'
						}`}
						onclick={() => selectGear(summary)}
					>
						<div class="flex items-start justify-between gap-3">
							<div>
								<div class="font-bold text-white">{summary.displayName}</div>
								<div class="mt-1 font-mono text-xs text-gray-500">{summary.type}</div>
							</div>
							<span class="rounded-full border border-white/10 bg-white/[0.06] px-2 py-1 text-xs font-bold text-gray-200">
								{summary.affixes.length}
							</span>
						</div>
						<div class="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-400">
							<div>
								<span class="block uppercase text-gray-500">Min level</span>
								<strong class="text-gray-200">{summary.minimumLevel ?? 'N/A'}</strong>
							</div>
							<div>
								<span class="block uppercase text-gray-500">Files</span>
								<strong class="text-gray-200">{summary.sourceFiles.length}</strong>
							</div>
						</div>
					</button>
				{/each}
			</div>
		</aside>

		<section class="min-w-0 xl:min-h-0 xl:overflow-y-auto xl:pr-2">
			{#if selectedGear}
				<div class="mb-4 rounded-[1.5rem] border border-white/10 bg-[#0a1016] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
					<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
						<div>
							<div class="text-xs font-bold uppercase text-sky-200">Selected gear type</div>
							<h2 class="mt-1 text-2xl font-black text-white">{selectedGear.displayName}</h2>
							<div class="mt-1 font-mono text-xs text-gray-500">{selectedGear.type}</div>
							<p class="mt-3 max-w-3xl text-sm text-gray-300">
								This pool includes affixes whose effective item-type flags overlap this exact gear type.
							</p>
						</div>
						<dl class="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
							<div class="rounded-lg border border-white/8 bg-white/[0.035] p-3">
								<dt class="text-xs uppercase text-gray-400">Visible</dt>
								<dd class="mt-1 text-lg font-bold text-white">{filteredAffixes.length}</dd>
							</div>
							<div class="rounded-lg border border-white/8 bg-white/[0.035] p-3">
								<dt class="text-xs uppercase text-gray-400">Tier rows</dt>
								<dd class="mt-1 text-lg font-bold text-white">{visibleTierCount}</dd>
							</div>
							<div class="rounded-lg border border-white/8 bg-white/[0.035] p-3">
								<dt class="text-xs uppercase text-gray-400">Max level</dt>
								<dd class="mt-1 text-lg font-bold text-white">{selectedGear.highestLevel}</dd>
							</div>
							<div class="rounded-lg border border-white/8 bg-white/[0.035] p-3">
								<dt class="text-xs uppercase text-gray-400">Sources</dt>
								<dd class="mt-1 text-lg font-bold text-white">{selectedGear.sourceFiles.length}</dd>
							</div>
						</dl>
					</div>
					<div class="mt-4 flex flex-wrap gap-2">
						{#each selectedGear.sourceFiles as sourceFile}
							<span class="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-gray-300">{sourceFile}</span>
						{/each}
					</div>
				</div>

				{#if filteredAffixes.length > 0}
					<div class="grid gap-4">
						{#each filteredAffixes as affix (`${affix.sourceFile}:${affix.affixType}:${affix.equipTypes}`)}
							<article class="rounded-[1.5rem] border border-white/10 bg-[#0a1016] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
								<div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)] lg:items-start">
									<div class="min-w-0">
										<div class="flex flex-wrap items-center gap-2">
											<h3 class="text-xl font-bold text-white">{affix.displayName}</h3>
											<span class="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2 py-1 text-xs font-bold text-emerald-100">
												{affix.tiers.length} tiers
											</span>
											{#if affix.round}
												<span class="rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-1 text-xs font-bold text-amber-100">
													Rounded
												</span>
											{/if}
											{#if getLockedTierCount(affix) > 0}
												<span class="rounded-full border border-white/10 bg-white/[0.05] px-2 py-1 text-xs text-gray-300">
													{getLockedTierCount(affix)} above level {selectedMinimumLevel}
												</span>
											{/if}
										</div>
										<div class="mt-1 break-all font-mono text-xs text-gray-500">{affix.affixType}</div>
										<p class="mt-3 max-w-4xl text-sm text-gray-300">
											{#if affix.description}
												{formatTierRange(affix, getEligibleTiers(affix)[0] ?? affix.tiers[0])}
											{:else}
												No localized description found.
											{/if}
										</p>
									</div>
									<div class="grid min-w-0 gap-2 text-sm text-gray-300">
										<div class="rounded-lg border border-white/8 bg-white/[0.035] p-3">
											<div class="text-xs uppercase text-gray-400">Effective types</div>
											<div class="mt-1 break-words">{formatList(affix.effectiveTypeNames)}</div>
										</div>
										<div class="rounded-lg border border-white/8 bg-white/[0.035] p-3">
											<div class="text-xs uppercase text-gray-400">Raw equip types</div>
											<div class="mt-1 break-words font-mono text-xs">{affix.equipTypes}</div>
										</div>
										<div class="rounded-lg border border-white/8 bg-white/[0.035] p-3">
											<div class="text-xs uppercase text-gray-400">Source</div>
											<div class="mt-1 break-words">{affix.sourceFile}</div>
										</div>
									</div>
								</div>

								<div class="mt-4 overflow-x-auto rounded-xl border border-white/8">
									<table class="w-full text-left text-sm text-gray-300">
										<thead class="bg-white/[0.04] text-xs uppercase text-gray-400">
											<tr>
												<th scope="col" class="px-4 py-3">Tier</th>
												<th scope="col" class="px-4 py-3">Minimum level</th>
												<th scope="col" class="px-4 py-3">Roll text</th>
												<th scope="col" class="px-4 py-3">Min</th>
												<th scope="col" class="px-4 py-3">Max</th>
												<th scope="col" class="px-4 py-3">Weight</th>
												<th scope="col" class="px-4 py-3">Strength</th>
											</tr>
										</thead>
										<tbody>
											{#each affix.tiers as tier, index}
												<tr class={`border-t border-white/8 ${tier.minimumLevel > selectedMinimumLevel ? 'text-gray-500' : 'text-gray-200'}`}>
													<td class="px-4 py-3 font-semibold text-white">{index + 1}</td>
													<td class="px-4 py-3">{tier.minimumLevel}</td>
													<td class="px-4 py-3">{formatTierRange(affix, tier)}</td>
													<td class="px-4 py-3">{tier.minValue}</td>
													<td class="px-4 py-3">{tier.maxValue}</td>
													<td class="px-4 py-3">{tier.weight}</td>
													<td class="px-4 py-3">{tier.strength ?? 'N/A'}</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							</article>
						{/each}
					</div>
				{:else}
					<p class="text-sm text-gray-400">No affixes found for this gear type with the current filters.</p>
				{/if}
			{:else}
				<p class="text-sm text-gray-400">No gear affix data found.</p>
			{/if}
		</section>
	</div>
</div>
