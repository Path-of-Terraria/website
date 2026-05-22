<script lang="ts">
    import type { ICharacterSkillsSnapshot, IEquippedSkillSnapshot } from '$lib/services/player-service';

    let { snapshot }: { snapshot: ICharacterSkillsSnapshot } = $props();

    const orderedSkills = $derived(
        [...snapshot.skills].sort((a, b) => a.slotIndex - b.slotIndex)
    );

    let selectedSlot: number | null = $state(null);

    const selectedSkill = $derived(
        orderedSkills.find(skill => skill.slotIndex === selectedSlot) ?? orderedSkills[0]
    );

    const PADDING = 60;
    const MIN_VIEWPORT = 400;

    function viewBox(skill: IEquippedSkillSnapshot): string {
        const visible = skill.nodes.filter(n => !n.isHidden);
        if (visible.length === 0) {
            return `-${MIN_VIEWPORT / 2} -${MIN_VIEWPORT / 2} ${MIN_VIEWPORT} ${MIN_VIEWPORT}`;
        }
        const xs = visible.map(n => n.posX);
        const ys = visible.map(n => n.posY);
        const minX = Math.min(...xs) - PADDING;
        const maxX = Math.max(...xs) + PADDING;
        const minY = Math.min(...ys) - PADDING;
        const maxY = Math.max(...ys) + PADDING;
        const width = Math.max(maxX - minX, MIN_VIEWPORT);
        const height = Math.max(maxY - minY, MIN_VIEWPORT);
        return `${minX} ${minY} ${width} ${height}`;
    }

    function nodeRadius(node: { isAnchor: boolean; isSpecialization: boolean }): number {
        if (node.isAnchor) return 18;
        if (node.isSpecialization) return 22;
        return 14;
    }

    function slotLabel(slotIndex: number): string {
        return `Skill ${slotIndex + 1}`;
    }

    function isAllocated(level: number, isAnchor: boolean): boolean {
        return level > 0 && !isAnchor;
    }

    function edgeIsActive(
        skill: IEquippedSkillSnapshot,
        from: string,
        to: string
    ): boolean {
        const fromNode = skill.nodes.find(n => n.internalIdentifier === from);
        const toNode = skill.nodes.find(n => n.internalIdentifier === to);
        return !!fromNode && !!toNode && fromNode.level > 0 && toNode.level > 0;
    }

    function nodeMap(skill: IEquippedSkillSnapshot) {
        return new Map(skill.nodes.map(node => [node.internalIdentifier, node]));
    }

    const allocatedNodes = $derived(
        selectedSkill
            ? selectedSkill.nodes
                  .filter(node => isAllocated(node.level, node.isAnchor))
                  .sort((a, b) => {
                      if (a.isSpecialization !== b.isSpecialization) return a.isSpecialization ? -1 : 1;
                      return a.displayName.localeCompare(b.displayName);
                  })
            : []
    );
</script>

<section class="skill-tree-viewer">
    <div class="viewer-header">
        <div>
            <h2>Skills</h2>
            <p>{orderedSkills.length} equipped</p>
        </div>
        <div class="skill-tabs" role="tablist">
            {#each orderedSkills as skill}
                {@const isActive = selectedSkill?.slotIndex === skill.slotIndex}
                <button
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    class="skill-tab"
                    class:active={isActive}
                    onclick={() => (selectedSlot = skill.slotIndex)}
                >
                    <span class="slot-tag">{slotLabel(skill.slotIndex)}</span>
                    <span class="skill-name">{skill.displayName}</span>
                </button>
            {/each}
        </div>
    </div>

    {#if selectedSkill}
        <div class="skill-meta">
            <div class="meta-card">
                <span>Skill Level</span>
                <strong>{selectedSkill.level} / {selectedSkill.maxLevel}</strong>
            </div>
            <div class="meta-card">
                <span>Tree Points</span>
                <strong>{selectedSkill.points}</strong>
            </div>
            {#if selectedSkill.specializationDisplayName}
                <div class="meta-card spec">
                    <span>Specialization</span>
                    <strong>{selectedSkill.specializationDisplayName}</strong>
                </div>
            {/if}
        </div>

        <div class="tree-frame">
            {#if selectedSkill.nodes.length === 0}
                <div class="empty">No tree data available for this skill.</div>
            {:else}
                <svg
                    class="tree-map"
                    viewBox={viewBox(selectedSkill)}
                    role="img"
                    aria-label="Read-only skill tree"
                >
                    {#each selectedSkill.edges as edge (`${edge.fromInternalIdentifier}->${edge.toInternalIdentifier}`)}
                        {@const map = nodeMap(selectedSkill)}
                        {@const from = map.get(edge.fromInternalIdentifier)}
                        {@const to = map.get(edge.toInternalIdentifier)}
                        {#if from && to && !from.isHidden && !to.isHidden}
                            <line
                                x1={from.posX}
                                y1={from.posY}
                                x2={to.posX}
                                y2={to.posY}
                                class:active-edge={edgeIsActive(selectedSkill, edge.fromInternalIdentifier, edge.toInternalIdentifier)}
                            />
                        {/if}
                    {/each}

                    {#each selectedSkill.nodes.filter(n => !n.isHidden) as node (node.internalIdentifier)}
                        {@const radius = nodeRadius(node)}
                        {@const selected = isAllocated(node.level, node.isAnchor)}
                        <g
                            class:selected-node={selected}
                            class:inactive-node={!selected && !node.isAnchor}
                            class:anchor-node={node.isAnchor}
                            class:spec-node={node.isSpecialization}
                            transform={`translate(${node.posX}, ${node.posY})`}
                        >
                            <circle r={radius} />
                            {#if node.isSpecialization}
                                <text class="node-glyph" y="4">★</text>
                            {:else if node.isAnchor}
                                <text class="node-glyph" y="4">●</text>
                            {/if}
                            <title>
                                {node.displayName}{node.maxLevel > 1 ? ` (${node.level}/${node.maxLevel})` : ''}{node.displayTooltip ? `\n${node.displayTooltip}` : ''}
                            </title>
                        </g>
                    {/each}
                </svg>
            {/if}
        </div>

        {#if allocatedNodes.length > 0}
            <div class="summary-section">
                <h3 class="summary-heading">Allocated <span class="summary-count">({allocatedNodes.length})</span></h3>
                <div class="summary-grid">
                    {#each allocatedNodes as node}
                        <div class="summary-item" class:spec-item={node.isSpecialization}>
                            <strong>
                                {node.displayName}{node.maxLevel > 1 ? ` (${node.level}/${node.maxLevel})` : ''}
                            </strong>
                            {#if node.displayTooltip}
                                <span>{node.displayTooltip}</span>
                            {/if}
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    {:else}
        <div class="empty">No skills equipped.</div>
    {/if}
</section>

<style>
    .skill-tree-viewer {
        margin-top: 1.5rem;
        border-radius: 1rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.035);
        padding: 1rem;
    }

    .viewer-header {
        display: flex;
        flex-wrap: wrap;
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

    .skill-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .skill-tab {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.15rem;
        padding: 0.45rem 0.75rem;
        border-radius: 0.6rem;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(0, 0, 0, 0.2);
        color: #cbd5e1;
        cursor: pointer;
        transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
    }

    .skill-tab:hover {
        border-color: rgba(134, 239, 172, 0.5);
        color: #ecfdf5;
    }

    .skill-tab.active {
        border-color: rgba(134, 239, 172, 0.85);
        background: rgba(20, 83, 45, 0.55);
        color: #ecfdf5;
    }

    .slot-tag {
        font-size: 0.6rem;
        font-weight: 700;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: #94a3b8;
    }

    .skill-tab.active .slot-tag {
        color: #bbf7d0;
    }

    .skill-name {
        font-size: 0.85rem;
        font-weight: 600;
    }

    .skill-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }

    .meta-card {
        min-width: 7rem;
        border-radius: 0.5rem;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(0, 0, 0, 0.2);
        padding: 0.45rem 0.75rem;
        text-align: left;
    }

    .meta-card.spec {
        border-color: rgba(250, 204, 21, 0.4);
        background: rgba(250, 204, 21, 0.08);
    }

    .meta-card span {
        display: block;
        color: #6b7280;
        font-size: 0.62rem;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
    }

    .meta-card strong {
        color: #ecfdf5;
        font-size: 0.95rem;
    }

    .meta-card.spec strong {
        color: #fde68a;
    }

    .tree-frame {
        height: min(56vh, 540px);
        min-height: 320px;
        overflow: hidden;
        border-radius: 0.75rem;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: radial-gradient(circle at center, rgba(244, 114, 182, 0.06), transparent 42%), #0a0f1a;
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
        stroke: rgba(244, 114, 182, 0.8);
        stroke-width: 5;
    }

    .tree-map circle {
        fill: rgba(15, 23, 42, 0.85);
        stroke: rgba(148, 163, 184, 0.2);
        stroke-width: 2.5;
    }

    .tree-map .selected-node circle {
        fill: rgba(112, 26, 117, 0.85);
        stroke: rgba(244, 114, 182, 0.95);
        stroke-width: 4;
    }

    .tree-map .anchor-node circle {
        fill: rgba(30, 41, 59, 0.95);
        stroke: rgba(148, 163, 184, 0.6);
        stroke-width: 3;
    }

    .tree-map .spec-node circle {
        stroke-width: 4;
        stroke: rgba(250, 204, 21, 0.65);
    }

    .tree-map .spec-node.selected-node circle {
        fill: rgba(120, 53, 15, 0.85);
        stroke: rgba(250, 204, 21, 0.95);
    }

    .tree-map .inactive-node {
        opacity: 0.32;
    }

    .tree-map .selected-node,
    .tree-map .anchor-node {
        opacity: 1;
    }

    .tree-map .node-glyph {
        fill: #fde68a;
        font-size: 14px;
        text-anchor: middle;
        font-weight: 700;
        pointer-events: none;
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

    .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
        gap: 0.65rem;
    }

    .summary-item {
        border-radius: 0.65rem;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.04);
        padding: 0.7rem;
    }

    .summary-item.spec-item {
        border-color: rgba(250, 204, 21, 0.4);
        background: rgba(250, 204, 21, 0.08);
    }

    .summary-item strong {
        display: block;
        color: #f8fafc;
        font-size: 0.8rem;
        margin-bottom: 0.25rem;
    }

    .summary-item.spec-item strong {
        color: #fde68a;
    }

    .summary-item span {
        color: #cbd5e1;
        font-size: 0.75rem;
        line-height: 1.35;
        white-space: pre-line;
    }

    .empty {
        padding: 2rem 1rem;
        text-align: center;
        color: #6b7280;
        font-size: 0.85rem;
    }

    @media (max-width: 640px) {
        .viewer-header {
            display: block;
        }
        .skill-tabs {
            margin-top: 0.75rem;
        }
    }
</style>
