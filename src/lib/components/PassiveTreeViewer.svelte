<script lang="ts">
    import type { ICharacterPassiveTreeSnapshot } from '$lib/services/player-service';
    import {
        getDisplayNode,
        getNodeRadius,
        getSpentPoints,
        plannerCanvas,
        plannerEdges,
        plannerNodeMap,
        plannerNodes,
        summarizeSelection
    } from '$lib/planner/passive-tree';

    let { snapshot }: { snapshot: ICharacterPassiveTreeSnapshot } = $props();

    const selectedIds = $derived(
        new Set(snapshot.allocatedNodes.filter(node => node.level > 0).map(node => node.referenceId))
    );
    const selectedNodeLevels = $derived(
        new Map(snapshot.allocatedNodes.map(node => [node.referenceId, node.level]))
    );
    const selectedNodeCount = $derived(snapshot.allocatedNodes.filter(node => node.level > 0).length);
    const spentPoints = $derived(getSpentPoints(selectedIds));
    const summaryItems = $derived(summarizeSelection(selectedIds));
    const masteryItems = $derived(summaryItems.filter(item => item.group === 'mastery'));
    const travelItems = $derived(summaryItems.filter(item => item.group === 'travel'));
    const otherItems = $derived(summaryItems.filter(item => item.group !== 'mastery' && item.group !== 'travel'));
    const visibleNodes = $derived(plannerNodes.filter(node => !node.isHidden));

    function edgeIsActive(from: number, to: number): boolean {
        return selectedIds.has(from) && selectedIds.has(to);
    }

    function nodeIsSelected(referenceId: number): boolean {
        return selectedIds.has(referenceId);
    }
</script>

<section class="passive-tree-viewer">
    <div class="viewer-header">
        <div>
            <h2>Passive Tree</h2>
            <p>{selectedNodeCount} allocated nodes</p>
        </div>
        <div class="viewer-stats">
            <div>
                <span>Spent</span>
                <strong>{spentPoints}</strong>
            </div>
            <div>
                <span>Remaining</span>
                <strong>{snapshot.points}</strong>
            </div>
            <div>
                <span>Extra</span>
                <strong>{snapshot.extraPoints}</strong>
            </div>
        </div>
    </div>

    <div class="tree-frame">
        <svg
            class="tree-map"
            viewBox={`0 0 ${plannerCanvas.width} ${plannerCanvas.height}`}
            role="img"
            aria-label="Read-only passive tree"
        >
            {#each plannerEdges as edge (edge.key)}
                {#if plannerNodeMap.has(edge.from) && plannerNodeMap.has(edge.to) && !plannerNodeMap.get(edge.from)?.isHidden && !plannerNodeMap.get(edge.to)?.isHidden}
                    <line
                        x1={plannerNodeMap.get(edge.from)?.canvasX}
                        y1={plannerNodeMap.get(edge.from)?.canvasY}
                        x2={plannerNodeMap.get(edge.to)?.canvasX}
                        y2={plannerNodeMap.get(edge.to)?.canvasY}
                        class:active-edge={edgeIsActive(edge.from, edge.to)}
                    />
                {/if}
            {/each}

            {#each visibleNodes as node (node.referenceId)}
                {@const renderedNode = getDisplayNode(node.referenceId, selectedIds) ?? node}
                {@const radius = getNodeRadius(node)}
                {@const selected = nodeIsSelected(node.referenceId)}
                <g
                    class:selected-node={selected}
                    class:inactive-node={!selected}
                    transform={`translate(${node.canvasX}, ${node.canvasY})`}
                >
                    <circle r={radius + 4} />
                    <image
                        href={renderedNode.assetPath}
                        x={-radius}
                        y={-radius}
                        width={radius * 2}
                        height={radius * 2}
                        preserveAspectRatio="xMidYMid meet"
                    >
                        <title>
                            {renderedNode.displayName}{selectedNodeLevels.get(node.referenceId) ? ` (${selectedNodeLevels.get(node.referenceId)})` : ''}
                        </title>
                    </image>
                </g>
            {/each}
        </svg>
    </div>

    {#if masteryItems.length > 0}
        <div class="summary-section">
            <h3 class="summary-heading">Masteries <span class="summary-count">({masteryItems.length})</span></h3>
            <div class="summary-grid">
                {#each masteryItems as item}
                    <div class="summary-item">
                        <strong>{item.name}</strong>
                        <span>{item.tooltip || `${item.totalValue}`}</span>
                    </div>
                {/each}
            </div>
        </div>
    {/if}

    {#if otherItems.length > 0}
        <details class="summary-collapsible">
            <summary>Other passives <span class="summary-count">({otherItems.length})</span></summary>
            <div class="summary-grid">
                {#each otherItems as item}
                    <div class="summary-item">
                        <strong>{item.name}</strong>
                        <span>{item.tooltip || `${item.totalValue}`}</span>
                    </div>
                {/each}
            </div>
        </details>
    {/if}

    {#if travelItems.length > 0}
        <details class="summary-collapsible">
            <summary>Travel nodes <span class="summary-count">({travelItems.length})</span></summary>
            <div class="summary-grid">
                {#each travelItems as item}
                    <div class="summary-item">
                        <strong>{item.name}</strong>
                        <span>{item.tooltip || `${item.totalValue}`}</span>
                    </div>
                {/each}
            </div>
        </details>
    {/if}
</section>

<style>
    .passive-tree-viewer {
        margin-top: 1.5rem;
        border-radius: 1rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.035);
        padding: 1rem;
    }

    .viewer-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .viewer-header h2 {
        color: #f8fafc;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.22em;
        margin: 0;
        text-transform: uppercase;
    }

    .viewer-header p {
        color: #6b7280;
        font-size: 0.75rem;
        margin: 0.25rem 0 0;
    }

    .viewer-stats {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 0.5rem;
    }

    .viewer-stats div {
        min-width: 4.5rem;
        border-radius: 0.5rem;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(0, 0, 0, 0.2);
        padding: 0.45rem 0.6rem;
        text-align: center;
    }

    .viewer-stats span {
        display: block;
        color: #6b7280;
        font-size: 0.62rem;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
    }

    .viewer-stats strong {
        color: #ecfdf5;
        font-size: 1rem;
    }

    .tree-frame {
        height: min(68vh, 640px);
        min-height: 360px;
        overflow: hidden;
        border-radius: 0.75rem;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: radial-gradient(circle at center, rgba(34, 197, 94, 0.08), transparent 42%), #071017;
    }

    .tree-map {
        display: block;
        width: 100%;
        height: 100%;
    }

    .tree-map line {
        stroke: rgba(148, 163, 184, 0.16);
        stroke-width: 3;
    }

    .tree-map line.active-edge {
        stroke: rgba(74, 222, 128, 0.82);
        stroke-width: 6;
    }

    .tree-map circle {
        fill: rgba(15, 23, 42, 0.86);
        stroke: rgba(148, 163, 184, 0.18);
        stroke-width: 3;
    }

    .tree-map .selected-node circle {
        fill: rgba(20, 83, 45, 0.85);
        stroke: rgba(134, 239, 172, 0.95);
        stroke-width: 5;
    }

    .tree-map .inactive-node {
        opacity: 0.26;
    }

    .tree-map .selected-node {
        opacity: 1;
    }

    .summary-section {
        margin-top: 1rem;
    }

    .summary-heading {
        color: #f8fafc;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.18em;
        margin: 0 0 0.5rem;
        text-transform: uppercase;
    }

    .summary-count {
        color: #94a3b8;
        font-weight: 500;
        letter-spacing: normal;
    }

    .summary-collapsible {
        margin-top: 0.75rem;
        border-radius: 0.65rem;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.025);
    }

    .summary-collapsible > summary {
        cursor: pointer;
        list-style: none;
        padding: 0.6rem 0.75rem;
        color: #f8fafc;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        user-select: none;
    }

    .summary-collapsible > summary::-webkit-details-marker {
        display: none;
    }

    .summary-collapsible > summary::before {
        content: '▸';
        display: inline-block;
        margin-right: 0.5rem;
        color: #94a3b8;
        font-size: 0.7rem;
        transition: transform 0.15s ease;
    }

    .summary-collapsible[open] > summary::before {
        transform: rotate(90deg);
    }

    .summary-collapsible > .summary-grid {
        margin-top: 0;
        padding: 0 0.75rem 0.75rem;
    }

    .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
        gap: 0.65rem;
        margin-top: 0.5rem;
    }

    .summary-item {
        border-radius: 0.65rem;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.04);
        padding: 0.7rem;
    }

    .summary-item strong {
        display: block;
        color: #f8fafc;
        font-size: 0.8rem;
        margin-bottom: 0.25rem;
    }

    .summary-item span {
        color: #cbd5e1;
        font-size: 0.75rem;
        line-height: 1.35;
    }

    @media (max-width: 640px) {
        .viewer-header {
            display: block;
        }

        .viewer-stats {
            justify-content: stretch;
            margin-top: 0.75rem;
        }

        .viewer-stats div {
            flex: 1;
        }
    }
</style>
