import passivesJson from '$lib/data/passives/passives-dev.json';
import passiveLocalizationRaw from '$lib/data/passives/passives-en-US.hjson?raw';
import { HjsonParserService } from '$lib/services/hjson-parser-service';

export type PlannerStartClass = 'melee' | 'ranged' | 'magic' | 'summon';

export interface PassiveConnection {
	referenceId: number;
	isHidden?: boolean;
	effectsOnly?: boolean;
}

export interface PassivePosition {
	x: number;
	y: number;
}

export interface PassiveNodeData {
	internalIdentifier: string;
	referenceId: number;
	position: PassivePosition;
	maxLevel: number;
	connections?: PassiveConnection[];
	value?: number;
	isHidden?: boolean;
	isChoiceNode?: boolean;
	requiredAllocatedEdges?: number;
}

export interface PlannerNode extends PassiveNodeData {
	displayName: string;
	displayTooltip: string;
	group: 'anchor' | 'attribute' | 'mastery' | 'notable' | 'minor';
	canvasX: number;
	canvasY: number;
	assetPath: string;
	value: number;
}

export interface PlannerEdge {
	key: string;
	from: number;
	to: number;
	hidden: boolean;
	effectsOnly: boolean;
}

export interface PlannerSummaryItem {
	key: string;
	name: string;
	totalValue: number;
	count: number;
	tooltip: string;
}

const rawNodes = passivesJson as PassiveNodeData[];
const parser = new HjsonParserService();
const localization = parser.parseHjsonContent(passiveLocalizationRaw, 'Passives');

const bounds = rawNodes.reduce(
	(acc, node) => {
		acc.minX = Math.min(acc.minX, node.position.x);
		acc.maxX = Math.max(acc.maxX, node.position.x);
		acc.minY = Math.min(acc.minY, node.position.y);
		acc.maxY = Math.max(acc.maxY, node.position.y);
		return acc;
	},
	{ minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
);

const padding = 900;
const offsetX = -bounds.minX + padding;
const offsetY = -bounds.minY + padding;

export const plannerNodes: PlannerNode[] = rawNodes.map((node) => {
	const nameKey = `Mods.PathOfTerraria.Passives.${node.internalIdentifier}.Name`;
	const tooltipKey = `Mods.PathOfTerraria.Passives.${node.internalIdentifier}.Tooltip`;

	return {
		...node,
		value: node.value ?? 0,
		displayName: localization[nameKey] ?? humanizeIdentifier(node.internalIdentifier),
		displayTooltip: localization[tooltipKey] ?? '',
		group: getNodeGroup(node),
		canvasX: node.position.x + offsetX,
		canvasY: node.position.y + offsetY,
		assetPath: getAssetPath(node.internalIdentifier)
	};
});

export const plannerNodeMap = new Map<number, PlannerNode>(plannerNodes.map((node) => [node.referenceId, node]));
export const plannerEdges: PlannerEdge[] = buildEdges(rawNodes);
export const plannerAdjacency = buildAdjacency(plannerEdges);
export const plannerCanvas = {
	width: bounds.maxX - bounds.minX + padding * 2,
	height: bounds.maxY - bounds.minY + padding * 2
};

export const plannerOffsetX = offsetX;
export const plannerOffsetY = offsetY;
export const plannerRawNodes: readonly PassiveNodeData[] = rawNodes;
export const plannerUniqueIdentifiers: readonly string[] = [...new Set(rawNodes.map((n) => n.internalIdentifier))].sort();

export const startClassOptions: Array<{ value: PlannerStartClass; label: string; anchorId: number }> = [
	{ value: 'melee', label: 'Melee', anchorId: 0 },
	{ value: 'ranged', label: 'Ranged', anchorId: -1 },
	{ value: 'magic', label: 'Magic', anchorId: -2 },
	{ value: 'summon', label: 'Summon', anchorId: -3 }
];

const choiceChildrenByHub = buildChoiceChildrenMap(rawNodes);
const choiceParentByChild = buildChoiceParentMap(choiceChildrenByHub);

export function getAnchorId(startClass: PlannerStartClass): number {
	return startClassOptions.find((option) => option.value === startClass)?.anchorId ?? 0;
}

export function isSelectableNode(node: PlannerNode): boolean {
	return !node.isHidden;
}

export function isChoiceHub(node: PlannerNode): boolean {
	return Boolean(node.isChoiceNode);
}

export function getChoiceChildren(nodeId: number): PlannerNode[] {
	return (choiceChildrenByHub.get(nodeId) ?? [])
		.map((childId) => plannerNodeMap.get(childId))
		.filter((node): node is PlannerNode => Boolean(node));
}

export function getActiveChoiceChild(nodeId: number, selectedIds: Set<number>): PlannerNode | null {
	for (const childId of choiceChildrenByHub.get(nodeId) ?? []) {
		if (selectedIds.has(childId)) {
			return plannerNodeMap.get(childId) ?? null;
		}
	}

	return null;
}

export function getDisplayNode(nodeId: number, selectedIds: Set<number>): PlannerNode | undefined {
	const node = plannerNodeMap.get(nodeId);
	if (!node) {
		return undefined;
	}

	if (node.isChoiceNode) {
		return getActiveChoiceChild(nodeId, selectedIds) ?? node;
	}

	return node;
}

export function canAllocateNode(nodeId: number, selectedIds: Set<number>): boolean {
	const node = plannerNodeMap.get(nodeId);

	if (!node || selectedIds.has(nodeId) || !isSelectableNode(node) || node.group === 'anchor') {
		return false;
	}

	return countAllocatedNeighbors(nodeId, selectedIds) >= (node.requiredAllocatedEdges ?? 1);
}

export function canDeallocateNode(nodeId: number, selectedIds: Set<number>, anchorId: number): boolean {
	const node = plannerNodeMap.get(nodeId);

	if (!node || node.group === 'anchor' || !selectedIds.has(nodeId)) {
		return false;
	}

	const nextSelected = new Set(selectedIds);
	nextSelected.delete(nodeId);

	return isValidTreeState(nextSelected, anchorId);
}

export function applyChoiceSelection(nodeId: number, childId: number, selectedIds: Set<number>): Set<number> {
	const nextSelected = new Set(selectedIds);
	const node = plannerNodeMap.get(nodeId);
	const child = plannerNodeMap.get(childId);

	if (!node || !child || !node.isChoiceNode || choiceParentByChild.get(childId) !== nodeId) {
		return nextSelected;
	}

	if (!nextSelected.has(nodeId)) {
		if (!canAllocateNode(nodeId, nextSelected)) {
			return nextSelected;
		}

		nextSelected.add(nodeId);
	}

	for (const existingChildId of choiceChildrenByHub.get(nodeId) ?? []) {
		nextSelected.delete(existingChildId);
	}

	nextSelected.add(childId);
	return nextSelected;
}

export function clearChoiceSelection(nodeId: number, selectedIds: Set<number>): Set<number> {
	const nextSelected = new Set(selectedIds);
	nextSelected.delete(nodeId);

	for (const childId of choiceChildrenByHub.get(nodeId) ?? []) {
		nextSelected.delete(childId);
	}

	return nextSelected;
}

export function summarizeSelection(selectedIds: Set<number>): PlannerSummaryItem[] {
	const summary = new Map<string, PlannerSummaryItem>();

	for (const selectedId of selectedIds) {
		const node = plannerNodeMap.get(selectedId);

		if (!node || node.group === 'anchor' || node.internalIdentifier === 'MasteryPassive') {
			continue;
		}

		const existing = summary.get(node.internalIdentifier);
		if (existing) {
			existing.totalValue += node.value;
			existing.count += 1;
			existing.tooltip = formatTooltip(node.displayTooltip, existing.totalValue);
			continue;
		}

		summary.set(node.internalIdentifier, {
			key: node.internalIdentifier,
			name: node.displayName,
			totalValue: node.value,
			count: 1,
			tooltip: formatTooltip(node.displayTooltip, node.value)
		});
	}

	return [...summary.values()].sort((left, right) => right.totalValue - left.totalValue || left.name.localeCompare(right.name));
}

export function getSpentPoints(selectedIds: Set<number>): number {
	let spent = 0;

	for (const selectedId of selectedIds) {
		const node = plannerNodeMap.get(selectedId);
		if (node && node.group !== 'anchor' && node.internalIdentifier !== 'MasteryPassive') {
			spent += 1;
		}
	}

	return spent;
}

export function getFormattedTooltip(node: Pick<PlannerNode, 'displayTooltip' | 'value'>): string {
	return formatTooltip(node.displayTooltip, node.value);
}

export function getNodeRadius(node: PlannerNode): number {
	switch (node.group) {
		case 'anchor':
			return 30;
		case 'notable':
			return 22;
		case 'mastery':
			return 22;
		case 'attribute':
			return 17;
		default:
			return 15;
	}
}

export function isTreeStateValid(selectedIds: Set<number>, anchorId: number): boolean {
	return isValidTreeState(selectedIds, anchorId);
}

export function getAutoAllocatePath(targetId: number, selectedIds: Set<number>): number[] | null {
	const targetNode = plannerNodeMap.get(targetId);

	if (!targetNode || selectedIds.has(targetId) || !isSelectableNode(targetNode) || targetNode.group === 'anchor') {
		return null;
	}

	const queue: number[] = [];
	const queued = new Set<number>();
	const distances = new Map<number, number>();
	const steps = new Map<number, number>();
	const previous = new Map<number, number | null>();

	for (const selectedId of selectedIds) {
		const node = plannerNodeMap.get(selectedId);
		if (!node || node.isHidden) {
			continue;
		}

		queue.push(selectedId);
		queued.add(selectedId);
		distances.set(selectedId, 0);
		steps.set(selectedId, 0);
		previous.set(selectedId, null);
	}

	while (queue.length > 0) {
		queue.sort((left, right) => {
			const distanceDelta = (distances.get(left) ?? Number.POSITIVE_INFINITY) - (distances.get(right) ?? Number.POSITIVE_INFINITY);
			if (distanceDelta !== 0) {
				return distanceDelta;
			}

			return (steps.get(left) ?? Number.POSITIVE_INFINITY) - (steps.get(right) ?? Number.POSITIVE_INFINITY);
		});

		const currentId = queue.shift();
		if (currentId === undefined) {
			break;
		}

		queued.delete(currentId);

		if (currentId === targetId) {
			break;
		}

		for (const neighborId of plannerAdjacency.get(currentId) ?? []) {
			const neighbor = plannerNodeMap.get(neighborId);
			if (!neighbor || neighbor.isHidden) {
				continue;
			}

			const nextDistance = (distances.get(currentId) ?? Number.POSITIVE_INFINITY) + (selectedIds.has(neighborId) ? 0 : 1);
			const nextSteps = (steps.get(currentId) ?? 0) + 1;
			const currentDistance = distances.get(neighborId) ?? Number.POSITIVE_INFINITY;
			const currentSteps = steps.get(neighborId) ?? Number.POSITIVE_INFINITY;

			if (nextDistance > currentDistance || (nextDistance === currentDistance && nextSteps >= currentSteps)) {
				continue;
			}

			distances.set(neighborId, nextDistance);
			steps.set(neighborId, nextSteps);
			previous.set(neighborId, currentId);

			if (!queued.has(neighborId)) {
				queue.push(neighborId);
				queued.add(neighborId);
			}
		}
	}

	if (!previous.has(targetId)) {
		return null;
	}

	const path: number[] = [];
	let currentId: number | null = targetId;

	while (currentId !== null) {
		path.unshift(currentId);
		currentId = previous.get(currentId) ?? null;
	}

	const nodesToAllocate = path.filter((nodeId) => !selectedIds.has(nodeId));
	if (nodesToAllocate.length === 0) {
		return null;
	}

	const nextSelected = new Set(selectedIds);
	for (const nodeId of nodesToAllocate) {
		if (!canAllocateNode(nodeId, nextSelected)) {
			return null;
		}

		nextSelected.add(nodeId);
	}

	return nodesToAllocate;
}

function buildEdges(nodes: PassiveNodeData[]): PlannerEdge[] {
	const edges = new Map<string, PlannerEdge>();

	for (const node of nodes) {
		for (const connection of node.connections ?? []) {
			const from = node.referenceId;
			const to = connection.referenceId;
			const key = [Math.min(from, to), Math.max(from, to)].join(':');

			if (edges.has(key)) {
				continue;
			}

			edges.set(key, {
				key,
				from,
				to,
				hidden: Boolean(connection.isHidden || plannerNodeMap.get(to)?.isHidden),
				effectsOnly: Boolean(connection.effectsOnly)
			});
		}
	}

	return [...edges.values()];
}

function buildAdjacency(edges: PlannerEdge[]): Map<number, number[]> {
	const adjacency = new Map<number, number[]>();

	for (const edge of edges) {
		if (!adjacency.has(edge.from)) {
			adjacency.set(edge.from, []);
		}

		if (!adjacency.has(edge.to)) {
			adjacency.set(edge.to, []);
		}

		adjacency.get(edge.from)?.push(edge.to);
		adjacency.get(edge.to)?.push(edge.from);
	}

	return adjacency;
}

function buildChoiceChildrenMap(nodes: PassiveNodeData[]): Map<number, number[]> {
	const map = new Map<number, number[]>();

	for (const node of nodes) {
		if (!node.isChoiceNode) {
			continue;
		}

		const childIds = (node.connections ?? [])
			.map((connection) => connection.referenceId)
			.filter((childId) => plannerNodeMap.get(childId)?.isHidden);

		map.set(node.referenceId, childIds);
	}

	return map;
}

function buildChoiceParentMap(choiceChildrenMap: Map<number, number[]>): Map<number, number> {
	const map = new Map<number, number>();

	for (const [hubId, childIds] of choiceChildrenMap.entries()) {
		for (const childId of childIds) {
			map.set(childId, hubId);
		}
	}

	return map;
}

function isValidTreeState(selectedIds: Set<number>, anchorId: number): boolean {
	for (const selectedId of selectedIds) {
		const node = plannerNodeMap.get(selectedId);

		if (!node || node.group === 'anchor' || node.isHidden) {
			continue;
		}

		if (countAllocatedNeighbors(selectedId, selectedIds) < (node.requiredAllocatedEdges ?? 1)) {
			return false;
		}
	}

	for (const [hubId, childIds] of choiceChildrenByHub.entries()) {
		const chosenChildren = childIds.filter((childId) => selectedIds.has(childId));

		if (chosenChildren.length > 1) {
			return false;
		}

		if (chosenChildren.length > 0 && !selectedIds.has(hubId)) {
			return false;
		}
	}

	const connected = getReachableSelectedIds(anchorId, selectedIds);
	for (const selectedId of selectedIds) {
		const node = plannerNodeMap.get(selectedId);
		if (!node || node.isHidden) {
			continue;
		}

		if (!connected.has(selectedId)) {
			return false;
		}
	}

	return true;
}

function getReachableSelectedIds(anchorId: number, selectedIds: Set<number>): Set<number> {
	const visited = new Set<number>();
	const queue = selectedIds.has(anchorId) ? [anchorId] : [];

	while (queue.length > 0) {
		const current = queue.shift();
		if (current === undefined || visited.has(current)) {
			continue;
		}

		visited.add(current);

		for (const neighborId of plannerAdjacency.get(current) ?? []) {
			const neighbor = plannerNodeMap.get(neighborId);
			if (!neighbor || neighbor.isHidden) {
				continue;
			}

			if (selectedIds.has(neighborId) && !visited.has(neighborId)) {
				queue.push(neighborId);
			}
		}
	}

	return visited;
}

function countAllocatedNeighbors(nodeId: number, selectedIds: Set<number>): number {
	const node = plannerNodeMap.get(nodeId);
	let count = 0;

	for (const neighborId of plannerAdjacency.get(nodeId) ?? []) {
		const neighbor = plannerNodeMap.get(neighborId);
		if (!neighbor || !selectedIds.has(neighborId)) {
			continue;
		}

		if (node?.isChoiceNode && neighbor.isHidden) {
			continue;
		}

		count += 1;
	}

	return count;
}

function getNodeGroup(node: PassiveNodeData): PlannerNode['group'] {
	if (node.internalIdentifier === 'AnchorPassive') {
		return 'anchor';
	}

	if (node.internalIdentifier === 'MasteryPassive') {
		return 'mastery';
	}

	if (
		node.internalIdentifier.startsWith('AddedStrength') ||
		node.internalIdentifier.startsWith('AddedDexterity') ||
		node.internalIdentifier.startsWith('AddedIntelligence')
	) {
		return 'attribute';
	}

	if (node.maxLevel > 1 || (node.value ?? 0) >= 10 || node.isChoiceNode) {
		return 'notable';
	}

	return 'minor';
}

function humanizeIdentifier(identifier: string): string {
	return identifier
		.replace(/Passive$/u, '')
		.replace(/([a-z])([A-Z])/gu, '$1 $2')
		.trim();
}

function formatTooltip(tooltip: string, value: number): string {
	if (!tooltip) {
		return '';
	}

	return tooltip.replaceAll('{0}', value.toString());
}

function getAssetPath(identifier: string): string {
	if (
		identifier === 'AddedDexterityStrengthPassive' ||
		identifier === 'AddedIntelligenceStrengthPassive' ||
		identifier === 'AddedIntelligenceDexterityPassive'
	) {
		return '/passives/Placeholder.png';
	}

	return `/passives/${identifier}.png`;
}
