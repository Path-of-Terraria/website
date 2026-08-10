<script lang="ts">
    import { onDestroy } from 'svelte';
    import { Button, Select, Tooltip } from 'flowbite-svelte';
    import { type IPlayer, PlayerService } from '$lib/services/player-service';

    const playerService = new PlayerService();
    const searchDelayMs = 300;

    let count = $state(50);
    let skip = $state(0);
    let lastResultLength = $state(0);
    let selectedClass = $state<'All' | 'Melee' | 'Ranged' | 'Magic' | 'Summoner'>('All');
    let searchQuery = $state('');
    let searchTimer: ReturnType<typeof setTimeout> | undefined;
    let requestSequence = 0;

    const classes = ['All', 'Melee', 'Ranged', 'Magic', 'Summoner'] as const;

    const classIconFiles: Record<string, string> = {
        Melee: 'Melee',
        Ranged: 'Ranged',
        Magic: 'Magic',
        Summoner: 'Summon',
    };

    function classIconSrc(characterClass?: string): string | undefined {
        if (!characterClass) return undefined;
        const file = classIconFiles[characterClass];
        return file ? `/classes/${file}.png` : undefined;
    }

    function formatIconLabel(value: string): string {
        return value.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
    }

    async function refreshLeaderboards(): Promise<IPlayer[]> {
        const requestId = ++requestSequence;
        const filters = {
            characterClass: selectedClass === 'All' ? undefined : selectedClass,
            search: searchQuery,
        };
        const data = await playerService.getLeaderboards(count, skip, filters);
        if (requestId === requestSequence) {
            lastResultLength = data.length;
        }

        return data;
    }

    function selectClass(value: typeof selectedClass) {
        if (selectedClass === value) return;
        selectedClass = value;
        skip = 0;
        leaderboardsPromise = refreshLeaderboards();
    }

    function updateSearch() {
        if (searchTimer) clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            skip = 0;
            leaderboardsPromise = refreshLeaderboards();
        }, searchDelayMs);
    }

    function clearSearch() {
        if (!searchQuery) return;
        if (searchTimer) clearTimeout(searchTimer);
        searchQuery = '';
        skip = 0;
        leaderboardsPromise = refreshLeaderboards();
    }

    onDestroy(() => {
        if (searchTimer) clearTimeout(searchTimer);
    });

    let leaderboardsPromise: Promise<IPlayer[]> = $state(refreshLeaderboards());

    function updatePageSize() {
        count = +count;
        skip = 0;
        leaderboardsPromise = refreshLeaderboards();
    }

    function nextPage() {
        if (lastResultLength >= count) {
            skip += count;
            leaderboardsPromise = refreshLeaderboards();
        }
    }

    function prevPage() {
        skip = Math.max(0, skip - count);
        leaderboardsPromise = refreshLeaderboards();
    }
</script>


<svelte:head>
    <title>Leaderboards | Path of Terraria</title>
    <meta
            name="description"
            content="See the current Path of Terraria leaderboard rankings for unflagged players."
    />
</svelte:head>

<div class="relative -mt-20 min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(130,216,255,0.12),transparent_24%),linear-gradient(180deg,#080d14_0%,#0e1c28_30%,#101c22_62%,#10191c_100%)] pt-20 text-white">
    <div class="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>
    <div class="rune-glyphs pointer-events-none absolute inset-0"></div>
    <div class="rune-motes pointer-events-none absolute inset-0 overflow-hidden opacity-60"></div>
    <div class="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-gradient-to-br from-rune-300/22 via-rune-400/12 to-runegold-400/8 blur-3xl"></div>
    <div class="pointer-events-none absolute top-10 right-0 h-96 w-96 rounded-full bg-gradient-to-br from-rune-400/16 via-indigo-400/10 to-transparent blur-3xl"></div>
    <div class="pointer-events-none absolute top-80 left-1/2 h-72 w-[48rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-runegold-400/12 via-rune-300/12 to-rune-500/14 blur-3xl"></div>
    <div class="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-black/10 to-transparent"></div>

    <section class="relative">
        <div class="mx-auto max-w-4xl text-center">
            <h1 class="mt-5 text-3xl font-black tracking-tight text-white md:text-4xl pt-12">
                Path of Terraria Leaderboards
            </h1>
        </div>

        <div class="relative container mx-auto px-4 py-8 md:py-12">
            <div class="mb-6 flex justify-center">
                <div class="inline-flex rounded-2xl border border-white/10 bg-white/[0.04] p-1 shadow-[0_12px_30px_rgba(0,0,0,0.22)]">
                    <a
                        href="/leaderboards"
                        class="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200"
                        aria-current="page"
                    >
                        Players
                    </a>
                    <a
                        href="/leaderboards/localizers"
                        class="rounded-xl px-4 py-2 text-sm font-semibold text-gray-300 transition-colors duration-200 hover:bg-white/6 hover:text-white"
                    >
                        Localizers
                    </a>
                </div>
            </div>

            <div class="mb-4 grid gap-3 xl:grid-cols-[1fr_auto_1fr] xl:items-center">
                <div class="inline-flex flex-wrap justify-center gap-1 justify-self-center rounded-2xl border border-white/10 bg-white/[0.04] p-1 shadow-[0_12px_30px_rgba(0,0,0,0.22)] xl:col-start-2">
                    {#each classes as cls}
                        <button
                            type="button"
                            onclick={() => selectClass(cls)}
                            aria-pressed={selectedClass === cls}
                            class="rounded-xl px-4 py-2 text-sm font-semibold transition-colors duration-200 {selectedClass === cls ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/6 hover:text-white'}"
                        >
                            {cls}
                        </button>
                    {/each}
                </div>

                <div class="w-full max-w-sm justify-self-center xl:col-start-3 xl:justify-self-end">
                    <label for="player-search" class="sr-only">Search by player name</label>
                    <div class="relative">
                        <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            class="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-400"
                        >
                            <circle cx="11" cy="11" r="7"></circle>
                            <path d="m20 20-3.5-3.5"></path>
                        </svg>
                        <input
                            id="player-search"
                            type="search"
                            placeholder="Search player name"
                            autocomplete="off"
                            bind:value={searchQuery}
                            oninput={updateSearch}
                            class="w-full rounded-xl border border-white/10 bg-[#0a1016]/90 py-2.5 pr-10 pl-10 text-sm text-white shadow-[0_12px_30px_rgba(0,0,0,0.22)] outline-none transition placeholder:text-gray-500 focus:border-rune-300/40 focus:ring-2 focus:ring-rune-300/15"
                        />
                        {#if searchQuery}
                            <button
                                type="button"
                                onclick={clearSearch}
                                aria-label="Clear player search"
                                class="absolute top-1/2 right-2.5 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-gray-400 transition hover:bg-white/10 hover:text-white"
                            >
                                <span aria-hidden="true">&times;</span>
                            </button>
                        {/if}
                    </div>
                </div>
            </div>

            <div class="rounded-[2rem] bg-gradient-to-br from-rune-200/18 via-rune-400/8 to-runegold-400/12 p-[1px] shadow-[0_20px_90px_rgba(0,0,0,0.28)]">
                <div class="rounded-[calc(2rem-1px)] bg-[radial-gradient(circle_at_top_left,rgba(130,216,255,0.09),transparent_32%),linear-gradient(180deg,rgba(17,28,41,0.96),rgba(9,15,25,0.94))] p-4 ring-1 ring-white/10 backdrop-blur-sm md:p-5">
                    <div class="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0a1016] shadow-[0_18px_50px_rgba(0,0,0,0.3)]">
                        <div class="hidden grid-cols-[minmax(0,2.2fr)_0.8fr_0.9fr_0.9fr_0.9fr] gap-4 border-b border-white/10 bg-white/[0.04] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-300 md:grid">
                            <div>Character Name</div>
                            <div>Level</div>
                            <div>Strength</div>
                            <div>Dexterity</div>
                            <div>Intelligence</div>
                        </div>

                        {#await leaderboardsPromise}
                            <div class="divide-y divide-white/6 px-3 md:px-4">
                                {#each Array(6) as _}
                                    <div class="animate-pulse py-3">
                                        <div class="grid gap-3 md:grid-cols-[minmax(0,2.2fr)_0.8fr_0.9fr_0.9fr_0.9fr] md:items-center md:gap-4">
                                            <div class="h-4 w-40 rounded bg-white/10"></div>
                                            <div class="h-4 w-12 rounded bg-white/10"></div>
                                            <div class="h-4 w-14 rounded bg-white/10"></div>
                                            <div class="h-4 w-14 rounded bg-white/10"></div>
                                            <div class="h-4 w-14 rounded bg-white/10"></div>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        {:then leaders}
                            {#if leaders.length === 0}
                                <div class="px-5 py-14 text-center">
                                    <div class="text-lg font-semibold text-white">
                                        {searchQuery.trim() ? `No players match "${searchQuery.trim()}"` : 'No player data found'}
                                    </div>
                                    <p class="mt-2 text-sm text-gray-400">
                                        {searchQuery.trim() ? 'Try a different player name or class filter.' : 'Try a different page size or check back later.'}
                                    </p>
                                </div>
                            {:else}
                                <div class="divide-y divide-white/6 px-3 md:px-4">
                                    {#each leaders as leader, index}
                                        <div class="py-3 transition-colors duration-200 hover:bg-white/[0.025]">
                                            <div class="grid gap-3 md:grid-cols-[minmax(0,2.2fr)_0.8fr_0.9fr_0.9fr_0.9fr] md:items-center md:gap-4">
                                                <div class="min-w-0">
                                                    <div class="flex items-start justify-between gap-3 md:block">
                                                        <div class="flex min-w-0 items-center gap-3">
                                                        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/6 text-sm font-black text-white md:h-10 md:w-10">
                                                            {skip + index + 1}
                                                        </div>
                                                            <div class="min-w-0">
                                                                <div class="flex items-center gap-2">
                                                                {#if classIconSrc(leader.characterClass)}
                                                                    <img
                                                                        src={classIconSrc(leader.characterClass)}
                                                                        alt={`${leader.characterClass} class`}
                                                                        class="h-5 w-5 shrink-0 [image-rendering:pixelated]"
                                                                    />
                                                                    <Tooltip>{leader.characterClass} class</Tooltip>
                                                                {/if}
                                                                <a
                                                                    href={`/character/${encodeURIComponent(leader.profileName ?? '')}/${encodeURIComponent(leader.name)}`}
                                                                    class="truncate text-sm font-semibold text-white transition hover:underline md:text-base"
                                                                    style={`color: ${leader.user?.chosenBenefits?.chatColor?.value || 'inherit'}`}
                                                                >
                                                                    {leader.name}
                                                                </a>
                                                                {#if leader.user?.chosenBenefits?.chatIcon?.value}
                                                                    <img
                                                                        src={`/chat-icons/${leader.user.chosenBenefits.chatIcon.value}.png`}
                                                                        alt={formatIconLabel(leader.user.chosenBenefits.chatIcon.value)}
                                                                        class="h-5 w-5 shrink-0 [image-rendering:pixelated]"
                                                                    />
                                                                    <Tooltip>{formatIconLabel(leader.user.chosenBenefits.chatIcon.value)}</Tooltip>
                                                                {/if}
                                                            </div>
                                                        </div>
                                                    </div>
                                                        <div class="md:hidden">
                                                            <div class="inline-flex rounded-full border border-emerald-300/18 bg-emerald-300/10 px-2.5 py-1 text-xs font-semibold text-emerald-100">
                                                                Lv {leader.stats.level}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold uppercase tracking-[0.18em] md:hidden">
                                                        <div class="flex items-baseline gap-1.5 text-amber-100">
                                                            <span class="text-amber-200/70">Str</span>
                                                            <span>{leader.stats.strength}</span>
                                                        </div>
                                                        <div class="flex items-baseline gap-1.5 text-sky-100">
                                                            <span class="text-sky-200/70">Dex</span>
                                                            <span>{leader.stats.dexterity}</span>
                                                        </div>
                                                        <div class="flex items-baseline gap-1.5 text-fuchsia-100">
                                                            <span class="text-fuchsia-200/70">Int</span>
                                                            <span>{leader.stats.intelligence}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div class="hidden md:block">
                                                    <div class="inline-flex rounded-full border border-emerald-300/18 bg-emerald-300/10 px-3 py-1 text-sm font-semibold text-emerald-100">
                                                        {leader.stats.level}
                                                    </div>
                                                </div>

                                                <div class="hidden md:block">
                                                    <div class="text-lg font-bold text-amber-100">{leader.stats.strength}</div>
                                                </div>

                                                <div class="hidden md:block">
                                                    <div class="text-lg font-bold text-sky-100">{leader.stats.dexterity}</div>
                                                </div>

                                                <div class="hidden md:block">
                                                    <div class="text-lg font-bold text-fuchsia-100">{leader.stats.intelligence}</div>
                                                </div>
                                            </div>
                                        </div>
                                    {/each}
                                </div>
                            {/if}
                        {:catch}
                            <div class="px-5 py-14 text-center">
                                <div class="text-lg font-semibold text-white">Failed to load leaderboards</div>
                                <p class="mt-2 text-sm text-gray-400">There was a problem loading ranking data.</p>
                            </div>
                        {/await}
                    </div>

                    <div class="mt-5 flex flex-col gap-3 border-t border-white/10 pt-4 md:flex-row md:items-center md:justify-between">
                        <div class="flex items-center gap-3">
                            <div class="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 backdrop-blur-sm">
                                <div class="text-[11px] font-semibold uppercase tracking-[0.25em] text-rune-200/80">Page Size</div>
                                <Select
                                        id="page-size"
                                        size="sm"
                                        class="mt-2 min-w-28 border-0 bg-transparent text-sm text-white focus:ring-0"
                                        bind:value={count}
                                        onchange={updatePageSize}
                                >
                                    <option value={1}>1</option>
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </Select>
                            </div>
                        </div>

                        <div class="flex items-center gap-3">
                            <Button
                                    outline
                                    size="sm"
                                    onclick={prevPage}
                                    disabled={skip === 0}
                                    class="border-white/15 bg-white/6 text-white hover:bg-white/10"
                            >
                                Previous
                            </Button>
                            <span class="text-sm text-gray-300">Showing {skip + (lastResultLength ? 1 : 0)}-{skip + lastResultLength}</span>
                            <Button
                                    outline
                                    size="sm"
                                    onclick={nextPage}
                                    disabled={lastResultLength < count}
                                    class="border-white/15 bg-white/6 text-white hover:bg-white/10"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</div>
