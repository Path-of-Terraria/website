<script lang="ts">
	import { onMount, tick } from 'svelte';
	import MechanicRichText from '$lib/components/MechanicRichText.svelte';
	import { toast } from '$lib/toast';
	import {
		applyChoiceSelection,
		canAllocateNode,
		clearChoiceSelection,
		getActiveChoiceChild,
		getAutoAllocatePath,
		getAnchorId,
		getChoiceChildren,
		getDisplayNode,
		getFormattedTooltip,
		getNodeRadius,
		getPassivePresentation,
		getPrunedSelectionAfterDeallocate,
		getSpentPoints,
		isChoiceHub,
		isSelectableNode,
		isTreeStateValid,
		plannerCanvas,
		plannerEdges,
		plannerNodeMap,
		plannerNodes,
		plannerOffsetX,
		plannerOffsetY,
		plannerRawNodes,
		plannerUniqueIdentifiers,
		startClassOptions,
		summarizeSelection,
		type PassiveNodeData,
		type PlannerEdge,
		type PlannerNode,
		type PlannerStartClass
	} from '$lib/planner/passive-tree';

	const defaultStartClass: PlannerStartClass = 'melee';
	const defaultAnchorId = getAnchorId(defaultStartClass);
	const storageKey = 'pot-passive-planner-state-v1';
	const shareParamKey = 'build';
	const devShareParamKey = 'devbuild';
	const devSnapGridSize = 10;
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
	let passiveSearch = $state('');

	// Dev mode state
	let isDevMode = $state(false);
	let devActiveTab = $state<'node' | 'dev'>('node');
	let devPositionOverrides = $state<Record<number, { x: number; y: number }>>({});
	let devValueOverrides = $state<Record<number, number>>({});
	let devRequirementOverrides = $state<Record<number, number>>({});
	let devAddedNodes = $state<Array<{ referenceId: number; internalIdentifier: string; position: { x: number; y: number } }>>([]);
	let devRemovedNodeIds = $state<Set<number>>(new Set());
	let devAddedEdges = $state<Set<string>>(new Set());
	let devRemovedEdges = $state<Set<string>>(new Set());
	let devConnectSourceId = $state<number | null>(null);
	let devAddIdentifier = $state('');
	let devAddSearch = $state('');
	let draggingNodeId = $state<number | null>(null);
	let shouldCenterOnAnchor = $state(true);
	let draggingStartMouseX = 0;
	let draggingStartMouseY = 0;
	let draggingStartPositions = $state<Record<number, { x: number; y: number }>>({});

	const anchorId = $derived(getAnchorId(startClass));
	const selectedIdSet = $derived(new Set(selectedIds));
	const spentPoints = $derived(getSpentPoints(selectedIdSet));
	const requiredLevel = $derived(Math.max(1, spentPoints));
	const availablePoints = $derived(Math.max(1, currentLevel));
	const remainingPoints = $derived(availablePoints - spentPoints);
	const summaryItems = $derived(summarizeSelection(selectedIdSet));
	const visibleNodes = $derived(plannerNodes.filter((node) => !node.isHidden));
	const devAddOptions = $derived.by(() =>
		plannerUniqueIdentifiers
			.map((identifier) => {
				const presentation = getPassivePresentation(identifier);
				return {
					identifier,
					displayName: presentation.displayName,
					searchText: `${presentation.displayName} ${identifier}`.toLocaleLowerCase()
				};
			})
			.sort((left, right) => left.displayName.localeCompare(right.displayName) || left.identifier.localeCompare(right.identifier))
	);
	const filteredDevAddOptions = $derived.by(() => {
		const query = devAddSearch.trim().toLocaleLowerCase();
		if (!query) {
			return devAddOptions;
		}

		return devAddOptions.filter((option) => option.searchText.includes(query));
	});

	// Dev mode derived data
	const devEffectiveNodes = $derived.by((): PlannerNode[] => {
		const overridden = plannerNodes
			.filter((n) => !devRemovedNodeIds.has(n.referenceId))
			.map((n) => {
				const pos = devPositionOverrides[n.referenceId];
				const value = devValueOverrides[n.referenceId];
				const requiredAllocatedEdges = devRequirementOverrides[n.referenceId];
				if (!pos && value === undefined && requiredAllocatedEdges === undefined) return n;
				return {
					...n,
					value: value ?? n.value,
					requiredAllocatedEdges: requiredAllocatedEdges ?? n.requiredAllocatedEdges,
					canvasX: (pos?.x ?? n.position.x) + plannerOffsetX,
					canvasY: (pos?.y ?? n.position.y) + plannerOffsetY
				};
			});
		const added: PlannerNode[] = devAddedNodes.map((n) => ({
			...getPassivePresentation(n.internalIdentifier),
			internalIdentifier: n.internalIdentifier,
			referenceId: n.referenceId,
			maxLevel: 1,
			value: devValueOverrides[n.referenceId] ?? 0,
			position: n.position,
			connections: [],
			group: 'minor' as const,
			requiredAllocatedEdges: devRequirementOverrides[n.referenceId],
			canvasX: n.position.x + plannerOffsetX,
			canvasY: n.position.y + plannerOffsetY
		}));
		return [...overridden, ...added];
	});
	const devEffectiveNodeMap = $derived(new Map(devEffectiveNodes.map((n) => [n.referenceId, n])));
	const devEffectiveEdges = $derived.by((): PlannerEdge[] => {
		const filtered = plannerEdges.filter((e) => {
			if (devRemovedNodeIds.has(e.from) || devRemovedNodeIds.has(e.to)) return false;
			if (devRemovedEdges.has(e.key)) return false;
			return true;
		});
		const added: PlannerEdge[] = [...devAddedEdges].map((key) => {
			const [from, to] = key.split(':').map(Number);
			return { key, from, to, hidden: false, effectsOnly: false };
		});
		return [...filtered, ...added];
	});
	const activeNodeMap = $derived(isDevMode ? devEffectiveNodeMap : plannerNodeMap);
	const activeEdges = $derived(isDevMode ? devEffectiveEdges : plannerEdges);
	const activeVisibleNodes = $derived(isDevMode ? devEffectiveNodes : visibleNodes);

	const focusedSourceNode = $derived((isDevMode ? devEffectiveNodeMap : plannerNodeMap).get(focusedNodeId) ?? (isDevMode ? devEffectiveNodeMap : plannerNodeMap).get(anchorId) ?? plannerNodes[0]);
	const focusedNode = $derived(
		isDevMode
			? (activeNodeMap.get(focusedNodeId) ?? activeNodeMap.get(anchorId) ?? plannerNodes[0])
			: (getDisplayNode(focusedNodeId, selectedIdSet) ?? activeNodeMap.get(anchorId) ?? plannerNodes[0])
	);
	const tooltipNodeId = $derived(pinnedTooltipNodeId ?? hoveredNodeId);
	const hoveredNode = $derived(
		tooltipNodeId !== null
			? (isDevMode
				? (activeNodeMap.get(tooltipNodeId) ?? null)
				: (getDisplayNode(tooltipNodeId, selectedIdSet) ?? activeNodeMap.get(tooltipNodeId) ?? null))
			: null
	);
	const hoveredSourceNode = $derived(tooltipNodeId !== null ? (activeNodeMap.get(tooltipNodeId) ?? null) : null);
	const choiceChildren = $derived(focusedSourceNode ? getChoiceChildren(focusedSourceNode.referenceId) : []);
	const activeChoiceChild = $derived(focusedSourceNode ? getActiveChoiceChild(focusedSourceNode.referenceId, selectedIdSet) : null);
	const tooltipChoiceChildren = $derived(hoveredSourceNode ? getChoiceChildren(hoveredSourceNode.referenceId) : []);
	const tooltipActiveChoiceChild = $derived(hoveredSourceNode ? getActiveChoiceChild(hoveredSourceNode.referenceId, selectedIdSet) : null);
	const treeOverdrawn = $derived(!isDevMode && (remainingPoints < 0 || !isTreeStateValid(selectedIdSet, anchorId)));
	const normalizedPassiveSearch = $derived(passiveSearch.trim().toLocaleLowerCase());
	const matchingNodeIds = $derived.by(() => {
		if (!normalizedPassiveSearch) {
			return new Set<number>();
		}

		return new Set(
			visibleNodes
				.filter((node) => getNodeSearchText(node).includes(normalizedPassiveSearch))
				.map((node) => node.referenceId)
		);
	});
	const passiveSearchMatchCount = $derived(matchingNodeIds.size);

	$effect(() => {
		if (!selectedIdSet.has(anchorId)) {
			selectedIds = [anchorId];
			focusedNodeId = anchorId;
			shouldCenterOnAnchor = true;
		}
	});

	$effect(() => {
		if (devAddIdentifier && devAddOptions.some((option) => option.identifier === devAddIdentifier)) {
			return;
		}

		devAddIdentifier = devAddOptions[0]?.identifier ?? '';
	});

	$effect(() => {
		if (!treeScrollElement || !hasLoadedStoredState || !shouldCenterOnAnchor) return;
		const startingAnchor = activeNodeMap.get(anchorId);
		if (!startingAnchor) return;
		treeScrollElement.scrollLeft = Math.max(0, startingAnchor.canvasX - treeScrollElement.clientWidth / 2);
		treeScrollElement.scrollTop = Math.max(0, startingAnchor.canvasY - treeScrollElement.clientHeight / 2);
		shouldCenterOnAnchor = false;
	});

	$effect(() => {
		if (!hasLoadedStoredState) {
			return;
		}

		const state = {
			startClass,
			currentLevel,
			selectedIds,
			zoomLevel
		};

		localStorage.setItem(storageKey, JSON.stringify(state));
		updateShareUrl(state);
	});

	$effect(() => {
		if (!hasLoadedStoredState || !isDevMode) return;
		// Access all dev state to track dependencies
		void devPositionOverrides;
		void devValueOverrides;
		void devRequirementOverrides;
		void devAddedNodes;
		void devRemovedNodeIds;
		void devAddedEdges;
		void devRemovedEdges;
		updateDevShareUrl();
	});

	function toggleNode(node: PlannerNode) {
		focusedNodeId = node.referenceId;
		drawerOpen = true;

		if (isDevMode) {
			if (devConnectSourceId !== null) {
				devToggleConnect(node.referenceId);
			}
			devActiveTab = 'dev';
			return;
		}

		if (!isSelectableNode(node)) {
			return;
		}

		if (node.isChoiceNode) {
			pinnedTooltipNodeId = node.referenceId;
			hoveredNodeId = node.referenceId;
			return;
		}

		if (selectedIdSet.has(node.referenceId)) {
			selectedIds = [...getPrunedSelectionAfterDeallocate(node.referenceId, selectedIdSet, anchorId)];
			return;
		}

		if (canAllocateNode(node.referenceId, selectedIdSet)) {
			selectedIds = [...selectedIds, node.referenceId];
			return;
		}

		const autoAllocatePath = getAutoAllocatePath(node.referenceId, selectedIdSet);
		if (autoAllocatePath && autoAllocatePath.length > 0) {
			selectedIds = [...selectedIds, ...autoAllocatePath];
			focusedNodeId = autoAllocatePath.at(-1) ?? node.referenceId;
			return;
		}

		toast.push(`Unable to find a valid path to ${node.displayName}`, {
			type: 'error',
			duration: 3000
		});
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

		if (selectedIdSet.has(node.referenceId)) {
			selectedIds = [...getPrunedSelectionAfterDeallocate(node.referenceId, selectedIdSet, anchorId)];
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
		shouldCenterOnAnchor = true;
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
		if (draggingNodeId !== null || !isDraggingTree || !treeScrollElement) {
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
		const nextZoom = clampZoom(previousZoom + (event.deltaY < 0 ? 0.05 : -0.05));
		if (nextZoom === previousZoom) {
			return;
		}

		const rect = treeScrollElement.getBoundingClientRect();
		// Anchor to viewport center so zoom doesn't drift left
		const offsetX = rect.width / 2;
		const offsetY = rect.height / 2;
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

	function updateShareUrl(state: { startClass: PlannerStartClass; currentLevel: number; selectedIds: number[] }) {
		const url = new URL(window.location.href);
		url.searchParams.set(shareParamKey, encodeBuildState(state));
		// Preserve ?dev param
		if (isDevMode) url.searchParams.set('dev', '');
		window.history.replaceState({}, '', url);
	}

	onMount(() => {
		const pageUrl = new URL(window.location.href);
		isDevMode = pageUrl.searchParams.has('dev');
		if (isDevMode) {
			decodeDevState(pageUrl.searchParams.get(devShareParamKey));
		}

		const buildFromUrl = decodeBuildState(pageUrl.searchParams.get(shareParamKey));
		const stored = localStorage.getItem(storageKey);

		if (buildFromUrl) {
			startClass = buildFromUrl.startClass;
			currentLevel = buildFromUrl.currentLevel;
			selectedIds = buildFromUrl.selectedIds;
			focusedNodeId = buildFromUrl.selectedIds.at(-1) ?? getAnchorId(buildFromUrl.startClass);
		} else if (stored) {
			try {
				const parsed = JSON.parse(stored) as {
					startClass?: PlannerStartClass;
					currentLevel?: number;
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
				zoomLevel = typeof parsed.zoomLevel === 'number' ? clampZoom(parsed.zoomLevel) : 1;
				selectedIds = nextSelectedIds.includes(nextAnchorId) ? nextSelectedIds : [nextAnchorId, ...nextSelectedIds];
				focusedNodeId = nextSelectedIds.at(-1) ?? nextAnchorId;
			} catch {
				startClass = defaultStartClass;
				currentLevel = 1;
				zoomLevel = 1;
				selectedIds = [defaultAnchorId];
				focusedNodeId = defaultAnchorId;
			}
		}

		hasLoadedStoredState = true;

		const handleWindowMouseUp = () => { endTreeDrag(); endNodeDrag(); };
		const handleWindowMouseMove = (e: MouseEvent) => { handleDevNodeDragMove(e); };
		window.addEventListener('mouseup', handleWindowMouseUp);
		window.addEventListener('mousemove', handleWindowMouseMove);

		return () => {
			window.removeEventListener('mouseup', handleWindowMouseUp);
			window.removeEventListener('mousemove', handleWindowMouseMove);
		};
	});

	function encodeBuildState(state: {
		startClass: PlannerStartClass;
		currentLevel: number;
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
			encodedIds
		].join('~');
	}

	function decodeBuildState(value: string | null): {
		startClass: PlannerStartClass;
		currentLevel: number;
		selectedIds: number[];
	} | null {
		if (!value) {
			return null;
		}

		const parts = value.split('~');
		const [classCode, levelPart] = parts;
		const idsPart = parts.length >= 4 ? parts[3] ?? '' : parts[2] ?? '';
		const startClass = startClassFromCodeMap[classCode];
		const currentLevelParsed = Number.parseInt(levelPart ?? '', 36);

		if (!startClass || Number.isNaN(currentLevelParsed)) {
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
			selectedIds: [anchorIdForClass, ...new Set(selectedIdsFromUrl)]
		};
	}

	function getNodeSearchText(node: PlannerNode): string {
		const searchParts = [node.displayName, node.displayTooltip, node.internalIdentifier];

		if (node.isChoiceNode) {
			for (const child of getChoiceChildren(node.referenceId)) {
				searchParts.push(child.displayName, child.displayTooltip, child.internalIdentifier);
			}
		}

		return searchParts.join(' ').toLocaleLowerCase();
	}

	function clampZoom(value: number): number {
		return Math.min(1.8, Math.max(0.25, Math.round(value * 100) / 100));
	}

	function devEdgeKey(a: number, b: number): string {
		return `${Math.min(a, b)}:${Math.max(a, b)}`;
	}

	function getDevViewportCenter(): { x: number; y: number } {
		if (!treeScrollElement) return { x: 0, y: 0 };
		const cx = (treeScrollElement.scrollLeft + treeScrollElement.clientWidth / 2) / zoomLevel;
		const cy = (treeScrollElement.scrollTop + treeScrollElement.clientHeight / 2) / zoomLevel;
		return { x: Math.round(cx - plannerOffsetX), y: Math.round(cy - plannerOffsetY) };
	}

	function snapDevCoordinate(value: number, event: MouseEvent): number {
		if (event.ctrlKey) {
			return Math.round(value);
		}

		return Math.round(value / devSnapGridSize) * devSnapGridSize;
	}

	function beginNodeDrag(event: MouseEvent, referenceId: number) {
		if (!isDevMode || event.button !== 0 || devConnectSourceId !== null) return;
		event.stopPropagation();
		draggingNodeId = referenceId;
		draggingStartMouseX = event.clientX;
		draggingStartMouseY = event.clientY;
		const sourceNode = devEffectiveNodeMap.get(referenceId);
		const nodeIdsToDrag = sourceNode?.isChoiceNode
			? [referenceId, ...getChoiceChildren(referenceId).map((node) => node.referenceId)]
			: [referenceId];
		draggingStartPositions = Object.fromEntries(
			nodeIdsToDrag
				.map((nodeId) => {
					const node = devEffectiveNodeMap.get(nodeId);
					return node ? [nodeId, { x: node.canvasX, y: node.canvasY }] : null;
				})
				.filter((entry): entry is [number, { x: number; y: number }] => entry !== null)
		);
	}

	function handleDevNodeDragMove(event: MouseEvent) {
		if (draggingNodeId === null) return;
		const dx = (event.clientX - draggingStartMouseX) / zoomLevel;
		const dy = (event.clientY - draggingStartMouseY) / zoomLevel;
		const nextPositions = { ...devPositionOverrides };
		const movedPositions = new Map<number, { x: number; y: number }>();

		for (const [idText, startPos] of Object.entries(draggingStartPositions)) {
			const nodeId = Number(idText);
			const newCanvasX = startPos.x + dx;
			const newCanvasY = startPos.y + dy;
			const gameX = snapDevCoordinate(newCanvasX - plannerOffsetX, event);
			const gameY = snapDevCoordinate(newCanvasY - plannerOffsetY, event);
			nextPositions[nodeId] = { x: gameX, y: gameY };
			movedPositions.set(nodeId, { x: gameX, y: gameY });
		}

		devPositionOverrides = nextPositions;
		if (movedPositions.size > 0) {
			devAddedNodes = devAddedNodes.map((node) => {
				const moved = movedPositions.get(node.referenceId);
				return moved ? { ...node, position: moved } : node;
			});
		}
	}

	function endNodeDrag() {
		draggingNodeId = null;
		draggingStartPositions = {};
	}

	function getDevEditableValue(nodeId: number): number {
		return devEffectiveNodeMap.get(nodeId)?.value ?? plannerNodeMap.get(nodeId)?.value ?? 0;
	}

	function getDevEditableRequirement(nodeId: number): number {
		return devEffectiveNodeMap.get(nodeId)?.requiredAllocatedEdges ?? plannerNodeMap.get(nodeId)?.requiredAllocatedEdges ?? 1;
	}

	function updateDevNodeValue(referenceId: number, nextValue: number) {
		const normalized = Number.isFinite(nextValue) ? Math.round(nextValue) : 0;
		const baseValue = plannerNodeMap.get(referenceId)?.value ?? 0;
		if (normalized === baseValue) {
			const next = { ...devValueOverrides };
			delete next[referenceId];
			devValueOverrides = next;
			return;
		}
		devValueOverrides = { ...devValueOverrides, [referenceId]: normalized };
	}

	function updateDevNodeRequirement(referenceId: number, nextRequirement: number) {
		const normalized = Math.max(0, Number.isFinite(nextRequirement) ? Math.round(nextRequirement) : 0);
		const baseRequirement = plannerNodeMap.get(referenceId)?.requiredAllocatedEdges ?? 1;
		if (normalized === baseRequirement) {
			const next = { ...devRequirementOverrides };
			delete next[referenceId];
			devRequirementOverrides = next;
			return;
		}
		devRequirementOverrides = { ...devRequirementOverrides, [referenceId]: normalized };
	}

	function devRemoveNode(referenceId: number) {
		devRemovedNodeIds = new Set([...devRemovedNodeIds, referenceId]);
		devAddedNodes = devAddedNodes.filter((n) => n.referenceId !== referenceId);
		// Remove any override
		const nextPositionOverrides = { ...devPositionOverrides };
		delete nextPositionOverrides[referenceId];
		devPositionOverrides = nextPositionOverrides;
		const nextValueOverrides = { ...devValueOverrides };
		delete nextValueOverrides[referenceId];
		devValueOverrides = nextValueOverrides;
		const nextRequirementOverrides = { ...devRequirementOverrides };
		delete nextRequirementOverrides[referenceId];
		devRequirementOverrides = nextRequirementOverrides;
		// Remove edges involving this node
		devAddedEdges = new Set([...devAddedEdges].filter((k) => !k.split(':').includes(String(referenceId))));
	}

	function devAddNode() {
		if (!devAddIdentifier) return;
		const newId =
			Math.max(
				...plannerRawNodes.map((n) => n.referenceId),
				...devAddedNodes.map((n) => n.referenceId),
				...devRemovedNodeIds,
				0
			) + 1;
		const center = getDevViewportCenter();
		devAddedNodes = [...devAddedNodes, { referenceId: newId, internalIdentifier: devAddIdentifier, position: center }];
		focusedNodeId = newId;
	}

	function devToggleConnect(nodeId: number) {
		if (devConnectSourceId === null) {
			devConnectSourceId = nodeId;
			return;
		}
		if (devConnectSourceId === nodeId) {
			devConnectSourceId = null;
			return;
		}
		const key = devEdgeKey(devConnectSourceId, nodeId);
		const existsInOriginal = plannerEdges.some((e) => e.key === key);
		const addedByDev = devAddedEdges.has(key);
		const removedByDev = devRemovedEdges.has(key);

		if (addedByDev) {
			devAddedEdges = new Set([...devAddedEdges].filter((k) => k !== key));
		} else if (existsInOriginal && !removedByDev) {
			devRemovedEdges = new Set([...devRemovedEdges, key]);
		} else if (existsInOriginal && removedByDev) {
			devRemovedEdges = new Set([...devRemovedEdges].filter((k) => k !== key));
		} else {
			devAddedEdges = new Set([...devAddedEdges, key]);
		}
		devConnectSourceId = null;
	}

	function devRemoveEdge(fromId: number, toId: number) {
		const key = devEdgeKey(fromId, toId);
		if (devAddedEdges.has(key)) {
			devAddedEdges = new Set([...devAddedEdges].filter((k) => k !== key));
		} else {
			devRemovedEdges = new Set([...devRemovedEdges, key]);
		}
	}

	function devResetChanges() {
		devPositionOverrides = {};
		devValueOverrides = {};
		devRequirementOverrides = {};
		devAddedNodes = [];
		devRemovedNodeIds = new Set();
		devAddedEdges = new Set();
		devRemovedEdges = new Set();
		devConnectSourceId = null;
	}

	async function exportPassivesJson() {
		await tick();

		const rawNodes = [...plannerRawNodes];
		const addedNodes = [...devAddedNodes];
		const removedNodeIds = new Set(devRemovedNodeIds);
		const positionOverrides = { ...devPositionOverrides };
		const valueOverrides = { ...devValueOverrides };
		const requirementOverrides = { ...devRequirementOverrides };
		const addedEdges = new Set(devAddedEdges);
		const removedEdges = new Set(devRemovedEdges);
		const rawNodeMap = new Map(rawNodes.map((n) => [n.referenceId, n]));
		// Build per-node connection lists from the active edges
		const connMap = new Map<number, Array<{ referenceId: number; effectsOnly?: boolean; isHidden?: boolean }>>();
		const allNodeIds = new Set([
			...rawNodes.map((n) => n.referenceId),
			...addedNodes.map((n) => n.referenceId)
		]);
		for (const id of allNodeIds) {
			if (!removedNodeIds.has(id)) connMap.set(id, []);
		}

		// Seed from original raw connections, excluding removed nodes/edges
		for (const rawNode of rawNodes) {
			if (removedNodeIds.has(rawNode.referenceId)) continue;
			for (const conn of rawNode.connections ?? []) {
				if (removedNodeIds.has(conn.referenceId)) continue;
				const key = devEdgeKey(rawNode.referenceId, conn.referenceId);
				if (removedEdges.has(key)) continue;
				connMap.get(rawNode.referenceId)?.push({ ...conn });
			}
		}

		// Apply added edges (bidirectional in JSON)
		for (const key of addedEdges) {
			const [a, b] = key.split(':').map(Number);
			if (!removedNodeIds.has(a) && !removedNodeIds.has(b)) {
				if (!connMap.get(a)?.some((c) => c.referenceId === b)) {
					connMap.get(a)?.push({ referenceId: b });
				}
				if (!connMap.get(b)?.some((c) => c.referenceId === a)) {
					connMap.get(b)?.push({ referenceId: a });
				}
			}
		}

		const output: PassiveNodeData[] = [];

		for (const id of allNodeIds) {
			if (removedNodeIds.has(id)) continue;
			const pos = positionOverrides[id];
			const rawNode = rawNodeMap.get(id);

			if (rawNode) {
				output.push({
					...rawNode,
					value: valueOverrides[id] ?? rawNode.value,
					position: pos ?? rawNode.position,
					connections: connMap.get(id) ?? rawNode.connections,
					requiredAllocatedEdges: requirementOverrides[id] ?? rawNode.requiredAllocatedEdges
				});
			} else {
				const added = addedNodes.find((n) => n.referenceId === id);
				if (!added) continue;
				const exportNode: PassiveNodeData = {
					internalIdentifier: added.internalIdentifier,
					referenceId: added.referenceId,
					maxLevel: 1,
					value: valueOverrides[id] ?? 0,
					position: pos ?? added.position,
					connections: connMap.get(id) ?? [],
					requiredAllocatedEdges: requirementOverrides[id]
				};
				output.push(exportNode);
			}
		}

		output.sort((left, right) => left.referenceId - right.referenceId);

		const blob = new Blob([JSON.stringify(output, null, '\t')], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'passives.json';
		a.click();
		URL.revokeObjectURL(url);
	}

	function encodeDevState(): string {
		const moves = Object.entries(devPositionOverrides)
			.map(([id, pos]) => `${Number(id).toString(36)}:${signedBase36(pos.x)}:${signedBase36(pos.y)}`)
			.join('.');
		const values = Object.entries(devValueOverrides)
			.map(([id, value]) => `${Number(id).toString(36)}:${signedBase36(value)}`)
			.join('.');
		const requirements = Object.entries(devRequirementOverrides)
			.map(([id, requirement]) => `${Number(id).toString(36)}:${signedBase36(requirement)}`)
			.join('.');
		const removes = [...devRemovedNodeIds].map((id) => id.toString(36)).join('.');
		const adds = devAddedNodes
			.map((n) => `${n.referenceId.toString(36)}:${n.internalIdentifier}:${signedBase36(n.position.x)}:${signedBase36(n.position.y)}`)
			.join('.');
		const edgeAdds = [...devAddedEdges]
			.map((k) => k.split(':').map(Number).map((n) => n.toString(36)).join(':'))
			.join('.');
		const edgeRemoves = [...devRemovedEdges]
			.map((k) => k.split(':').map(Number).map((n) => n.toString(36)).join(':'))
			.join('.');
		return [moves || '-', values || '-', requirements || '-', removes || '-', adds || '-', edgeAdds || '-', edgeRemoves || '-'].join('~');
	}

	function decodeDevState(value: string | null): boolean {
		if (!value) return false;
		try {
			const parts = value.split('~');
			const [movesPart, valuesPart, requirementsPart, removesPart, addsPart, edgeAddsPart, edgeRemovesPart] =
				parts.length >= 7
					? parts
					: [parts[0], '-', '-', parts[1], parts[2], parts[3], parts[4]];

			const positions: Record<number, { x: number; y: number }> = {};
			if (movesPart && movesPart !== '-') {
				for (const entry of movesPart.split('.')) {
					const [idPart, xPart, yPart] = entry.split(':');
					const id = parseInt(idPart, 36);
					const x = parseSignedBase36(xPart);
					const y = parseSignedBase36(yPart);
					if (!isNaN(id) && !isNaN(x) && !isNaN(y)) positions[id] = { x, y };
				}
			}

			const values: Record<number, number> = {};
			if (valuesPart && valuesPart !== '-') {
				for (const entry of valuesPart.split('.')) {
					const [idPart, valuePart] = entry.split(':');
					const id = parseInt(idPart, 36);
					const nodeValue = parseSignedBase36(valuePart);
					if (!isNaN(id) && !isNaN(nodeValue)) values[id] = nodeValue;
				}
			}

			const requirements: Record<number, number> = {};
			if (requirementsPart && requirementsPart !== '-') {
				for (const entry of requirementsPart.split('.')) {
					const [idPart, requirementPart] = entry.split(':');
					const id = parseInt(idPart, 36);
					const requirement = parseSignedBase36(requirementPart);
					if (!isNaN(id) && !isNaN(requirement)) requirements[id] = requirement;
				}
			}

			const removed = new Set<number>();
			if (removesPart && removesPart !== '-') {
				for (const part of removesPart.split('.')) {
					const id = parseInt(part, 36);
					if (!isNaN(id)) removed.add(id);
				}
			}

			const added: typeof devAddedNodes = [];
			if (addsPart && addsPart !== '-') {
				for (const entry of addsPart.split('.')) {
					const [idPart, identifier, xPart, yPart] = entry.split(':');
					const id = parseInt(idPart, 36);
					const x = parseSignedBase36(xPart);
					const y = parseSignedBase36(yPart);
					if (!isNaN(id) && identifier && !isNaN(x) && !isNaN(y)) {
						added.push({ referenceId: id, internalIdentifier: identifier, position: { x, y } });
					}
				}
			}

			const addedEdges = new Set<string>();
			if (edgeAddsPart && edgeAddsPart !== '-') {
				for (const entry of edgeAddsPart.split('.')) {
					const [aPart, bPart] = entry.split(':');
					const a = parseInt(aPart, 36);
					const b = parseInt(bPart, 36);
					if (!isNaN(a) && !isNaN(b)) addedEdges.add(devEdgeKey(a, b));
				}
			}

			const removedEdges = new Set<string>();
			if (edgeRemovesPart && edgeRemovesPart !== '-') {
				for (const entry of edgeRemovesPart.split('.')) {
					const [aPart, bPart] = entry.split(':');
					const a = parseInt(aPart, 36);
					const b = parseInt(bPart, 36);
					if (!isNaN(a) && !isNaN(b)) removedEdges.add(devEdgeKey(a, b));
				}
			}

			devPositionOverrides = positions;
			devValueOverrides = values;
			devRequirementOverrides = requirements;
			devRemovedNodeIds = removed;
			devAddedNodes = added;
			devAddedEdges = addedEdges;
			devRemovedEdges = removedEdges;
			return true;
		} catch {
			return false;
		}
	}

	function signedBase36(n: number): string {
		return (n < 0 ? '-' : '') + Math.abs(n).toString(36);
	}

	function parseSignedBase36(s: string): number {
		if (!s) return NaN;
		const negative = s.startsWith('-');
		const val = parseInt(negative ? s.slice(1) : s, 36);
		return negative ? -val : val;
	}

	async function copyDevShareLink() {
		try {
			const url = new URL(window.location.href);
			url.searchParams.set(devShareParamKey, encodeDevState());
			await navigator.clipboard.writeText(url.toString());
			toast.push('Dev layout link copied', { type: 'success', duration: 2500 });
		} catch {
			toast.push('Failed to copy dev link', { type: 'error', duration: 3000 });
		}
	}

	function updateDevShareUrl() {
		const url = new URL(window.location.href);
		if (isDevMode) {
			url.searchParams.set(devShareParamKey, encodeDevState());
			window.history.replaceState({}, '', url);
		}
	}
</script>

<div class="planner-shell" role="presentation" onmousemove={moveTooltipDrag} onmouseup={endTooltipDrag}>
	{#if !isDevMode}
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
		</div>

		<div class="control-group search-group">
			<label class="search-label">
				<span>Search passives</span>
				<input type="text" bind:value={passiveSearch} placeholder="Damage, bleed, mana..." />
			</label>
			<div class="search-status">
				<strong>{normalizedPassiveSearch ? passiveSearchMatchCount : visibleNodes.length}</strong>
				<span>{normalizedPassiveSearch ? 'matches' : 'nodes'}</span>
			</div>
			{#if passiveSearch}
				<button type="button" class="mini-button" onclick={() => (passiveSearch = '')}>Clear</button>
			{/if}
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
	{/if}

	<div class="planner-stage" class:full-height={isDevMode}>
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
							{#each activeEdges as edge (edge.key)}
								{#if activeNodeMap.has(edge.from) && activeNodeMap.has(edge.to) && (isDevMode || (!activeNodeMap.get(edge.to)?.isHidden && !activeNodeMap.get(edge.from)?.isHidden))}
									<line
										x1={activeNodeMap.get(edge.from)?.canvasX}
										y1={activeNodeMap.get(edge.from)?.canvasY}
										x2={activeNodeMap.get(edge.to)?.canvasX}
										y2={activeNodeMap.get(edge.to)?.canvasY}
										class:active-edge={!isDevMode && edgeIsActive(edge.from, edge.to)}
										class:effects-edge={edge.effectsOnly}
										class:dev-added-edge={isDevMode && devAddedEdges.has(edge.key)}
									/>
								{/if}
							{/each}
						</svg>

						{#each activeVisibleNodes as node (node.referenceId)}
							{@const renderedNode = isDevMode ? node : getRenderedNode(node)}
							{@const nodeRadius = getNodeRadius(node)}
							{@const isDevAdded = devAddedNodes.some((n) => n.referenceId === node.referenceId)}
							{@const isDevConnectSource = devConnectSourceId === node.referenceId}
							{@const searchClass = !isDevMode && normalizedPassiveSearch ? (matchingNodeIds.has(node.referenceId) ? 'search-match' : 'search-dim') : ''}
							<button
								type="button"
								class={`tree-node ${node.group} ${isDevMode ? 'dev-node' : getNodeState(node)} ${isChoiceHub(node) ? 'choice-hub' : ''} ${isDevAdded ? 'dev-added' : ''} ${isDevConnectSource ? 'dev-connect-source' : ''} ${draggingNodeId === node.referenceId ? 'dev-dragging' : ''} ${searchClass}`}
								style={`left:${node.canvasX}px;top:${node.canvasY}px;width:${nodeRadius * 2}px;height:${nodeRadius * 2}px;margin-left:-${nodeRadius}px;margin-top:-${nodeRadius}px;`}
								aria-label={renderedNode.displayName}
								onclick={() => toggleNode(node)}
								onmousedown={isDevMode ? (e) => beginNodeDrag(e, node.referenceId) : undefined}
								oncontextmenu={(event) => {
									event.preventDefault();
									if (isDevMode) {
										devRemoveNode(node.referenceId);
									} else {
										deallocateNode(node);
									}
								}}
								onmouseenter={(event) => {
									if (!isDevMode) focusedNodeId = node.referenceId;
									setHover(node.referenceId, event);
								}}
								onmouseleave={() => {
									if (!isHoveringTooltip && pinnedTooltipNodeId === null) {
										setHover(null);
									}
								}}
								onmousemove={moveHover}
							>
								<img src={renderedNode.assetPath} alt={renderedNode.displayName} draggable="false" />
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
					{#if isDevMode}
						<div class="drawer-tabs">
							<button type="button" class={`drawer-tab-btn ${devActiveTab === 'node' ? 'active' : ''}`} onclick={() => (devActiveTab = 'node')}>Node</button>
							<button type="button" class={`drawer-tab-btn ${devActiveTab === 'dev' ? 'active' : ''}`} onclick={() => (devActiveTab = 'dev')}>Dev</button>
						</div>
					{/if}

					{#if isDevMode && devActiveTab === 'dev'}
						{@const devFocused = devEffectiveNodeMap.get(focusedNodeId)}
						{@const devFocusedPos = devFocused ? (devPositionOverrides[devFocused.referenceId] ?? devFocused.position) : null}
						{@const devFocusedConnections = devFocused ? activeEdges.filter((e) => e.from === devFocused.referenceId || e.to === devFocused.referenceId) : []}
						<section class="card">
							<p class="eyebrow">Focused node</p>
							{#if devFocused}
								<h2>{devFocused.displayName}</h2>
								<dl class="detail-grid">
									<div><dt>Ref ID</dt><dd>{devFocused.referenceId}</dd></div>
									<div><dt>Group</dt><dd>{devFocused.group}</dd></div>
									<div><dt>Game X</dt><dd>{devFocusedPos?.x ?? '—'}</dd></div>
									<div><dt>Game Y</dt><dd>{devFocusedPos?.y ?? '—'}</dd></div>
								</dl>
								<div class="dev-edit-grid">
									<label class="dev-label">
										<span>Value</span>
										<input
											type="number"
											value={getDevEditableValue(devFocused.referenceId)}
											oninput={(event) =>
												updateDevNodeValue(
													devFocused.referenceId,
													(event.currentTarget as HTMLInputElement).valueAsNumber
												)}
										/>
									</label>
									<label class="dev-label">
										<span>Connections required</span>
										<input
											type="number"
											min="0"
											value={getDevEditableRequirement(devFocused.referenceId)}
											oninput={(event) =>
												updateDevNodeRequirement(
													devFocused.referenceId,
													(event.currentTarget as HTMLInputElement).valueAsNumber
												)}
										/>
									</label>
								</div>
								<div class="dev-actions-row">
									<button type="button" class="dev-danger-btn" onclick={() => { devRemoveNode(devFocused.referenceId); }}>
										Remove node
									</button>
								</div>
							{:else}
								<p class="muted">No node focused.</p>
							{/if}
						</section>

						<section class="card">
							<p class="eyebrow">Connections</p>
							<h2>Connect mode</h2>
							<button
								type="button"
								class={`action-button secondary full-width ${devConnectSourceId !== null ? 'connect-active' : ''}`}
								onclick={() => { devConnectSourceId = devConnectSourceId !== null ? null : (devFocused?.referenceId ?? null); }}
							>
								{devConnectSourceId !== null ? `Source: #${devConnectSourceId} — click target` : 'Start connecting'}
							</button>
							{#if devFocused && devFocusedConnections.length > 0}
								<ul class="conn-list">
									{#each devFocusedConnections as edge}
										{@const neighborId = edge.from === devFocused.referenceId ? edge.to : edge.from}
										{@const neighbor = devEffectiveNodeMap.get(neighborId)}
										{@const isDevAdded = devAddedEdges.has(edge.key)}
										<li>
											<span class:dev-added-label={isDevAdded}>{neighbor?.displayName ?? `#${neighborId}`}</span>
											<button type="button" class="mini-button" onclick={() => devRemoveEdge(devFocused.referenceId, neighborId)}>
												Remove
											</button>
										</li>
									{/each}
								</ul>
							{/if}
						</section>

						<section class="card">
							<p class="eyebrow">Add node</p>
							<h2>Place new node</h2>
							<label class="dev-label">
								<span>Search</span>
								<input
									bind:value={devAddSearch}
									class="dev-select"
									type="search"
									placeholder="Search by passive name or identifier"
								/>
							</label>
							<label class="dev-label">
								<span>Identifier</span>
								<select bind:value={devAddIdentifier} class="dev-select">
									{#each filteredDevAddOptions as option}
										<option value={option.identifier}>{option.displayName}</option>
									{/each}
								</select>
							</label>
							<p class="muted dev-select-summary">
								{filteredDevAddOptions.length} passive{filteredDevAddOptions.length === 1 ? '' : 's'} shown
							</p>
							<button type="button" class="action-button secondary full-width" onclick={devAddNode}>
								Add at viewport center
							</button>
						</section>

						<section class="card">
							<p class="eyebrow">Export</p>
							<h2>Save &amp; export</h2>
							<div class="dev-export-buttons">
								<button type="button" class="action-button full-width" onclick={exportPassivesJson}>
									Download passives.json
								</button>
								<button type="button" class="action-button secondary full-width" onclick={copyDevShareLink}>
									Copy dev link
								</button>
								<button type="button" class="action-button secondary full-width" onclick={devResetChanges}>
									Reset all changes
								</button>
							</div>
						</section>
					{/if}

					{#if !isDevMode || devActiveTab === 'node'}
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
					{/if}
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
		grid-template-columns: auto minmax(280px, 1fr) auto auto;
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

	.search-group {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto auto;
	}

	.search-label {
		min-width: 0;
	}

	.search-label input {
		min-width: 0;
		width: 100%;
	}

	.search-status {
		display: grid;
		align-content: center;
		justify-items: end;
		min-width: 3.5rem;
	}

	.search-status strong {
		font-size: 1.05rem;
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

	.planner-stage.full-height {
		height: 100%;
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
		pointer-events: none;
	}

	.tree-node:hover {
		transform: scale(1.08);
	}

	.tree-node.selected {
		border-color: #fbbf24;
		box-shadow: 0 0 0 5px rgba(251, 191, 36, 0.16);
	}

	.tree-node.search-match {
		border-color: #f8fafc;
		box-shadow:
			0 0 0 4px rgba(248, 250, 252, 0.18),
			0 0 22px rgba(96, 165, 250, 0.28);
	}

	.tree-node.selected.search-match {
		box-shadow:
			0 0 0 5px rgba(251, 191, 36, 0.18),
			0 0 0 8px rgba(248, 250, 252, 0.15),
			0 0 26px rgba(96, 165, 250, 0.24);
	}

	.tree-node.available {
		border-color: rgba(110, 231, 183, 0.45);
		box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.08);
	}

	.tree-node.search-dim {
		opacity: 0.22;
	}

	.tree-node.locked,
	.tree-node.disabled {
		opacity: 0.58;
	}

	.tree-node.disabled {
		cursor: default;
		filter: grayscale(0.35);
	}

	.tree-node.available.search-match {
		box-shadow:
			0 0 0 4px rgba(16, 185, 129, 0.08),
			0 0 0 7px rgba(248, 250, 252, 0.12),
			0 0 22px rgba(96, 165, 250, 0.24);
	}

	.tree-node.locked.search-dim,
	.tree-node.disabled.search-dim {
		opacity: 0.22;
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

	/* Dev mode styles */
	.dev-badge {
		padding: 0.45rem 0.7rem;
		border-radius: 10px;
		background: linear-gradient(135deg, #a855f7, #7c3aed);
		color: #fff;
		font-weight: 700;
		font-size: 0.78rem;
		letter-spacing: 0.1em;
	}

	.tree-node.dev-node {
		cursor: move;
	}

	.tree-node.dev-node:hover {
		border-color: rgba(168, 85, 247, 0.6);
		box-shadow: 0 0 0 4px rgba(168, 85, 247, 0.14);
	}

	.tree-node.dev-added {
		border-color: rgba(52, 211, 153, 0.7);
		box-shadow: 0 0 0 4px rgba(52, 211, 153, 0.14);
	}

	.tree-node.dev-connect-source {
		border-color: #f59e0b;
		box-shadow: 0 0 0 6px rgba(245, 158, 11, 0.28);
		animation: dev-pulse 1s ease-in-out infinite;
	}

	.tree-node.dev-dragging {
		opacity: 0.75;
		transform: scale(1.12);
		z-index: 10;
	}

	@keyframes dev-pulse {
		0%, 100% { box-shadow: 0 0 0 6px rgba(245, 158, 11, 0.28); }
		50% { box-shadow: 0 0 0 10px rgba(245, 158, 11, 0.12); }
	}

	:global(.dev-added-edge) {
		stroke: rgba(168, 85, 247, 0.7);
		stroke-dasharray: 6 4;
	}

	.drawer-tabs {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.4rem;
		margin-bottom: 0.65rem;
	}

	.drawer-tab-btn {
		padding: 0.55rem;
		border: 1px solid rgba(148, 163, 184, 0.24);
		border-radius: 12px;
		background: rgba(30, 41, 59, 0.96);
		color: #94a3b8;
		font-weight: 700;
		font-size: 0.82rem;
		cursor: pointer;
	}

	.drawer-tab-btn.active {
		background: rgba(168, 85, 247, 0.18);
		border-color: rgba(168, 85, 247, 0.5);
		color: #e9d5ff;
	}

	.dev-actions-row {
		margin-top: 0.75rem;
	}

	.dev-edit-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.65rem;
		margin-top: 0.85rem;
	}

	.dev-danger-btn {
		width: 100%;
		padding: 0.6rem;
		border: 1px solid rgba(239, 68, 68, 0.4);
		border-radius: 12px;
		background: rgba(127, 29, 29, 0.5);
		color: #fca5a5;
		font-weight: 700;
		cursor: pointer;
	}

	.dev-danger-btn:hover {
		background: rgba(185, 28, 28, 0.6);
	}

	.full-width {
		width: 100%;
		text-align: center;
		justify-content: center;
	}

	.connect-active {
		border-color: rgba(245, 158, 11, 0.6) !important;
		color: #fbbf24;
	}

	.conn-list {
		margin: 0.75rem 0 0;
		padding: 0;
		list-style: none;
		display: grid;
		gap: 0.4rem;
	}

	.conn-list li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
		padding: 0.45rem 0.6rem;
		border-radius: 10px;
		background: rgba(30, 41, 59, 0.7);
		font-size: 0.85rem;
	}

	.dev-added-label {
		color: #c4b5fd;
	}

	.dev-label {
		display: grid;
		gap: 0.3rem;
		margin-bottom: 0.65rem;
		font-size: 0.82rem;
	}

	.dev-label span {
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-size: 0.7rem;
		color: #94a3b8;
	}

	.dev-select {
		width: 100%;
		padding: 0.55rem 0.7rem;
		border: 1px solid rgba(148, 163, 184, 0.24);
		border-radius: 12px;
		background: rgba(30, 41, 59, 0.96);
		color: #f8fafc;
	}

	.dev-select-summary {
		margin: -0.15rem 0 0.65rem;
		font-size: 0.76rem;
	}

	.dev-export-buttons {
		display: grid;
		gap: 0.5rem;
		margin-top: 0.2rem;
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
