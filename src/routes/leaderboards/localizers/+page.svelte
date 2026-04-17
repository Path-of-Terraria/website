<script lang="ts">
    import { TranslationEntryService } from '$lib/services/translation-entry-service';
    import type { ITranslationContributorLeaderboardEntry } from '$lib/models/localization';

    const translationEntryService = new TranslationEntryService();

    function refreshLeaderboards(): Promise<ITranslationContributorLeaderboardEntry[]> {
        return translationEntryService.getLeaderboards();
    }

    function formatLastContribution(value: string | null): string {
        if (!value) {
            return 'Never';
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return 'Unknown';
        }

        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }).format(date);
    }

    let leaderboardsPromise: Promise<ITranslationContributorLeaderboardEntry[]> = $state(refreshLeaderboards());
</script>

<svelte:head>
    <title>Localizer Leaderboards | Path of Terraria</title>
    <meta
        name="description"
        content="See the current Path of Terraria localization leaderboard rankings."
    />
</svelte:head>

<div class="relative -mt-20 min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(151,255,120,0.10),transparent_22%),linear-gradient(180deg,#090c12_0%,#111827_30%,#10191c_62%,#10191c_100%)] pt-20 text-white">
    <div class="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>
    <div class="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-gradient-to-br from-lime-400/25 via-emerald-400/12 to-sky-400/8 blur-3xl"></div>
    <div class="pointer-events-none absolute top-10 right-0 h-96 w-96 rounded-full bg-gradient-to-br from-cyan-400/16 via-indigo-400/10 to-transparent blur-3xl"></div>
    <div class="pointer-events-none absolute top-80 left-1/2 h-72 w-[48rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500/14 via-emerald-400/10 to-sky-400/14 blur-3xl"></div>
    <div class="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-black/10 to-transparent"></div>

    <section class="relative">
        <div class="mx-auto max-w-4xl text-center">
            <h1 class="mt-5 pt-32 text-3xl font-black tracking-tight text-white md:text-4xl">
                Path of Terraria Leaderboards
            </h1>
        </div>

        <div class="relative container mx-auto px-4 py-8 md:py-12">
            <div class="mb-6 flex justify-center">
                <div class="inline-flex rounded-2xl border border-white/10 bg-white/[0.04] p-1 shadow-[0_12px_30px_rgba(0,0,0,0.22)]">
                    <a
                        href="/leaderboards"
                        class="rounded-xl px-4 py-2 text-sm font-semibold text-gray-300 transition-colors duration-200 hover:bg-white/6 hover:text-white"
                    >
                        Players
                    </a>
                    <a
                        href="/leaderboards/localizers"
                        class="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200"
                        aria-current="page"
                    >
                        Localizers
                    </a>
                </div>
            </div>

            <div class="mx-auto mb-6 max-w-3xl rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-center text-sm text-gray-300 shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
                This leaderboard is for people who have contributed to the localization of the mod.
                <a
                    href="/mod-data/localization"
                    class="ml-1 font-semibold text-emerald-200 transition-colors duration-200 hover:text-emerald-100"
                >
                    Help translate here.
                </a>
            </div>

            <div class="rounded-[2rem] bg-gradient-to-br from-amber-300/14 via-emerald-300/8 to-cyan-300/12 p-[1px] shadow-[0_20px_90px_rgba(0,0,0,0.28)]">
                <div class="rounded-[calc(2rem-1px)] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.07),transparent_30%),linear-gradient(180deg,rgba(17,24,39,0.96),rgba(9,14,24,0.94))] p-4 ring-1 ring-white/10 backdrop-blur-sm md:p-5">
                    <div class="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0a1016] shadow-[0_18px_50px_rgba(0,0,0,0.3)]">
                        <div class="hidden grid-cols-[minmax(0,2.2fr)_0.9fr_0.8fr_1.2fr] gap-4 border-b border-white/10 bg-white/[0.04] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-300 md:grid">
                            <div>Localizer</div>
                            <div>Contributions</div>
                            <div>Languages</div>
                            <div>Last Contribution</div>
                        </div>

                        {#await leaderboardsPromise}
                            <div class="divide-y divide-white/6 px-3 md:px-4">
                                {#each Array(6) as _}
                                    <div class="animate-pulse py-3">
                                        <div class="grid gap-3 md:grid-cols-[minmax(0,2.2fr)_0.9fr_0.8fr_1.2fr] md:items-center md:gap-4">
                                            <div class="h-4 w-40 rounded bg-white/10"></div>
                                            <div class="h-4 w-20 rounded bg-white/10"></div>
                                            <div class="h-4 w-14 rounded bg-white/10"></div>
                                            <div class="h-4 w-28 rounded bg-white/10"></div>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        {:then leaders}
                            {#if leaders.length === 0}
                                <div class="px-5 py-14 text-center">
                                    <div class="text-lg font-semibold text-white">No localizer data found</div>
                                    <p class="mt-2 text-sm text-gray-400">Check back later for contributor rankings.</p>
                                </div>
                            {:else}
                                <div class="divide-y divide-white/6 px-3 md:px-4">
                                    {#each leaders as leader, index}
                                        <div class="py-3 transition-colors duration-200 hover:bg-white/[0.025]">
                                            <div class="grid gap-3 md:grid-cols-[minmax(0,2.2fr)_0.9fr_0.8fr_1.2fr] md:items-center md:gap-4">
                                                <div class="min-w-0">
                                                    <div class="flex min-w-0 items-center gap-3">
                                                        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/6 text-sm font-black text-white md:h-10 md:w-10">
                                                            {index + 1}
                                                        </div>
                                                        <div class="min-w-0">
                                                            <div class="truncate text-sm font-semibold text-white md:text-base">
                                                                {leader.profileName}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold uppercase tracking-[0.18em] md:hidden">
                                                        <div class="flex items-baseline gap-1.5 text-amber-100">
                                                            <span class="text-amber-200/70">Contrib</span>
                                                            <span>{leader.contributionCount}</span>
                                                        </div>
                                                        <div class="flex items-baseline gap-1.5 text-sky-100">
                                                            <span class="text-sky-200/70">Lang</span>
                                                            <span>{leader.languageCount}</span>
                                                        </div>
                                                        <div class="flex items-baseline gap-1.5 text-gray-200">
                                                            <span class="text-gray-400">Last</span>
                                                            <span>{formatLastContribution(leader.lastContributionAt)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div class="hidden md:block">
                                                    <div class="text-lg font-bold text-amber-100">{leader.contributionCount}</div>
                                                </div>

                                                <div class="hidden md:block">
                                                    <div class="text-lg font-bold text-sky-100">{leader.languageCount}</div>
                                                </div>

                                                <div class="hidden md:block">
                                                    <div class="text-sm font-semibold text-gray-200">{formatLastContribution(leader.lastContributionAt)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    {/each}
                                </div>
                            {/if}
                        {:catch}
                            <div class="px-5 py-14 text-center">
                                <div class="text-lg font-semibold text-white">Failed to load leaderboards</div>
                                <p class="mt-2 text-sm text-gray-400">There was a problem loading localization ranking data.</p>
                            </div>
                        {/await}
                    </div>
                </div>
            </div>
        </div>
    </section>
</div>
