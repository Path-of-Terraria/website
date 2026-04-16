<script lang="ts">
    import { Button, Select } from 'flowbite-svelte';
    import { type IPlayer, PlayerService } from '$lib/services/player-service';

    const playerService = new PlayerService();

    let count = $state(50);
    let skip = $state(0);
    let lastResultLength = $state(0);

    async function refreshLeaderboards(): Promise<IPlayer[]> {
        const data = await playerService.getLeaderboards(count, skip);
        lastResultLength = data.length;
        return data;
    }

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

<div class="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(151,255,120,0.10),transparent_22%),linear-gradient(180deg,#090c12_0%,#111827_30%,#10191c_62%,#10191c_100%)] text-white">
    <div class="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>
    <div class="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-gradient-to-br from-lime-400/25 via-emerald-400/12 to-sky-400/8 blur-3xl"></div>
    <div class="pointer-events-none absolute top-10 right-0 h-96 w-96 rounded-full bg-gradient-to-br from-cyan-400/16 via-indigo-400/10 to-transparent blur-3xl"></div>
    <div class="pointer-events-none absolute top-80 left-1/2 h-72 w-[48rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500/14 via-emerald-400/10 to-sky-400/14 blur-3xl"></div>
    <div class="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-black/10 to-transparent"></div>

    <section class="relative">
        <div class="mx-auto max-w-4xl text-center">
            <h1 class="mt-5 text-3xl font-black tracking-tight text-white md:text-4xl pt-32">
                Path of Terraria Leaderboards
            </h1>
        </div>

        <div class="relative container mx-auto px-4 py-8 md:py-12">
            <div class="rounded-[2rem] bg-gradient-to-br from-amber-300/14 via-emerald-300/8 to-cyan-300/12 p-[1px] shadow-[0_20px_90px_rgba(0,0,0,0.28)]">
                <div class="rounded-[calc(2rem-1px)] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.07),transparent_30%),linear-gradient(180deg,rgba(17,24,39,0.96),rgba(9,14,24,0.94))] p-4 ring-1 ring-white/10 backdrop-blur-sm md:p-5">
                    <div class="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0a1016] shadow-[0_18px_50px_rgba(0,0,0,0.3)]">
                        <div class="hidden grid-cols-[minmax(0,2.2fr)_0.8fr_0.9fr_0.9fr_0.9fr] gap-4 border-b border-white/10 bg-white/[0.04] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-300 md:grid">
                            <div>Character Name</div>
                            <div>Level</div>
                            <div>Strength</div>
                            <div>Dexterity</div>
                            <div>Intelligence</div>
                        </div>

                        {#await leaderboardsPromise}
                            <div class="space-y-2.5 p-3 md:p-4">
                                {#each Array(6) as _}
                                    <div class="rounded-2xl border border-white/8 bg-white/[0.035] px-3 py-3 animate-pulse md:px-4">
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
                                    <div class="text-lg font-semibold text-white">No player data found</div>
                                    <p class="mt-2 text-sm text-gray-400">Try a different page size or check back later.</p>
                                </div>
                            {:else}
                                <div class="space-y-2.5 p-3 md:p-4">
                                    {#each leaders as leader, index}
                                        <div class="group rounded-2xl border border-white/8 bg-white/[0.035] px-3 py-3 transition duration-300 hover:border-emerald-300/18 hover:bg-white/[0.06] hover:shadow-[0_18px_40px_rgba(0,0,0,0.22)] md:px-4">
                                            <div class="grid gap-3 md:grid-cols-[minmax(0,2.2fr)_0.8fr_0.9fr_0.9fr_0.9fr] md:items-center md:gap-4">
                                                <div class="min-w-0">
                                                    <div class="flex items-start justify-between gap-3 md:block">
                                                        <div class="flex min-w-0 items-center gap-3">
                                                        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-amber-300/16 via-emerald-300/10 to-cyan-300/14 text-sm font-black text-white md:h-10 md:w-10">
                                                            {skip + index + 1}
                                                        </div>
                                                            <div class="min-w-0">
                                                                <div class="flex items-center gap-2">
                                                                {#if leader.user?.chosenBenefits?.chatIcon?.value}
                                                                    <i class={leader.user.chosenBenefits.chatIcon.value}></i>
                                                                {/if}
                                                                <span
                                                                        class="truncate text-sm font-semibold text-white md:text-base"
                                                                        style={`color: ${leader.user?.chosenBenefits?.chatColor?.value || 'inherit'}`}
                                                                >
                                                                    {leader.name}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                        <div class="md:hidden">
                                                            <div class="inline-flex rounded-full border border-emerald-300/18 bg-emerald-300/10 px-2.5 py-1 text-xs font-semibold text-emerald-100">
                                                                Lv {leader.stats.level}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="mt-3 grid grid-cols-3 gap-2 md:hidden">
                                                        <div class="rounded-xl border border-white/8 bg-white/[0.035] px-2.5 py-2 text-center">
                                                            <div class="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200/75">Str</div>
                                                            <div class="mt-1 text-sm font-bold text-amber-100">{leader.stats.strength}</div>
                                                        </div>
                                                        <div class="rounded-xl border border-white/8 bg-white/[0.035] px-2.5 py-2 text-center">
                                                            <div class="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-200/75">Dex</div>
                                                            <div class="mt-1 text-sm font-bold text-sky-100">{leader.stats.dexterity}</div>
                                                        </div>
                                                        <div class="rounded-xl border border-white/8 bg-white/[0.035] px-2.5 py-2 text-center">
                                                            <div class="text-[10px] font-semibold uppercase tracking-[0.18em] text-fuchsia-200/75">Int</div>
                                                            <div class="mt-1 text-sm font-bold text-fuchsia-100">{leader.stats.intelligence}</div>
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
                                <div class="text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-200/80">Page Size</div>
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
