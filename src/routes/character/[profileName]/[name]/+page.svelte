<script lang="ts">
    import { onMount } from 'svelte';
    import { Button } from 'flowbite-svelte';
    import type { PageData } from './$types';
    import { PlayerService, type ICharacterPassiveTreeSnapshot, type ICharacterViewer, type IGearSlotSnapshot } from '$lib/services/player-service';
    import { GetJwtToken } from '$lib/services/session-service';
    import { UserService } from '$lib/services/user-service';
    import PassiveTreeViewer from '$lib/components/PassiveTreeViewer.svelte';
    import { toast } from '$lib/toast';

    let { data }: { data: PageData } = $props();

    const playerService = new PlayerService();
    const userService = new UserService();

    let canManagePlayers = $state(false);
    let checkingPermission = $state(true);
    let updatingBlacklist = $state(false);

    async function loadViewer(): Promise<ICharacterViewer> {
        const result = await playerService.getCharacterViewer(data.profileName, data.name);
        if (!result) throw new Error('Character not found');
        return result;
    }

    let viewerPromise: Promise<ICharacterViewer> = $state(loadViewer());

    onMount(async () => {
        if (!GetJwtToken()) {
            checkingPermission = false;
            return;
        }

        try {
            canManagePlayers = await userService.hasRole('ManagePlayers');
        } catch (e) {
            console.error('Failed to resolve player management permissions', e);
        } finally {
            checkingPermission = false;
        }
    });

    async function toggleBlacklist(viewer: ICharacterViewer) {
        updatingBlacklist = true;

        try {
            const nextBlacklisted = !viewer.blacklisted;
            await playerService.updatePlayerBlacklist(viewer.id, nextBlacklisted);
            toast.push(
                nextBlacklisted
                    ? `${viewer.characterName} has been blacklisted.`
                    : `${viewer.characterName} has been removed from the blacklist.`,
                { type: 'success', duration: 2500 }
            );
            viewerPromise = loadViewer();
        } catch (e) {
            console.error('Failed to update player blacklist', e);
            toast.push('Failed to update blacklist status.', { type: 'error', duration: 3000 });
        } finally {
            updatingBlacklist = false;
        }
    }

    function rarityColor(rarity: string): string {
        switch (rarity?.toLowerCase()) {
            case 'normal': return 'text-gray-200';
            case 'magic': return 'text-blue-400';
            case 'rare': return 'text-yellow-300';
            case 'unique': return 'text-orange-400';
            default: return 'text-gray-200';
        }
    }

    function rarityBorder(rarity: string): string {
        switch (rarity?.toLowerCase()) {
            case 'normal': return 'border-gray-500/40';
            case 'magic': return 'border-blue-400/40';
            case 'rare': return 'border-yellow-400/40';
            case 'unique': return 'border-orange-400/40';
            default: return 'border-white/10';
        }
    }

    function rarityBg(rarity: string): string {
        switch (rarity?.toLowerCase()) {
            case 'normal': return 'bg-gray-500/10';
            case 'magic': return 'bg-blue-400/10';
            case 'rare': return 'bg-yellow-400/10';
            case 'unique': return 'bg-orange-400/10';
            default: return 'bg-white/5';
        }
    }

    const SLOT_ORDER = [
        'MainWeapon', 'Offhand',
        'Helmet', 'Body', 'Legs', 'Wings', 'Necklace',
        'RingLeft', 'RingRight',
        'Accessory1', 'Accessory2', 'Accessory3', 'Accessory4',
    ];

    const LOADOUT_ROWS = [
        ['MainWeapon', 'Helmet', 'Offhand'],
        ['Wings', 'Body', 'Necklace'],
        ['RingLeft', 'Legs', 'RingRight'],
    ];

    const LOADOUT_SLOTS = LOADOUT_ROWS.flat();

    const ACCESSORY_SLOT_PATTERN = /^Accessory\d+$/;

    const SLOT_LABELS: Record<string, string> = {
        MainWeapon: 'Main Weapon',
        Offhand: 'Offhand',
        Helmet: 'Helmet',
        Body: 'Body',
        Legs: 'Legs',
        Wings: 'Wings',
        Necklace: 'Necklace',
        RingLeft: 'Left Ring',
        RingRight: 'Right Ring',
    };

    function orderedSlots(slots: IGearSlotSnapshot[]) {
        const slotMap = new Map(slots.map(s => [s.slot, s]));
        const ordered = SLOT_ORDER.map(s => slotMap.get(s)).filter(Boolean) as IGearSlotSnapshot[];
        const rest = slots.filter(s => !SLOT_ORDER.includes(s.slot));
        return [...ordered, ...rest];
    }

    function loadoutSlot(slots: IGearSlotSnapshot[], slotName: string): IGearSlotSnapshot {
        return slots.find(slot => slot.slot === slotName) ?? { slot: slotName };
    }

    function accessorySlotCount(slots: IGearSlotSnapshot[]): number {
        const sentMax = slots
            .map(s => ACCESSORY_SLOT_PATTERN.exec(s.slot)?.[0])
            .filter((s): s is string => Boolean(s))
            .map(s => Number.parseInt(s.slice('Accessory'.length), 10))
            .reduce((max, n) => Math.max(max, n), 0);
        return Math.max(2, sentMax);
    }

    function additionalSlots(slots: IGearSlotSnapshot[]): IGearSlotSnapshot[] {
        const slotMap = new Map(slots.map(s => [s.slot, s]));
        const accessoryCount = accessorySlotCount(slots);
        const accessories: IGearSlotSnapshot[] = [];
        for (let i = 1; i <= accessoryCount; i++) {
            const name = `Accessory${i}`;
            accessories.push(slotMap.get(name) ?? { slot: name });
        }
        const extras = orderedSlots(slots)
            .filter(slot => !LOADOUT_SLOTS.includes(slot.slot) && !ACCESSORY_SLOT_PATTERN.test(slot.slot));
        return [...accessories, ...extras];
    }

    function slotLabel(slot: string): string {
        if (ACCESSORY_SLOT_PATTERN.test(slot)) {
            return 'Accessory';
        }
        return SLOT_LABELS[slot] ?? slot;
    }

    function inferCharacterClass(snapshot?: ICharacterPassiveTreeSnapshot): string | undefined {
        const nodeIds = new Set(snapshot?.allocatedNodes.filter(node => node.level > 0).map(node => node.referenceId) ?? []);

        if (nodeIds.has(0)) return 'Melee';
        if (nodeIds.has(-1)) return 'Ranged';
        if (nodeIds.has(-2)) return 'Magic';
        if (nodeIds.has(-3)) return 'Summoner';

        return undefined;
    }

    function characterClassLabel(viewer: ICharacterViewer): string {
        return viewer.characterClass || inferCharacterClass(viewer.passiveTreeSnapshot) || 'Unselected';
    }
</script>

<svelte:head>
    <title>{data.name} | Path of Terraria</title>
    <meta name="description" content="View {data.name}'s character stats and gear in Path of Terraria." />
</svelte:head>

<div class="relative -mt-20 min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(151,255,120,0.10),transparent_22%),linear-gradient(180deg,#090c12_0%,#111827_30%,#10191c_62%,#10191c_100%)] pt-20 text-white">
    <div class="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>
    <div class="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-gradient-to-br from-lime-400/25 via-emerald-400/12 to-sky-400/8 blur-3xl"></div>
    <div class="pointer-events-none absolute top-10 right-0 h-96 w-96 rounded-full bg-gradient-to-br from-cyan-400/16 via-indigo-400/10 to-transparent blur-3xl"></div>

    <section class="relative container mx-auto px-4 py-12">
        {#await viewerPromise}
            <div class="animate-pulse space-y-6 max-w-4xl mx-auto">
                <div class="h-10 w-64 rounded bg-white/10"></div>
                <div class="h-48 rounded-2xl bg-white/5"></div>
                <div class="h-96 rounded-2xl bg-white/5"></div>
            </div>
        {:then viewer}
            <div class="max-w-4xl mx-auto space-y-6">
                <div class="flex items-center gap-4">
                    <div>
                        <h1 class="text-3xl font-black tracking-tight text-white">{viewer.characterName}</h1>
                        {#if viewer.profileName}
                            <a href="/profile/{viewer.profileName}/characters" class="text-sm text-gray-400 hover:text-white transition">
                                @{viewer.profileName}
                            </a>
                        {/if}
                        {#if characterClassLabel(viewer) !== 'Unselected'}
                            <div class="mt-2 inline-flex rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100">
                                {characterClassLabel(viewer)}
                            </div>
                        {/if}
                        {#if viewer.blacklisted}
                            <div class="mt-2 inline-flex rounded-full border border-rose-400/30 bg-rose-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-200">
                                Blacklisted
                            </div>
                        {/if}
                    </div>
                    <div class="ml-auto flex flex-col items-end gap-2">
                        {#if viewer.modVersion}
                            <span class="text-xs text-gray-500">Mod v{viewer.modVersion}</span>
                        {/if}
                        {#if viewer.updatedDate}
                            <span class="text-xs text-gray-500">Updated {new Date(viewer.updatedDate).toLocaleDateString()}</span>
                        {/if}
                        {#if !checkingPermission && canManagePlayers}
                            <Button
                                size="sm"
                                class={viewer.blacklisted
                                    ? 'border-emerald-400/20 bg-emerald-500/90 text-white hover:bg-emerald-400'
                                    : 'border-rose-400/20 bg-rose-500/90 text-white hover:bg-rose-400'}
                                disabled={updatingBlacklist}
                                onclick={() => toggleBlacklist(viewer)}
                            >
                                {#if updatingBlacklist}
                                    Updating...
                                {:else if viewer.blacklisted}
                                    Unblacklist
                                {:else}
                                    Blacklist
                                {/if}
                            </Button>
                        {/if}
                    </div>
                </div>

                <div class="rounded-[2rem] bg-gradient-to-br from-amber-300/14 via-emerald-300/8 to-cyan-300/12 p-[1px] shadow-[0_20px_90px_rgba(0,0,0,0.28)]">
                    <div class="rounded-[calc(2rem-1px)] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.07),transparent_30%),linear-gradient(180deg,rgba(17,24,39,0.96),rgba(9,14,24,0.94))] p-5 ring-1 ring-white/10 backdrop-blur-sm">
                        <h2 class="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">Stats</h2>
                        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
                            <div class="min-w-0 rounded-xl border border-cyan-300/18 bg-cyan-300/10 px-4 py-3 text-center">
                                <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/70">Class</div>
                                <div class="mt-1 text-lg font-black text-cyan-100">{characterClassLabel(viewer)}</div>
                            </div>
                            <div class="min-w-0 rounded-xl border border-emerald-300/18 bg-emerald-300/10 px-4 py-3 text-center">
                                <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/70">Level</div>
                                <div class="mt-1 text-2xl font-black text-emerald-100">{viewer.stats.level}</div>
                            </div>
                            <div class="min-w-0 rounded-xl border border-amber-300/18 bg-amber-300/10 px-4 py-3 text-center">
                                <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300/70">Strength</div>
                                <div class="mt-1 text-2xl font-black text-amber-100">{viewer.stats.strength}</div>
                            </div>
                            <div class="min-w-0 rounded-xl border border-sky-300/18 bg-sky-300/10 px-4 py-3 text-center">
                                <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300/70">Dexterity</div>
                                <div class="mt-1 text-2xl font-black text-sky-100">{viewer.stats.dexterity}</div>
                            </div>
                            <div class="min-w-0 rounded-xl border border-fuchsia-300/18 bg-fuchsia-300/10 px-4 py-3 text-center">
                                <div class="text-[11px] font-semibold uppercase tracking-[0.18em] leading-tight text-fuchsia-300/70">Intelligence</div>
                                <div class="mt-1 text-2xl font-black text-fuchsia-100">{viewer.stats.intelligence}</div>
                            </div>
                            <div class="min-w-0 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center">
                                <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Experience</div>
                                <div class="mt-1 text-lg font-black text-white">{viewer.stats.experience.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {#if viewer.gearSnapshot && viewer.gearSnapshot.slots.length > 0}
                    <div class="rounded-[2rem] bg-gradient-to-br from-amber-300/14 via-emerald-300/8 to-cyan-300/12 p-[1px] shadow-[0_20px_90px_rgba(0,0,0,0.28)]">
                        <div class="rounded-[calc(2rem-1px)] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.07),transparent_30%),linear-gradient(180deg,rgba(17,24,39,0.96),rgba(9,14,24,0.94))] p-5 ring-1 ring-white/10 backdrop-blur-sm">
                            <div class="mb-4 flex items-center justify-between">
                                <h2 class="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">Gear</h2>
                                {#if viewer.gearSnapshot.modVersion}
                                    <span class="text-xs text-gray-500">v{viewer.gearSnapshot.modVersion}</span>
                                {/if}
                            </div>
                            <div class="mx-auto max-w-5xl">
                                <div class="grid gap-3 md:grid-cols-3">
                                    {#each LOADOUT_ROWS as row}
                                        {#each row as slotName}
                                            {@const slot = loadoutSlot(viewer.gearSnapshot.slots, slotName)}
                                            {#if slot.item}
                                                <div class="min-h-36 rounded-xl border {rarityBorder(slot.item.rarity)} {rarityBg(slot.item.rarity)} p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                                                    <div class="mb-1 flex items-center justify-between gap-2">
                                                        <span class="text-[10px] font-semibold uppercase tracking-widest text-gray-500">{slotLabel(slot.slot)}</span>
                                                        {#if slot.item.itemLevel > 0}
                                                            <span class="text-[10px] text-gray-500">iLv {slot.item.itemLevel}</span>
                                                        {/if}
                                                    </div>
                                                    <div class="font-semibold {rarityColor(slot.item.rarity)}">{slot.item.displayName}</div>
                                                    <div class="mt-0.5 text-xs text-gray-500">{slot.item.itemType}</div>
                                                    {#if slot.item.corrupted}
                                                        <div class="mt-1 text-xs font-semibold text-red-400">Corrupted</div>
                                                    {/if}
                                                    {#if slot.item.affixTextLines.length > 0}
                                                        <ul class="mt-2 space-y-0.5 border-t border-white/10 pt-2">
                                                            {#each slot.item.affixTextLines as line}
                                                                <li class="text-xs text-gray-300">{line}</li>
                                                            {/each}
                                                        </ul>
                                                    {/if}
                                                </div>
                                            {:else}
                                                <div class="flex min-h-36 flex-col justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.025] p-3 text-center opacity-60">
                                                    <div class="mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-600">{slotLabel(slot.slot)}</div>
                                                    <div class="text-xs text-gray-600">Empty</div>
                                                </div>
                                            {/if}
                                        {/each}
                                    {/each}
                                </div>

                                {#if additionalSlots(viewer.gearSnapshot.slots).length > 0}
                                    <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        {#each additionalSlots(viewer.gearSnapshot.slots) as slot}
                                            {#if slot.item}
                                                <div class="rounded-xl border {rarityBorder(slot.item.rarity)} {rarityBg(slot.item.rarity)} p-3">
                                                    <div class="mb-1 flex items-center justify-between gap-2">
                                                        <span class="text-[10px] font-semibold uppercase tracking-widest text-gray-500">{slotLabel(slot.slot)}</span>
                                                        {#if slot.item.itemLevel > 0}
                                                            <span class="text-[10px] text-gray-500">iLv {slot.item.itemLevel}</span>
                                                        {/if}
                                                    </div>
                                                    <div class="font-semibold {rarityColor(slot.item.rarity)}">{slot.item.displayName}</div>
                                                    <div class="mt-0.5 text-xs text-gray-500">{slot.item.itemType}</div>
                                                    {#if slot.item.corrupted}
                                                        <div class="mt-1 text-xs font-semibold text-red-400">Corrupted</div>
                                                    {/if}
                                                    {#if slot.item.affixTextLines.length > 0}
                                                        <ul class="mt-2 space-y-0.5 border-t border-white/10 pt-2">
                                                            {#each slot.item.affixTextLines as line}
                                                                <li class="text-xs text-gray-300">{line}</li>
                                                            {/each}
                                                        </ul>
                                                    {/if}
                                                </div>
                                            {:else}
                                                <div class="rounded-xl border border-white/5 bg-white/[0.02] p-3 opacity-40">
                                                    <div class="mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-600">{slotLabel(slot.slot)}</div>
                                                    <div class="text-xs text-gray-600">Empty</div>
                                                </div>
                                            {/if}
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </div>
                {:else}
                    <div class="rounded-[2rem] bg-gradient-to-br from-amber-300/14 via-emerald-300/8 to-cyan-300/12 p-[1px]">
                        <div class="rounded-[calc(2rem-1px)] bg-[linear-gradient(180deg,rgba(17,24,39,0.96),rgba(9,14,24,0.94))] px-5 py-10 text-center ring-1 ring-white/10">
                            <div class="text-sm font-semibold text-gray-400">No gear data available</div>
                        </div>
                    </div>
                {/if}

                {#if viewer.passiveTreeSnapshot && viewer.passiveTreeSnapshot.allocatedNodes.length > 0}
                    <div class="rounded-[2rem] bg-gradient-to-br from-amber-300/14 via-emerald-300/8 to-cyan-300/12 p-[1px] shadow-[0_20px_90px_rgba(0,0,0,0.28)]">
                        <div class="rounded-[calc(2rem-1px)] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.07),transparent_30%),linear-gradient(180deg,rgba(17,24,39,0.96),rgba(9,14,24,0.94))] p-5 ring-1 ring-white/10 backdrop-blur-sm">
                            <PassiveTreeViewer snapshot={viewer.passiveTreeSnapshot} />
                        </div>
                    </div>
                {/if}
            </div>
        {:catch _error}
            <div class="max-w-4xl mx-auto py-24 text-center">
                <div class="text-xl font-semibold text-white">Character not found</div>
                <p class="mt-2 text-sm text-gray-400">No character named "{data.name}" could be found for @{data.profileName}.</p>
                <a href="/leaderboards" class="mt-6 inline-block text-sm text-emerald-400 hover:underline">Back to leaderboards</a>
            </div>
        {/await}
    </section>
</div>
