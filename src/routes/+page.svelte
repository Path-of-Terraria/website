<script lang="ts">
    import { Heading } from "flowbite-svelte";
    import {
        WandMagicSparklesSolid,
        AnnotationSolid,
        MapPinAltSolid,
        AdjustmentsVerticalSolid
    } from "flowbite-svelte-icons";
</script>


<svelte:head>
    <title>Path of Terraria</title>
    <meta name="description"
          content="Path of Terraria is a game changing mod bringing the ARPG experience into Terraria"/>
</svelte:head>

<!-- Hero Section -->
<section class="relative overflow-hidden bg-gradient-to-b from-gray-950 via-gray-900 to-gray-800 text-white">
    <!-- Decorative gradient blobs -->
    <div class="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-gradient-to-br from-indigo-500/30 via-sky-500/20 to-emerald-500/20 blur-3xl"></div>
    <div class="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-gradient-to-br from-fuchsia-500/20 via-purple-500/20 to-indigo-500/30 blur-3xl"></div>

    <div class="relative container mx-auto px-4 py-24 text-center">
        <Heading tag="h1" class="mt-12 mb-6 font-extrabold text-4xl md:text-6xl lg:text-7xl tracking-tight">
			<span class="bg-gradient-to-r from-indigo-300 via-sky-300 to-emerald-300 bg-clip-text text-transparent">
				Path of Terraria
			</span>
        </Heading>
        <p class="mx-auto max-w-3xl text-base md:text-xl text-gray-300">
            A game-changing mod that brings the ARPG experience into Terraria
        </p>
        <div class="my-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#features"
               class="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 to-emerald-500 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-500/10 ring-1 ring-white/10 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-emerald-400">
                Explore Features
            </a>
            <a href="https://wiki.pathofterraria.com/"
               class="inline-flex items-center justify-center rounded-lg bg-white/10 px-6 py-3 font-semibold text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-indigo-400">
                Read the Wiki
            </a>
        </div>
    </div>

    <!-- Divider -->
    <div aria-hidden="true" class="absolute inset-x-0 bottom-0 h-16">
        <svg class="h-full w-full" viewBox="0 0 1440 80" preserveAspectRatio="none" fill="currentColor">
            <path class="text-gray-800"
                  d="M0,32L60,26.7C120,21,240,11,360,26.7C480,43,600,85,720,85.3C840,85,960,43,1080,32C1200,21,1320,43,1380,53.3L1440,64L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z"></path>
        </svg>
    </div>
</section>

<!-- Features Section -->
<section id="features" class="relative bg-gray-800 text-white">
    <div class="container mx-auto px-4 py-20">
        <div class="mx-auto mb-12 max-w-2xl text-center">
            <span class="inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-wider text-gray-300">Features</span>
            <h2 class="mt-4 text-3xl md:text-4xl font-extrabold">What makes it different</h2>
            <p class="mt-2 text-gray-300">Systems built for replayability, player choice, and progression you can
                feel.</p>
        </div>

        <div class="space-y-10">
            <!-- Row: Mapping System (Image Left) -->
            <div class="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 p-[1px]">
                <div class="flex flex-col md:flex-row items-center gap-8 rounded-2xl bg-gray-900/60 p-6 ring-1 ring-white/10 backdrop-blur-sm">
                    <!-- Image placeholder -->
                    <div class="w-full md:w-1/2">
                        <div aria-hidden="true"
                             class="h-48 md:h-64 w-full rounded-xl ring-1 ring-white/10 bg-gradient-to-tr from-indigo-600/30 via-indigo-400/20 to-white/5"></div>
                    </div>
                    <!-- Content -->
                    <div class="w-full md:w-1/2">
                        <div class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-400/30">
                            <MapPinAltSolid class="h-6 w-6"/>
                        </div>
                        <h3 class="text-xl font-bold">Mapping System</h3>
                        <p class="mt-2 text-gray-300">Endgame-inspired mapping with modifiers, density, and escalating
                            rewards.</p>
                        <div class="mt-4 text-xs text-gray-400">Endgame • Replayability • Scaling</div>
                        <div class="mt-6">
                            <a href="https://wiki.pathofterraria.com/Endgame/Mapping"
                               class="inline-flex items-center justify-center rounded-lg bg-white/10 px-4 py-2 font-medium text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-indigo-400">Learn
                                more</a>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Row: Questing System (Image Right) -->
            <div class="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 p-[1px]">
                <div class="flex flex-col md:flex-row-reverse items-center gap-8 rounded-2xl bg-gray-900/60 p-6 ring-1 ring-white/10 backdrop-blur-sm">
                    <!-- Image placeholder -->
                    <div class="w-full md:w-1/2">
                        <div aria-hidden="true"
                             class="h-48 md:h-64 w-full rounded-xl ring-1 ring-white/10 bg-gradient-to-tr from-emerald-600/30 via-emerald-400/20 to-white/5"></div>
                    </div>
                    <!-- Content -->
                    <div class="w-full md:w-1/2">
                        <div class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30">
                            <AnnotationSolid class="h-6 w-6"/>
                        </div>
                        <h3 class="text-xl font-bold">Questing System</h3>
                        <p class="mt-2 text-gray-300">NPC-driven progression, optional paths, and meaningful rewards as
                            you play.</p>
                        <div class="mt-4 text-xs text-gray-400">NPCs • Objectives • Rewards</div>
                        <div class="mt-6">
                            <a href="https://wiki.pathofterraria.com/Towns"
                               class="inline-flex items-center justify-center rounded-lg bg-white/10 px-4 py-2 font-medium text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-emerald-400">Learn
                                more</a>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Row: Redesigned Item System (Image Left) -->
            <div class="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 p-[1px]">
                <div class="flex flex-col md:flex-row items-center gap-8 rounded-2xl bg-gray-900/60 p-6 ring-1 ring-white/10 backdrop-blur-sm">
                    <!-- Image placeholder -->
                    <div class="w-full md:w-1/2">
                        <div aria-hidden="true"
                             class="h-48 md:h-64 w-full rounded-xl ring-1 ring-white/10 bg-gradient-to-tr from-sky-600/30 via-sky-400/20 to-white/5"></div>
                    </div>
                    <!-- Content -->
                    <div class="w-full md:w-1/2">
                        <div class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/20 text-sky-300 ring-1 ring-sky-400/30">
                            <WandMagicSparklesSolid class="h-6 w-6"/>
                        </div>
                        <h3 class="text-xl font-bold">Redesigned Item System</h3>
                        <p class="mt-2 text-gray-300">Loot with affixes. Combine affixes to craft powerful builds.</p>
                        <div class="mt-4 text-xs text-gray-400">Affixes • Crafting • Uniques</div>
                        <div class="mt-6">
                            <a href="https://wiki.pathofterraria.com/Gear"
                               class="inline-flex items-center justify-center rounded-lg bg-white/10 px-4 py-2 font-medium text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-sky-400">Learn
                                more</a>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Row: Boss Domains (Image Right) -->
            <div class="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 p-[1px]">
                <div class="flex flex-col md:flex-row-reverse items-center gap-8 rounded-2xl bg-gray-900/60 p-6 ring-1 ring-white/10 backdrop-blur-sm">
                    <!-- Image placeholder -->
                    <div class="w-full md:w-1/2">
                        <div aria-hidden="true"
                             class="h-48 md:h-64 w-full rounded-xl ring-1 ring-white/10 bg-gradient-to-tr from-fuchsia-600/30 via-fuchsia-400/20 to-white/5"></div>
                    </div>
                    <!-- Content -->
                    <div class="w-full md:w-1/2">
                        <div class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-fuchsia-500/20 text-fuchsia-300 ring-1 ring-fuchsia-400/30">
                            <AdjustmentsVerticalSolid class="h-6 w-6"/>
                        </div>
                        <h3 class="text-xl font-bold">Boss Domains</h3>
                        <p class="mt-2 text-gray-300">Face bespoke arenas and mechanics with unique loot tailored to
                            ARPG play.</p>
                        <div class="mt-4 text-xs text-gray-400">Arenas • Mechanics • Loot</div>
                        <div class="mt-6">
                            <a href="https://wiki.pathofterraria.com/en/Quests"
                               class="inline-flex items-center justify-center rounded-lg bg-white/10 px-4 py-2 font-medium text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-fuchsia-400">Learn
                                more</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>