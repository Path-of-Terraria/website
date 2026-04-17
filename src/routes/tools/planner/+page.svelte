<script lang="ts">
	import { onMount, tick } from 'svelte';
	import MechanicRichText from '$lib/components/MechanicRichText.svelte';
	import { toast } from '$lib/toast';
	import {
		applyChoiceSelection,
		canAllocateNode,
		canDeallocateNode,
		clearChoiceSelection,
		getActiveChoiceChild,
		getAnchorId,
		getChoiceChildren,
		getDisplayNode,
		getFormattedTooltip,
		getNodeRadius,
		getSpentPoints,
		isChoiceHub,
		isSelectableNode,
		isTreeStateValid,
		plannerCanvas,
		plannerEdges,
		plannerNodeMap,
		plannerNodes,
		startClassOptions,
		summarizeSelection,
		type PlannerNode,
		type PlannerStartClass
	} from '$lib/planner/passive-tree';

	const defaultStartClass: PlannerStartClass = 'melee';
	const defaultAnchorId = getAnchorId(defaultStartClass);
	const storageKey = 'pot-passive-planner-state-v1';
	const shareParamKey = 'build';
	const startClassCodeMap: Record<PlannerStartClass, string> = {
		melee: 'm',
		ranged: 'r',
		magic: 'g',
		summon: 's'
	};
	const startClassFromCodeMap: Record<string, PlannerStartClass> = {
		m: 'melee',
		r: 'ranged',
		g: 'magic',
		s: 'summon'
	};

	let startClass = $state<PlannerStartClass>(defaultStartClass);
	let currentLevel = $state(1);
	let extraPoints = $state(0);
	let selectedIds = $state<number[]>([defaultAnchorId]);
	let focusedNodeId = $state(defaultAnchorId);
	let hoveredNodeId = $state<number | null>(null);
	let hoveredClientX = $state(0);
	let hoveredClientY = $state(0);
	let drawerOpen = $state(true);
	let pinnedTooltipNodeId = $state<number | null>(null);
	let pinnedTooltipX = $state(0);
	let pinnedTooltipY = $state(0);
	let isHoveringTooltip = $state(false);
	let isDraggingTooltip = $state(false);
	let tooltipDragOffsetX = 0;
	let tooltipDragOffsetY = 0;
	let treeScrollElement = $state<HTMLDivElement | null>(null);
	let isDraggingTree = $state(false);
	let zoomLevel = $state(1);
	let dragStartX = 0;
	let dragStartY = 0;
	let dragScrollLeft = 0;
	let dragScrollTop = 0;
	let hasLoadedStoredState = $state(false);

	const anchorId = $derived(getAnchorId(startClass));
	const selectedIdSet = $derived(new Set(selectedIds));
	const spentPoints = $derived(getSpentPoints(selectedIdSet));
	const requiredLevel = $derived(Math.max(1, spentPoints - extraPoints));
	const availablePoints = $derived(Math.max(0, currentLevel + extraPoints));
	const remainingPoints = $derived(availablePoints - spentPoints);
	const summaryItems = $derived(summarizeSelection(selectedIdSet));
	const visibleNodes = $derived(plannerNodes.filter((node) => !node.isHidden));
	const focusedSourceNode = $derived(plannerNodeMap.get(focusedNodeId) ?? plannerNodeMap.get(anchorId) ?? plannerNodes[0]);
	const focusedNode = $derived(getDisplayNode(focusedNodeId, selectedIdSet) ?? plannerNodeMap.get(anchorId) ?? plannerNodes[0]);
	const tooltipNodeId = $derived(pinnedTooltipNodeId ?? hoveredNodeId);
	const hoveredNode = $derived(
		tooltipNodeId !== null ? (getDisplayNode(tooltipNodeId, selectedIdSet) ?? plannerNodeMap.get(tooltipNodeId) ?? null) : null
	);
	const hoveredSourceNode = $derived(tooltipNodeId !== null ? (plannerNodeMap.get(tooltipNodeId) ?? null) : null);
	const choiceChildren = $derived(focusedSourceNode ? getChoiceChildren(focusedSourceNode.referenceId) : []);
	const activeChoiceChild = $derived(focusedSourceNode ? getActiveChoiceChild(focusedSourceNode.referenceId, selectedIdSet) : null);
	const tooltipChoiceChildren = $derived(hoveredSourceNode ? getChoiceChildren(hoveredSourceNode.referenceId) : []);
	const tooltipActiveChoiceChild = $derived(hoveredSourceNode ? getActiveChoiceChild(hoveredSourceNode.referenceId, selectedIdSet) : null);
	const treeOverdrawn = $derived(remainingPoints < 0 || !isTreeStateValid(selectedIdSet, anchorId));

	$effect(() => {
		if (!selectedIdSet.has(anchorId)) {
			selectedIds = [anchorId];
			focusedNodeId = anchorId;
		}
	});

	$effect(() => {
		const startingAnchor = plannerNodeMap.get(anchorId);
		if (treeScrollElement && startingAnchor && hasLoadedStoredState) {
			treeScrollElement.scrollLeft = Math.max(0, startingAnchor.canvasX - treeScrollElement.clientWidth / 2);
			treeScrollElement.scrollTop = Math.max(0, startingAnchor.canvasY - treeScrollElement.clientHeight / 2);
		}
	});

	$effect(() => {
		if (!hasLoadedStoredState) {
			return;
		}

		const state = {
			startClass,
			currentLevel,
			extraPoints,
			selectedIds,
			zoomLevel
		};

		localStorage.setItem(storageKey, JSON.stringify(state));
		updateShareUrl(state);
	});

	function toggleNode(node: PlannerNode) {
		focusedNodeId = node.referenceId;
		drawerOpen = true;

		if (!isSelectableNode(node)) {
			return;
		}

		if (node.isChoiceNode) {
			pinnedTooltipNodeId = node.referenceId;
			hoveredNodeId = node.referenceId;
			return;
		}

		if (selectedIdSet.has(node.referenceId)) {
			if (canDeallocateNode(node.referenceId, selectedIdSet, anchorId)) {
				selectedIds = selectedIds.filter((id) => id !== node.referenceId);
			}
			return;
		}

		if (canAllocateNode(node.referenceId, selectedIdSet)) {
			selectedIds = [...selectedIds, node.referenceId];
		}
	}

	function deallocateNode(node: PlannerNode) {
		focusedNodeId = node.referenceId;
		drawerOpen = true;

		if (!isSelectableNode(node)) {
			return;
		}

		if (node.isChoiceNode) {
			if (selectedIdSet.has(node.referenceId)) {
				clearMasteryOption(node.referenceId);
			}
			return;
		}

		if (selectedIdSet.has(node.referenceId) && canDeallocateNode(node.referenceId, selectedIdSet, anchorId)) {
			selectedIds = selectedIds.filter((id) => id !== node.referenceId);
		}
	}

	function chooseMasteryOption(hubId: number, childId: number) {
		selectedIds = [...applyChoiceSelection(hubId, childId, selectedIdSet)];
		focusedNodeId = hubId;
		pinnedTooltipNodeId = hubId;
		hoveredNodeId = hubId;
	}

	function clearMasteryOption(hubId: number) {
		const nextSelected = clearChoiceSelection(hubId, selectedIdSet);
		if (isTreeStateValid(nextSelected, anchorId)) {
			selectedIds = [...nextSelected];
			focusedNodeId = hubId;
			pinnedTooltipNodeId = hubId;
			hoveredNodeId = hubId;
		}
	}

	function resetTree() {
		selectedIds = [anchorId];
		focusedNodeId = anchorId;
		hoveredNodeId = null;
	}

	function getNodeState(node: PlannerNode): 'selected' | 'available' | 'locked' | 'disabled' {
		if (selectedIdSet.has(node.referenceId)) {
			return 'selected';
		}

		if (!isSelectableNode(node)) {
			return 'disabled';
		}

		return canAllocateNode(node.referenceId, selectedIdSet) ? 'available' : 'locked';
	}

	function edgeIsActive(from: number, to: number): boolean {
		return selectedIdSet.has(from) && selectedIdSet.has(to);
	}

	function getRenderedNode(node: PlannerNode): PlannerNode {
		return getDisplayNode(node.referenceId, selectedIdSet) ?? node;
	}

	function setHover(nodeId: number | null, event?: MouseEvent) {
		if (pinnedTooltipNodeId !== null && nodeId !== pinnedTooltipNodeId) {
			return;
		}

		hoveredNodeId = nodeId;
		if (event) {
			hoveredClientX = event.clientX;
			hoveredClientY = event.clientY;
		}
	}

	function moveHover(event: MouseEvent) {
		hoveredClientX = event.clientX;
		hoveredClientY = event.clientY;
	}

	function pinTooltip(nodeId: number) {
		pinnedTooltipNodeId = nodeId;
		hoveredNodeId = nodeId;
		pinnedTooltipX = hoveredClientX + 18;
		pinnedTooltipY = hoveredClientY + 18;
	}

	function unpinTooltip() {
		pinnedTooltipNodeId = null;
		isDraggingTooltip = false;
		if (!isHoveringTooltip) {
			hoveredNodeId = null;
		}
	}

	function beginTooltipDrag(event: MouseEvent) {
		if (pinnedTooltipNodeId === null || event.button !== 0) return;
		isDraggingTooltip = true;
		tooltipDragOffsetX = event.clientX - pinnedTooltipX;
		tooltipDragOffsetY = event.clientY - pinnedTooltipY;
		event.preventDefault();
	}

	function moveTooltipDrag(event: MouseEvent) {
		if (!isDraggingTooltip) return;
		pinnedTooltipX = event.clientX - tooltipDragOffsetX;
		pinnedTooltipY = event.clientY - tooltipDragOffsetY;
	}

	function endTooltipDrag() {
		isDraggingTooltip = false;
	}

	function beginTreeDrag(event: MouseEvent) {
		if (!treeScrollElement || event.button !== 0) {
			return;
		}

		const target = event.target;
		if (target instanceof HTMLElement && target.closest('button.tree-node')) {
			return;
		}

		isDraggingTree = true;
		dragStartX = event.clientX;
		dragStartY = event.clientY;
		dragScrollLeft = treeScrollElement.scrollLeft;
		dragScrollTop = treeScrollElement.scrollTop;
	}

	function handleTreeDrag(event: MouseEvent) {
		if (!isDraggingTree || !treeScrollElement) {
			return;
		}

		treeScrollElement.scrollLeft = dragScrollLeft - (event.clientX - dragStartX);
		treeScrollElement.scrollTop = dragScrollTop - (event.clientY - dragStartY);
	}

	function endTreeDrag() {
		isDraggingTree = false;
	}

	async function handleTreeWheel(event: WheelEvent) {
		if (!event.ctrlKey || !treeScrollElement) {
			return;
		}

		event.preventDefault();

		const previousZoom = zoomLevel;
		const nextZoom = clampZoom(previousZoom + (event.deltaY < 0 ? 0.1 : -0.1));
		if (nextZoom === previousZoom) {
			return;
		}

		const rect = treeScrollElement.getBoundingClientRect();
		const offsetX = event.clientX - rect.left;
		const offsetY = event.clientY - rect.top;
		const contentX = (treeScrollElement.scrollLeft + offsetX) / previousZoom;
		const contentY = (treeScrollElement.scrollTop + offsetY) / previousZoom;

		zoomLevel = nextZoom;
		await tick();

		treeScrollElement.scrollLeft = contentX * nextZoom - offsetX;
		treeScrollElement.scrollTop = contentY * nextZoom - offsetY;
	}

	async function copyShareLink() {
		try {
			await navigator.clipboard.writeText(window.location.href);
			toast.push('Planner link copied', { type: 'success', duration: 2500 });
		} catch {
			toast.push('Failed to copy planner link', { type: 'error', duration: 3000 });
		}
	}

	function updateShareUrl(state: { startClass: PlannerStartClass; currentLevel: number; extraPoints: number; selectedIds: number[] }) {
		const url = new URL(window.location.href);
		url.searchParams.set(shareParamKey, encodeBuildState(state));
		window.history.replaceState({}, '', url);
	}

	onMount(() => {
		const buildFromUrl = decodeBuildState(new URL(window.location.href).searchParams.get(shareParamKey));
		const stored = localStorage.getItem(storageKey);

		if (buildFromUrl) {
			startClass = buildFromUrl.startClass;
			currentLevel = buildFromUrl.currentLevel;
			extraPoints = buildFromUrl.extraPoints;
			selectedIds = buildFromUrl.selectedIds;
			focusedNodeId = buildFromUrl.selectedIds.at(-1) ?? getAnchorId(buildFromUrl.startClass);
		} else if (stored) {
			try {
				const parsed = JSON.parse(stored) as {
					startClass?: PlannerStartClass;
					currentLevel?: number;
					extraPoints?: number;
					selectedIds?: number[];
					zoomLevel?: number;
				};

				const nextStartClass: PlannerStartClass =
					parsed.startClass && startClassOptions.some((option) => option.value === parsed.startClass)
						? parsed.startClass
						: defaultStartClass;
				const nextAnchorId = getAnchorId(nextStartClass);
				const nextSelectedIds = Array.isArray(parsed.selectedIds)
					? [...new Set(parsed.selectedIds.filter((id): id is number => typeof id === 'number'))]
					: [nextAnchorId];

				startClass = nextStartClass;
				currentLevel = typeof parsed.currentLevel === 'number' && parsed.currentLevel > 0 ? Math.floor(parsed.currentLevel) : 1;
				extraPoints = typeof parsed.extraPoints === 'number' && parsed.extraPoints >= 0 ? Math.floor(parsed.extraPoints) : 0;
				zoomLevel = typeof parsed.zoomLevel === 'number' ? clampZoom(parsed.zoomLevel) : 1;
				selectedIds = nextSelectedIds.includes(nextAnchorId) ? nextSelectedIds : [nextAnchorId, ...nextSelectedIds];
				focusedNodeId = nextSelectedIds.at(-1) ?? nextAnchorId;
			} catch {
				startClass = defaultStartClass;
				currentLevel = 1;
				extraPoints = 0;
				zoomLevel = 1;
				selectedIds = [defaultAnchorId];
				focusedNodeId = defaultAnchorId;
			}
		}

		hasLoadedStoredState = true;

		const handleWindowMouseUp = () => endTreeDrag();
		window.addEventListener('mouseup', handleWindowMouseUp);

		return () => {
			window.removeEventListener('mouseup', handleWindowMouseUp);
		};
	});

	function encodeBuildState(state: {
		startClass: PlannerStartClass;
		currentLevel: number;
		extraPoints: number;
		selectedIds: number[];
	}): string {
		const anchorIdForClass = getAnchorId(state.startClass);
		const encodedIds = [...new Set(state.selectedIds)]
			.filter((id) => id !== anchorIdForClass)
			.sort((left, right) => left - right)
			.map((id) => id.toString(36))
			.join('.');

		return [
			startClassCodeMap[state.startClass],
			Math.max(1, Math.floor(state.currentLevel)).toString(36),
			Math.max(0, Math.floor(state.extraPoints)).toString(36),
			encodedIds
		].join('~');
	}

	function decodeBuildState(value: string | null): {
		startClass: PlannerStartClass;
		currentLevel: number;
		extraPoints: number;
		selectedIds: number[];
	} | null {
		if (!value) {
			return null;
		}

		const [classCode, levelPart, extraPart, idsPart = ''] = value.split('~');
		const startClass = startClassFromCodeMap[classCode];
		const currentLevelParsed = Number.parseInt(levelPart ?? '', 36);
		const extraPointsParsed = Number.parseInt(extraPart ?? '', 36);

		if (!startClass || Number.isNaN(currentLevelParsed) || Number.isNaN(extraPointsParsed)) {
			return null;
		}

		const anchorIdForClass = getAnchorId(startClass);
		const selectedIdsFromUrl = idsPart
			.split('.')
			.filter(Boolean)
			.map((part) => Number.parseInt(part, 36))
			.filter((id) => Number.isInteger(id) && plannerNodeMap.has(id));

		return {
			startClass,
			currentLevel: Math.max(1, currentLevelParsed),
			extraPoints: Math.max(0, extraPointsParsed),
			selectedIds: [anchorIdForClass, ...new Set(selectedIdsFromUrl)]
		};
	}

	function clampZoom(value: number): number {
		return Math.min(1.8, Math.max(0.45, Math.round(value * 100) / 100));
	}
</script>

<div class="planner-shell" onmousemove={moveTooltipDrag} onmouseup={endTooltipDrag}>
	<div class="control-bar">
		<div class="control-group compact">
			<label>
				<span>Class</span>
				<select bind:value={startClass}>
					{#each startClassOptions as option}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			</label>

			<label>
				<span>Level</span>
				<input type="number" min="1" bind:value={currentLevel} />
			</label>

			<label>
				<span>Extra</span>
				<input type="number" min="0" bind:value={extraPoints} />
			</label>
		</div>

		<div class="control-group stats">
			<div>
				<span>Spent</span>
				<strong>{spentPoints}</strong>
			</div>
			<div>
				<span>Required</span>
				<strong>{requiredLevel}</strong>
			</div>
			<div>
				<span>At level</span>
				<strong class:overdrawn={remainingPoints < 0}>{availablePoints}</strong>
			</div>
			<div>
				<span>Remaining</span>
				<strong class:overdrawn={remainingPoints < 0}>{remainingPoints}</strong>
			</div>
		</div>

		<div class="control-group actions">
			<button type="button" class="action-button" onclick={resetTree}>Reset</button>
			<button type="button" class="action-button secondary" onclick={copyShareLink}>Copy link</button>
			<button type="button" class="action-button secondary" onclick={() => (drawerOpen = !drawerOpen)}>
				{drawerOpen ? 'Hide panel' : 'Show panel'}
			</button>
		</div>
	</div>

	<div class="planner-stage">
		<section class={`tree-panel ${drawerOpen ? 'drawer-open' : ''}`}>
			<div
				class={`tree-scroll ${isDraggingTree ? 'dragging' : ''}`}
				role="presentation"
				bind:this={treeScrollElement}
				onmousedown={beginTreeDrag}
				onmousemove={handleTreeDrag}
				onmouseup={endTreeDrag}
				onmouseleave={endTreeDrag}
				onwheel={handleTreeWheel}
			>
				<div class="tree-zoom-shell" style={`width:${plannerCanvas.width * zoomLevel}px;height:${plannerCanvas.height * zoomLevel}px;`}>
					<div
						class={`tree-canvas ${treeOverdrawn ? 'warning' : ''}`}
						style={`width:${plannerCanvas.width}px;height:${plannerCanvas.height}px;transform:scale(${zoomLevel});`}
					>
						<svg class="tree-lines" viewBox={`0 0 ${plannerCanvas.width} ${plannerCanvas.height}`}>
							{#each plannerEdges as edge (edge.key)}
								{#if plannerNodeMap.has(edge.from) && plannerNodeMap.has(edge.to) && !plannerNodeMap.get(edge.to)?.isHidden && !plannerNodeMap.get(edge.from)?.isHidden}
									<line
										x1={plannerNodeMap.get(edge.from)?.canvasX}
										y1={plannerNodeMap.get(edge.from)?.canvasY}
										x2={plannerNodeMap.get(edge.to)?.canvasX}
										y2={plannerNodeMap.get(edge.to)?.canvasY}
										class:active-edge={edgeIsActive(edge.from, edge.to)}
										class:effects-edge={edge.effectsOnly}
									/>
								{/if}
							{/each}
						</svg>

						{#each visibleNodes as node (node.referenceId)}
							{@const renderedNode = getRenderedNode(node)}
							<button
								type="button"
								class={`tree-node ${node.group} ${getNodeState(node)} ${isChoiceHub(node) ? 'choice-hub' : ''}`}
								style={`left:${node.canvasX}px;top:${node.canvasY}px;width:${getNodeRadius(node) * 2}px;height:${getNodeRadius(node) * 2}px;margin-left:-${getNodeRadius(node)}px;margin-top:-${getNodeRadius(node)}px;`}
								aria-label={renderedNode.displayName}
								onclick={() => toggleNode(node)}
								oncontextmenu={(event) => {
									event.preventDefault();
									deallocateNode(node);
								}}
								onmouseenter={(event) => {
									focusedNodeId = node.referenceId;
									setHover(node.referenceId, event);
								}}
								onmouseleave={() => {
									if (!isHoveringTooltip && pinnedTooltipNodeId === null) {
										setHover(null);
									}
								}}
								onmousemove={moveHover}
							>
								<img src={renderedNode.assetPath} alt={renderedNode.displayName} />
							</button>
						{/each}
					</div>
				</div>
			</div>
		</section>

		<aside class={`details-drawer ${drawerOpen ? 'open' : 'collapsed'}`}>
			<button type="button" class="drawer-tab" onclick={() => (drawerOpen = !drawerOpen)}>
				{drawerOpen ? '>' : '<'}
			</button>

			{#if drawerOpen}
				<div class="drawer-content">
					<section class="card">
						<p class="eyebrow">Focused node</p>
						<h2>{focusedNode.displayName}</h2>
						<p class="muted">
							{#if getFormattedTooltip(focusedNode)}
								<MechanicRichText text={getFormattedTooltip(focusedNode)} />
							{:else}
								No localized tooltip found for this node yet.
							{/if}
						</p>
						<dl class="detail-grid">
							<div>
								<dt>Type</dt>
								<dd>{focusedNode.group}</dd>
							</div>
							<div>
								<dt>Value</dt>
								<dd>{focusedNode.value}</dd>
							</div>
							<div>
								<dt>Required edges</dt>
								<dd>{focusedNode.requiredAllocatedEdges ?? 1}</dd>
							</div>
							<div>
								<dt>Status</dt>
								<dd>{getNodeState(plannerNodeMap.get(focusedNodeId) ?? focusedNode)}</dd>
							</div>
						</dl>
						{#if focusedSourceNode.isChoiceNode}
							<p class="mastery-help">
								This mastery slot unlocks once its surrounding path requirements are met. Choose one mastery
								option below to allocate it.
							</p>
						{/if}
					</section>

					{#if focusedSourceNode.isChoiceNode}
						<section class="card">
							<div class="mastery-header">
								<div>
									<p class="eyebrow">Mastery</p>
									<h2>Choose one</h2>
								</div>
								{#if activeChoiceChild}
									<button type="button" class="mini-button" onclick={() => clearMasteryOption(focusedSourceNode.referenceId)}>
										Clear
									</button>
								{/if}
							</div>

							{#if choiceChildren.length === 0}
								<p class="muted">No mastery options were found for this slot.</p>
							{:else}
								<div class="mastery-state">
									<span>Requirement</span>
									<strong>
										{canAllocateNode(focusedSourceNode.referenceId, selectedIdSet) || selectedIdSet.has(focusedSourceNode.referenceId)
											? 'Ready'
											: `Needs ${focusedSourceNode.requiredAllocatedEdges ?? 1} linked passives`}
									</strong>
								</div>

								<div class="mastery-options">
									{#each choiceChildren as choice}
										<button
											type="button"
											class={`mastery-option ${activeChoiceChild?.referenceId === choice.referenceId ? 'active' : ''}`}
											disabled={!canAllocateNode(focusedSourceNode.referenceId, selectedIdSet) && !selectedIdSet.has(focusedSourceNode.referenceId)}
											onclick={() => chooseMasteryOption(focusedSourceNode.referenceId, choice.referenceId)}
										>
											<img src={choice.assetPath} alt={choice.displayName} />
											<div>
												<strong>{choice.displayName}</strong>
												<p>
													{#if getFormattedTooltip(choice)}
														<MechanicRichText text={getFormattedTooltip(choice)} />
													{:else}
														No localized tooltip found for this mastery.
													{/if}
												</p>
											</div>
										</button>
									{/each}
								</div>
							{/if}
						</section>
					{/if}

					<section class="card">
						<p class="eyebrow">Stats</p>
						<h2>Passive totals</h2>
						{#if summaryItems.length === 0}
							<p class="muted">Allocate nodes to see the current totals.</p>
						{:else}
							<ul class="summary-list">
								{#each summaryItems as item (item.key)}
									<li>
										<div>
											<strong>{item.name}</strong>
											{#if item.tooltip}
												<p><MechanicRichText text={item.tooltip} /></p>
											{/if}
										</div>
										<span>+{item.totalValue}{item.count > 1 ? ` (${item.count}x)` : ''}</span>
									</li>
								{/each}
							</ul>
						{/if}
					</section>

					<section class="card">
						<p class="eyebrow">Notes</p>
						<ul class="notes-list">
							<li>The planner uses the copied passive JSON and passive icon assets stored in this repo.</li>
							<li>Mastery hubs require their configured edge count before you can choose one mastery.</li>
							<li>Only one mastery option can be active in a mastery slot at a time.</li>
						</ul>
					</section>
				</div>
			{/if}
		</aside>
	</div>

	{#if hoveredNode}
		<div
			class={`hover-tooltip ${pinnedTooltipNodeId !== null ? 'pinned' : ''} ${isDraggingTooltip ? 'dragging' : ''}`}
			role="presentation"
			style={pinnedTooltipNodeId !== null
				? `left:${pinnedTooltipX}px;top:${pinnedTooltipY}px;`
				: `left:${hoveredClientX + 18}px;top:${hoveredClientY + 18}px;`}
			onmouseenter={() => (isHoveringTooltip = true)}
			onmouseleave={() => {
				isHoveringTooltip = false;
				if (pinnedTooltipNodeId === null) {
					hoveredNodeId = null;
				}
			}}
		>
			<div
				class="tooltip-head"
				onmousedown={beginTooltipDrag}
				role="presentation"
			>
				<img src={hoveredNode.assetPath} alt={hoveredNode.displayName} />
				<div>
					<strong>{hoveredNode.displayName}</strong>
					<span>{hoveredNode.group}</span>
				</div>
				{#if hoveredSourceNode?.isChoiceNode}
					<button type="button" class="tooltip-pin" onclick={() => pinTooltip(hoveredSourceNode.referenceId)}>
						{pinnedTooltipNodeId === hoveredSourceNode.referenceId ? 'Pinned' : 'Pin'}
					</button>
				{/if}
				{#if pinnedTooltipNodeId !== null}
					<button type="button" class="tooltip-pin" onclick={unpinTooltip}>Close</button>
				{/if}
			</div>
			{#if getFormattedTooltip(hoveredNode)}
				<p><MechanicRichText text={getFormattedTooltip(hoveredNode)} /></p>
			{/if}

			{#if hoveredSourceNode?.isChoiceNode}
				<div class="tooltip-mastery">
					<div class="mastery-state">
						<span>Requirement</span>
						<strong>
							{canAllocateNode(hoveredSourceNode.referenceId, selectedIdSet) || selectedIdSet.has(hoveredSourceNode.referenceId)
								? 'Ready'
								: `Needs ${hoveredSourceNode.requiredAllocatedEdges ?? 1} linked passives`}
						</strong>
					</div>

					{#if tooltipActiveChoiceChild}
						<div class="tooltip-actions">
							<button type="button" class="mini-button" onclick={() => clearMasteryOption(hoveredSourceNode.referenceId)}>
								Clear choice
							</button>
						</div>
					{/if}

					<div class="mastery-options compact">
						{#each tooltipChoiceChildren as choice}
							<button
								type="button"
								class={`mastery-option ${tooltipActiveChoiceChild?.referenceId === choice.referenceId ? 'active' : ''}`}
								disabled={!canAllocateNode(hoveredSourceNode.referenceId, selectedIdSet) && !selectedIdSet.has(hoveredSourceNode.referenceId)}
								onclick={() => chooseMasteryOption(hoveredSourceNode.referenceId, choice.referenceId)}
							>
								<img src={choice.assetPath} alt={choice.displayName} />
								<div>
									<strong>{choice.displayName}</strong>
									<p>
										{#if getFormattedTooltip(choice)}
											<MechanicRichText text={getFormattedTooltip(choice)} />
										{:else}
											No localized tooltip found for this mastery.
										{/if}
									</p>
								</div>
							</button>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	:global(body) {
		background:
			radial-gradient(circle at top, rgba(239, 86, 47, 0.18), transparent 36%),
			linear-gradient(180deg, #111827 0%, #172033 48%, #0f172a 100%);
	}

	.planner-shell {
		height: calc(100vh - 5.5rem);
		padding: 0.5rem 0.75rem 0.75rem;
		color: #e5e7eb;
	}

	.control-bar {
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: 0.75rem;
		align-items: stretch;
		margin-bottom: 0.75rem;
	}

	.control-group {
		display: flex;
		gap: 0.6rem;
		align-items: center;
		padding: 0.6rem 0.7rem;
		border: 1px solid rgba(148, 163, 184, 0.18);
		border-radius: 18px;
		background: rgba(15, 23, 42, 0.88);
		backdrop-filter: blur(12px);
	}

	.control-group.compact {
		align-items: end;
	}

	label {
		display: grid;
		gap: 0.2rem;
		font-size: 0.78rem;
	}

	label span,
	.stats span,
	.tooltip-head span,
	.eyebrow,
	dt {
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-size: 0.7rem;
		color: #94a3b8;
	}

	select,
	input,
	.action-button,
	.mini-button {
		border: 1px solid rgba(148, 163, 184, 0.24);
		border-radius: 12px;
		background: rgba(30, 41, 59, 0.96);
		color: #f8fafc;
		padding: 0.6rem 0.75rem;
	}

	select,
	input {
		min-width: 82px;
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
	}

	.stats div {
		display: grid;
		gap: 0.12rem;
		min-width: 0;
	}

	.stats strong {
		font-size: 1.15rem;
	}

	.overdrawn {
		color: #fca5a5;
	}

	.actions {
		display: flex;
	}

	.action-button,
	.mini-button,
	.drawer-tab {
		cursor: pointer;
		font-weight: 700;
	}

	.action-button {
		background: linear-gradient(135deg, #ef562f, #cc4522);
	}

	.action-button.secondary,
	.mini-button,
	.drawer-tab {
		background: rgba(30, 41, 59, 0.96);
	}

	.planner-stage {
		position: relative;
		height: calc(100% - 4.2rem);
	}

	.tree-panel {
		height: 100%;
		border: 1px solid rgba(148, 163, 184, 0.18);
		border-radius: 28px;
		background: rgba(15, 23, 42, 0.88);
		box-shadow: 0 24px 80px rgba(15, 23, 42, 0.45);
	}

	.tree-panel.drawer-open {
		padding-right: 0;
	}

	.tree-scroll {
		height: 100%;
		overflow: auto;
		padding: 0.75rem;
		cursor: grab;
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	.tree-scroll::-webkit-scrollbar {
		display: none;
	}

	.tree-scroll.dragging {
		cursor: grabbing;
		user-select: none;
	}

	.tree-canvas {
		position: relative;
		transform-origin: top left;
		border-radius: 24px;
		background:
			radial-gradient(circle at center, rgba(251, 191, 36, 0.08), transparent 44%),
			radial-gradient(circle at center, rgba(15, 23, 42, 0.25) 0, rgba(15, 23, 42, 0.95) 74%);
	}

	.tree-zoom-shell {
		position: relative;
	}

	.tree-canvas.warning {
		box-shadow: inset 0 0 0 1px rgba(248, 113, 113, 0.55);
	}

	.tree-lines {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}

	line {
		stroke: rgba(100, 116, 139, 0.38);
		stroke-width: 5;
	}

	.active-edge {
		stroke: rgba(251, 191, 36, 0.82);
	}

	.effects-edge {
		stroke-width: 3;
	}

	.tree-node {
		position: absolute;
		display: grid;
		place-items: center;
		border-radius: 999px;
		border: 2px solid rgba(148, 163, 184, 0.24);
		background: rgba(30, 41, 59, 0.9);
		padding: 0;
		cursor: pointer;
		overflow: hidden;
		transition:
			transform 120ms ease,
			border-color 120ms ease,
			box-shadow 120ms ease,
			opacity 120ms ease;
	}

	.tree-node img,
	.mastery-option img,
	.tooltip-head img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: contain;
		image-rendering: pixelated;
	}

	.tree-node:hover {
		transform: scale(1.08);
	}

	.tree-node.selected {
		border-color: #fbbf24;
		box-shadow: 0 0 0 5px rgba(251, 191, 36, 0.16);
	}

	.tree-node.available {
		border-color: rgba(110, 231, 183, 0.45);
		box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.08);
	}

	.tree-node.locked,
	.tree-node.disabled {
		opacity: 0.58;
	}

	.tree-node.disabled {
		cursor: default;
		filter: grayscale(0.35);
	}

	.tree-node.choice-hub {
		border-width: 3px;
	}

	.details-drawer {
		position: absolute;
		top: 0.6rem;
		right: 0.6rem;
		bottom: 0.6rem;
		width: 360px;
		display: flex;
		align-items: stretch;
		pointer-events: none;
	}

	.details-drawer.open,
	.details-drawer.collapsed {
		pointer-events: auto;
	}

	.drawer-tab {
		align-self: center;
		width: 34px;
		height: 72px;
		border: 1px solid rgba(148, 163, 184, 0.18);
		border-right: 0;
		border-radius: 16px 0 0 16px;
		color: #f8fafc;
	}

	.drawer-content {
		width: calc(100% - 34px);
		height: 100%;
		overflow: auto;
		padding: 0.35rem 0.35rem 0.35rem 0;
	}

	.collapsed {
		width: 34px;
	}

	.card {
		margin-bottom: 0.65rem;
		padding: 1rem;
		border: 1px solid rgba(148, 163, 184, 0.18);
		border-radius: 22px;
		background: rgba(15, 23, 42, 0.92);
		box-shadow: 0 24px 80px rgba(15, 23, 42, 0.45);
	}

	.card h2 {
		margin: 0 0 0.35rem;
		font-size: 1.2rem;
	}

	.muted,
	.summary-list p,
	.notes-list,
	.mastery-option p,
	.hover-tooltip p {
		color: #cbd5e1;
	}

	.detail-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.8rem;
		margin-top: 0.85rem;
	}

	dd {
		margin: 0.2rem 0 0;
		font-weight: 700;
	}

	.mastery-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
	}

	.mastery-help {
		margin-top: 0.85rem;
		color: #cbd5e1;
	}

	.mastery-state {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
		margin-top: 0.85rem;
		padding: 0.7rem 0.8rem;
		border-radius: 14px;
		background: rgba(30, 41, 59, 0.88);
	}

	.mastery-state span {
		color: #94a3b8;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-size: 0.7rem;
	}

	.mastery-options {
		display: grid;
		gap: 0.65rem;
		margin-top: 0.85rem;
	}

	.mastery-option {
		display: grid;
		grid-template-columns: 48px 1fr;
		gap: 0.7rem;
		align-items: start;
		padding: 0.75rem;
		border: 1px solid rgba(148, 163, 184, 0.18);
		border-radius: 16px;
		background: rgba(30, 41, 59, 0.88);
		color: inherit;
		text-align: left;
		cursor: pointer;
	}

	.mastery-option img,
	.tooltip-head img {
		width: 48px;
		height: 48px;
	}

	.mastery-option.active {
		border-color: rgba(251, 191, 36, 0.75);
		box-shadow: 0 0 0 4px rgba(251, 191, 36, 0.12);
	}

	.mastery-option:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.summary-list,
	.notes-list {
		margin: 0.85rem 0 0;
		padding: 0;
		list-style: none;
	}

	.summary-list li,
	.notes-list li {
		display: grid;
		gap: 0.3rem;
		padding: 0.8rem 0;
		border-top: 1px solid rgba(148, 163, 184, 0.14);
	}

	.summary-list li {
		grid-template-columns: minmax(0, 1fr) auto;
		column-gap: 0.75rem;
	}

	.hover-tooltip {
		position: fixed;
		z-index: 60;
		width: min(360px, calc(100vw - 2rem));
		padding: 0.8rem;
		border: 1px solid rgba(148, 163, 184, 0.18);
		border-radius: 18px;
		background: rgba(15, 23, 42, 0.96);
		backdrop-filter: blur(14px);
		box-shadow: 0 18px 48px rgba(2, 6, 23, 0.45);
		pointer-events: auto;
	}

	.tooltip-head {
		display: grid;
		grid-template-columns: 48px 1fr auto auto;
		gap: 0.7rem;
		align-items: center;
		margin-bottom: 0.55rem;
	}

	.hover-tooltip.pinned .tooltip-head {
		cursor: grab;
	}

	.hover-tooltip.dragging .tooltip-head,
	.hover-tooltip.dragging {
		cursor: grabbing;
		user-select: none;
	}

	.tooltip-head strong {
		display: block;
	}

	.tooltip-pin {
		border: 1px solid rgba(148, 163, 184, 0.24);
		border-radius: 10px;
		background: rgba(30, 41, 59, 0.96);
		color: #f8fafc;
		padding: 0.45rem 0.6rem;
		cursor: pointer;
		font-weight: 700;
	}

	.tooltip-mastery {
		margin-top: 0.7rem;
	}

	.tooltip-actions {
		display: flex;
		justify-content: flex-end;
		margin-top: 0.65rem;
	}

	.mastery-options.compact {
		margin-top: 0.65rem;
	}

	@media (max-width: 1100px) {
		.control-bar {
			grid-template-columns: 1fr;
		}

		.stats {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.details-drawer {
			width: 320px;
		}
	}

	@media (max-width: 760px) {
		.planner-shell {
			height: auto;
			min-height: calc(100vh - 5.5rem);
			padding-inline: 0.4rem;
		}

		.planner-stage {
			height: auto;
			min-height: calc(100vh - 12rem);
		}

		.details-drawer {
			position: static;
			width: auto;
			height: auto;
			margin-top: 0.75rem;
		}

		.drawer-tab {
			display: none;
		}

		.drawer-content {
			width: 100%;
			padding: 0;
		}

		.tree-panel {
			height: 72vh;
		}

		.stats,
		.detail-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
