<script lang="ts">
	import DataDropdown from '$lib/components/DataDropdown.svelte';
	import MechanicRichText from '$lib/components/MechanicRichText.svelte';
	import {
		getFormattedTooltip,
		plannerEdges,
		plannerNodes,
		type PlannerNode
	} from '$lib/planner/passive-tree';

	type PassiveGroup = PlannerNode['group'];

	interface PassiveTypeSummary {
		identifier: string;
		displayName: string;
		displayTooltip: string;
		assetPath: string;
		groups: PassiveGroup[];
		nodes: PlannerNode[];
		totalValue: number;
		maxLevel: number;
		hiddenCount: number;
		choiceCount: number;
		connectionCount: number;
		searchText: string;
	}

	const groupOptions: Array<{ value: 'all' | PassiveGroup; label: string }> = [
		{ value: 'all', label: 'All types' },
		{ value: 'anchor', label: 'Anchors' },
		{ value: 'attribute', label: 'Attributes' },
		{ value: 'mastery', label: 'Masteries' },
		{ value: 'notable', label: 'Notables' },
		{ value: 'minor', label: 'Minor passives' }
	];

	const connectionCountByNode = plannerEdges.reduce((counts, edge) => {
		counts.set(edge.from, (counts.get(edge.from) ?? 0) + 1);
		counts.set(edge.to, (counts.get(edge.to) ?? 0) + 1);
		return counts;
	}, new Map<number, number>());

	const passiveTypes = buildPassiveTypeSummaries(plannerNodes);
	const passiveTypeOptions = [
		{ value: 'all', label: 'All passive types' },
		...passiveTypes.map((passiveType) => ({ value: passiveType.identifier, label: passiveType.displayName }))
	];

	let searchQuery = $state('');
	let selectedGroup = $state<'all' | PassiveGroup>('all');
	let selectedIdentifier = $state('all');

	const filteredPassiveTypes = $derived.by(() => {
		const query = searchQuery.trim().toLocaleLowerCase();

		return passiveTypes.filter((passiveType) => {
			const matchesSearch = !query || passiveType.searchText.includes(query);
			const matchesGroup = selectedGroup === 'all' || passiveType.groups.includes(selectedGroup);
			const matchesIdentifier = selectedIdentifier === 'all' || passiveType.identifier === selectedIdentifier;

			return matchesSearch && matchesGroup && matchesIdentifier;
		});
	});

	const visibleNodeCount = $derived(
		filteredPassiveTypes.reduce((count, passiveType) => count + passiveType.nodes.length, 0)
	);

	function buildPassiveTypeSummaries(nodes: PlannerNode[]): PassiveTypeSummary[] {
		const summaries = new Map<string, PassiveTypeSummary>();

		for (const node of nodes) {
			const existing = summaries.get(node.internalIdentifier);
			if (existing) {
				existing.nodes.push(node);
				existing.totalValue += node.value;
				existing.maxLevel = Math.max(existing.maxLevel, node.maxLevel);
				existing.hiddenCount += node.isHidden ? 1 : 0;
				existing.choiceCount += node.isChoiceNode ? 1 : 0;
				existing.connectionCount += connectionCountByNode.get(node.referenceId) ?? 0;
				if (!existing.groups.includes(node.group)) {
					existing.groups.push(node.group);
				}
				continue;
			}

			summaries.set(node.internalIdentifier, {
				identifier: node.internalIdentifier,
				displayName: node.displayName,
				displayTooltip: node.displayTooltip,
				assetPath: node.assetPath,
				groups: [node.group],
				nodes: [node],
				totalValue: node.value,
				maxLevel: node.maxLevel,
				hiddenCount: node.isHidden ? 1 : 0,
				choiceCount: node.isChoiceNode ? 1 : 0,
				connectionCount: connectionCountByNode.get(node.referenceId) ?? 0,
				searchText: `${node.displayName} ${node.internalIdentifier} ${node.displayTooltip}`.toLocaleLowerCase()
			});
		}

		return [...summaries.values()]
			.map((summary) => ({
				...summary,
				nodes: summary.nodes.toSorted((left, right) => left.referenceId - right.referenceId),
				groups: summary.groups.toSorted(),
				searchText: `${summary.searchText} ${summary.groups.join(' ')}`.toLocaleLowerCase()
			}))
			.toSorted((left, right) => left.displayName.localeCompare(right.displayName) || left.identifier.localeCompare(right.identifier));
	}

	function formatGroups(groups: PassiveGroup[]): string {
		return groups.map((group) => group[0].toUpperCase() + group.slice(1)).join(', ');
	}
</script>

<div class="container mx-auto px-4 py-24 text-white">
	<div class="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
		<div>
			<h1 class="mb-2 text-3xl font-black tracking-tight text-white">Passive Data</h1>
			<p class="max-w-3xl text-sm text-gray-300">
				Read-only browser for the copied passive tree data. Filtering narrows by passive type, derived group, or text.
			</p>
		</div>
		<div class="grid grid-cols-2 gap-3 text-right text-sm md:grid-cols-3">
			<div class="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
				<div class="text-xs uppercase text-gray-400">Types</div>
				<div class="text-lg font-bold text-white">{filteredPassiveTypes.length}</div>
			</div>
			<div class="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
				<div class="text-xs uppercase text-gray-400">Nodes</div>
				<div class="text-lg font-bold text-white">{visibleNodeCount}</div>
			</div>
			<div class="col-span-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 md:col-span-1">
				<div class="text-xs uppercase text-gray-400">Source</div>
				<div class="text-lg font-bold text-white">{plannerNodes.length}</div>
			</div>
		</div>
	</div>

	<div class="mb-6 grid gap-4 rounded-[1.5rem] border border-white/10 bg-[#0a1016] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.3)] md:grid-cols-[minmax(0,1fr)_220px_260px]">
		<label class="grid gap-2 text-sm font-medium text-gray-300" for="passive-search">
			Search passives
			<input
				id="passive-search"
				type="text"
				bind:value={searchQuery}
				placeholder="Name, identifier, tooltip..."
				class="block w-full rounded-lg border border-white/10 bg-white/8 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-sky-400 focus:outline-hidden focus:ring-2 focus:ring-sky-400/30"
			/>
		</label>

		<DataDropdown id="passive-group" label="Group" options={groupOptions} bind:value={selectedGroup} />

		<DataDropdown id="passive-type" label="Passive type" options={passiveTypeOptions} bind:value={selectedIdentifier} />
	</div>

	{#if filteredPassiveTypes.length > 0}
		<div class="grid gap-4">
			{#each filteredPassiveTypes as passiveType (passiveType.identifier)}
				<section class="rounded-[1.5rem] border border-white/10 bg-[#0a1016] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
					<div class="grid gap-4 lg:grid-cols-[72px_minmax(0,1fr)_auto] lg:items-start">
						<img
							src={passiveType.assetPath}
							alt={passiveType.displayName}
							class="h-16 w-16 rounded-full border border-white/10 bg-white/[0.04] object-contain p-1 [image-rendering:pixelated]"
						/>
						<div class="min-w-0">
							<div class="flex flex-wrap items-center gap-2">
								<h2 class="text-xl font-bold text-white">{passiveType.displayName}</h2>
								<span class="rounded-full border border-sky-400/30 bg-sky-400/10 px-2 py-1 text-xs font-bold text-sky-200">
									{formatGroups(passiveType.groups)}
								</span>
								{#if passiveType.hiddenCount > 0}
									<span class="rounded-full border border-purple-300/30 bg-purple-300/10 px-2 py-1 text-xs font-bold text-purple-100">
										{passiveType.hiddenCount} hidden
									</span>
								{/if}
								{#if passiveType.choiceCount > 0}
									<span class="rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-1 text-xs font-bold text-amber-100">
										{passiveType.choiceCount} choice
									</span>
								{/if}
							</div>
							<div class="mt-1 break-all font-mono text-xs text-gray-400">{passiveType.identifier}</div>
							{#if passiveType.displayTooltip}
								<p class="mt-3 max-w-4xl text-sm text-gray-300">
									<MechanicRichText text={getFormattedTooltip(passiveType.nodes[0])} />
								</p>
							{:else}
								<p class="mt-3 text-sm italic text-gray-500">No localized tooltip found.</p>
							{/if}
						</div>
						<dl class="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
							<div class="rounded-lg border border-white/8 bg-white/[0.035] p-3">
								<dt class="text-xs uppercase text-gray-400">Nodes</dt>
								<dd class="mt-1 text-lg font-bold text-white">{passiveType.nodes.length}</dd>
							</div>
							<div class="rounded-lg border border-white/8 bg-white/[0.035] p-3">
								<dt class="text-xs uppercase text-gray-400">Max level</dt>
								<dd class="mt-1 text-lg font-bold text-white">{passiveType.maxLevel}</dd>
							</div>
							<div class="rounded-lg border border-white/8 bg-white/[0.035] p-3">
								<dt class="text-xs uppercase text-gray-400">Total value</dt>
								<dd class="mt-1 text-lg font-bold text-white">{passiveType.totalValue}</dd>
							</div>
							<div class="rounded-lg border border-white/8 bg-white/[0.035] p-3">
								<dt class="text-xs uppercase text-gray-400">Links</dt>
								<dd class="mt-1 text-lg font-bold text-white">{passiveType.connectionCount}</dd>
							</div>
						</dl>
					</div>

					<div class="mt-4 overflow-x-auto rounded-xl border border-white/8">
						<table class="w-full text-left text-sm text-gray-300">
							<thead class="bg-white/[0.04] text-xs uppercase text-gray-400">
								<tr>
									<th scope="col" class="px-4 py-3">Reference</th>
									<th scope="col" class="px-4 py-3">Value</th>
									<th scope="col" class="px-4 py-3">Level</th>
									<th scope="col" class="px-4 py-3">Required edges</th>
									<th scope="col" class="px-4 py-3">Position</th>
									<th scope="col" class="px-4 py-3">Connections</th>
									<th scope="col" class="px-4 py-3">Flags</th>
								</tr>
							</thead>
							<tbody>
								{#each passiveType.nodes as node (node.referenceId)}
									<tr class="border-t border-white/8 align-top transition-colors duration-150 hover:bg-white/[0.025]">
										<td class="px-4 py-3 font-semibold text-white">{node.referenceId}</td>
										<td class="px-4 py-3">{node.value}</td>
										<td class="px-4 py-3">{node.maxLevel}</td>
										<td class="px-4 py-3">{node.requiredAllocatedEdges ?? 1}</td>
										<td class="px-4 py-3 font-mono text-xs text-gray-400">{node.position.x}, {node.position.y}</td>
										<td class="px-4 py-3">
											{#if node.connections && node.connections.length > 0}
												<div class="flex flex-wrap gap-1">
													{#each node.connections as connection}
														<span class="rounded bg-white/[0.06] px-2 py-1 font-mono text-xs text-gray-200">
															{connection.referenceId}{connection.isHidden ? ' hidden' : ''}{connection.effectsOnly ? ' effects' : ''}
														</span>
													{/each}
												</div>
											{:else}
												<span class="italic text-gray-500">None</span>
											{/if}
										</td>
										<td class="px-4 py-3">
											<div class="flex flex-wrap gap-1">
												{#if node.isHidden}
													<span class="rounded bg-purple-300/10 px-2 py-1 text-xs text-purple-100">Hidden</span>
												{/if}
												{#if node.isChoiceNode}
													<span class="rounded bg-amber-300/10 px-2 py-1 text-xs text-amber-100">Choice</span>
												{/if}
												{#if !node.isHidden && !node.isChoiceNode}
													<span class="italic text-gray-500">None</span>
												{/if}
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</section>
			{/each}
		</div>
	{:else}
		<p class="text-sm text-gray-400">No passive types found matching the current filters.</p>
	{/if}
</div>
