<script lang="ts">
    import {
        WandMagicSparklesSolid,
        AnnotationSolid,
        MapPinAltSolid,
        AdjustmentsVerticalSolid
    } from "flowbite-svelte-icons";
    import logo from '$lib/images/logo.png';
</script>


<svelte:head>
    <title>Path of Terraria</title>
    <meta
            name="description"
            content="Path of Terraria is a game changing mod bringing the ARPG experience into Terraria"
    />
</svelte:head>

<!-- Hero Section -->
<section
        class="relative -mt-20 overflow-hidden bg-[radial-gradient(circle_at_top,rgba(151,255,120,0.10),transparent_30%),linear-gradient(180deg,#090c12_0%,#111827_42%,#1f2937_100%)] pt-20 text-white"
>
    <div class="pointer-events-none absolute inset-0 transition duration-200 hero-cursor-glow"></div>
    <div class="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 [mask-image:linear-gradient(180deg,rgba(0,0,0,0.8),transparent_85%)]"></div>
    <div class="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-gradient-to-br from-lime-400/25 via-emerald-400/12 to-sky-400/8 blur-3xl"></div>
    <div class="pointer-events-none absolute top-10 right-0 h-96 w-96 rounded-full bg-gradient-to-br from-cyan-400/16 via-indigo-400/10 to-transparent blur-3xl"></div>
    <div class="pointer-events-none absolute -bottom-24 left-1/2 h-72 w-[48rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500/14 via-emerald-400/10 to-sky-400/14 blur-3xl"></div>
    <div class="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/35 to-transparent"></div>
    <div class="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-[linear-gradient(90deg,#243421_0%,#4f6f2f_15%,#7b9f3f_30%,#d19747_45%,#70502a_58%,#38562b_74%,#1b2d22_100%)] [clip-path:polygon(0_55%,8%_55%,8%_40%,16%_40%,16%_68%,27%_68%,27%_34%,39%_34%,39%_61%,50%_61%,50%_36%,61%_36%,61%_66%,74%_66%,74%_44%,85%_44%,85%_60%,100%_60%,100%_100%,0_100%)] opacity-80"></div>

    <div class="relative container mx-auto px-4 py-24 text-center md:py-28">
        <div class="mb-8 flex flex-col items-center justify-center md:flex-row">
            <div class="hero-panel relative rounded-[2rem] border border-white/10 bg-white/5 px-6 py-6 shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-sm">
                <div class="pointer-events-none absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_top,rgba(200,255,150,0.14),transparent_45%),linear-gradient(135deg,rgba(255,255,255,0.05),transparent_55%)]"></div>
                <div class="pointer-events-none absolute inset-x-8 bottom-2 h-10 rounded-full bg-emerald-400/15 blur-2xl"></div>
                <img
                    class="relative h-auto w-full max-w-[18rem] drop-shadow-[0_16px_35px_rgba(0,0,0,0.45)] sm:max-w-[22rem] md:max-w-[28rem] lg:max-w-[34rem]"
                    src={logo}
                    alt="Path of Terraria"
                />
            </div>
        </div>
        <p class="mx-auto max-w-3xl text-base text-gray-300 md:text-xl">
            A game-changing mod that brings the ARPG experience into Terraria
        </p>
        <div class="my-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
                    href="#features"
                    class="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 to-emerald-500 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-500/10 ring-1 ring-white/10 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
                Explore Features
            </a>
            <a
                    href="https://wiki.pathofterraria.com/"
                    class="inline-flex items-center justify-center rounded-lg bg-white/10 px-6 py-3 font-semibold text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
                Read the Wiki
            </a>
        </div>
    </div>
</section>

<style>
    .hero-cursor-glow {
        background:
            radial-gradient(
                circle 13rem at var(--hero-cursor-x, 50%) var(--hero-cursor-y, 32%),
                rgba(177, 255, 120, 0.22),
                rgba(96, 212, 255, 0.12) 35%,
                transparent 72%
            );
        opacity: var(--hero-cursor-opacity, 0);
    }
</style>

<!-- Features Section -->
<section id="features" class="relative bg-gray-800 text-white">
    <div class="container mx-auto px-4 py-20">
        <div class="mx-auto mb-12 max-w-2xl text-center">
            <span class="inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-wider text-gray-300">Features</span>
            <h2 class="mt-4 text-3xl font-extrabold md:text-4xl">What makes it different</h2>
            <p class="mt-2 text-gray-300">Systems built for replayability, player choice, and progression you can feel.</p>
        </div>

        <div class="space-y-8 md:space-y-10">
            <div class="group rounded-[2rem] bg-gradient-to-br from-amber-300/20 via-lime-200/8 to-cyan-300/12 p-[1px] shadow-[0_20px_80px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_100px_rgba(0,0,0,0.38)]">
                <div class="flex flex-col items-center gap-6 rounded-[calc(2rem-1px)] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.07),transparent_30%),linear-gradient(180deg,rgba(17,24,39,0.96),rgba(9,14,24,0.94))] p-5 ring-1 ring-white/10 backdrop-blur-sm md:flex-row md:gap-8 md:p-6">
                    <div class="w-full md:w-1/2">
                        <div class="relative aspect-video w-full overflow-hidden rounded-[1.4rem] border border-white/10 bg-gray-950 shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
                            <img src="/home/opening-map.gif" alt="Path of Terraria mapping gameplay" class="h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.03]" />
                            <div class="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-300/18 via-transparent to-cyan-300/10"></div>
                            <div class="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/65 to-transparent"></div>
                            <div class="absolute left-4 top-4 rounded-full border border-white/12 bg-black/35 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-100 backdrop-blur-sm">Atlas Loop</div>
                        </div>
                    </div>
                    <div class="w-full md:w-1/2">
                        <div class="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/12 text-amber-200 ring-1 ring-amber-300/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                            <MapPinAltSolid class="h-6 w-6" />
                        </div>
                        <h3 class="mt-3 text-2xl font-black tracking-tight text-white md:text-[2rem]">Mapping System</h3>
                        <p class="mt-4 max-w-xl text-[15px] leading-7 text-gray-300">Endgame-inspired mapping with modifiers, density, and escalating rewards.</p>
                        <div class="mt-6 flex flex-wrap gap-2">
                            <span class="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-200">Endgame</span>
                            <span class="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-200">Replayability</span>
                            <span class="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-200">Scaling</span>
                        </div>
                        <div class="mt-7">
                            <a href="https://wiki.pathofterraria.com/Endgame/Mapping" class="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/8 px-5 py-3 font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur transition hover:bg-white/12 focus:outline-none focus:ring-2 focus:ring-amber-300">Learn more</a>
                        </div>
                    </div>
                </div>
            </div>

            <div class="group rounded-[2rem] bg-gradient-to-br from-emerald-300/18 via-teal-200/8 to-cyan-300/12 p-[1px] shadow-[0_20px_80px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_100px_rgba(0,0,0,0.38)]">
                <div class="flex flex-col items-center gap-6 rounded-[calc(2rem-1px)] bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.07),transparent_30%),linear-gradient(180deg,rgba(17,24,39,0.96),rgba(9,14,24,0.94))] p-5 ring-1 ring-white/10 backdrop-blur-sm md:flex-row-reverse md:gap-8 md:p-6">
                    <div class="w-full md:w-1/2">
                        <div class="relative aspect-[1196/452] w-full overflow-hidden rounded-[1.4rem] border border-white/10 bg-gray-950 shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
                            <img src="/home/quest.png" alt="Path of Terraria questing interface" class="h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.03]" />
                            <div class="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-300/18 via-transparent to-cyan-300/10"></div>
                            <div class="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/65 to-transparent"></div>
                            <div class="absolute left-4 top-4 rounded-full border border-white/12 bg-black/35 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-100 backdrop-blur-sm">World Progression</div>
                        </div>
                    </div>
                    <div class="w-full md:w-1/2">
                        <div class="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/12 text-emerald-200 ring-1 ring-emerald-300/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                            <AnnotationSolid class="h-6 w-6" />
                        </div>
                        <h3 class="mt-3 text-2xl font-black tracking-tight text-white md:text-[2rem]">Questing System</h3>
                        <p class="mt-4 max-w-xl text-[15px] leading-7 text-gray-300">NPC-driven progression, optional paths, and meaningful rewards as you play.</p>
                        <div class="mt-6 flex flex-wrap gap-2">
                            <span class="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-200">NPCs</span>
                            <span class="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-200">Objectives</span>
                            <span class="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-200">Rewards</span>
                        </div>
                        <div class="mt-7">
                            <a href="https://wiki.pathofterraria.com/Towns" class="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/8 px-5 py-3 font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur transition hover:bg-white/12 focus:outline-none focus:ring-2 focus:ring-emerald-300">Learn more</a>
                        </div>
                    </div>
                </div>
            </div>

            <div class="group rounded-[2rem] bg-gradient-to-br from-sky-300/18 via-blue-200/8 to-indigo-300/12 p-[1px] shadow-[0_20px_80px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_100px_rgba(0,0,0,0.38)]">
                <div class="flex flex-col items-center gap-6 rounded-[calc(2rem-1px)] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.07),transparent_30%),linear-gradient(180deg,rgba(17,24,39,0.96),rgba(9,14,24,0.94))] p-5 ring-1 ring-white/10 backdrop-blur-sm md:flex-row md:gap-8 md:p-6">
                    <div class="w-full md:w-1/2">
                        <div class="relative aspect-video w-full overflow-hidden rounded-[1.4rem] border border-white/10 bg-gray-950 shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
                            <img src="/home/item-system.jpg" alt="Path of Terraria item system interface" class="h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.03]" />
                            <div class="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-300/18 via-transparent to-indigo-300/10"></div>
                            <div class="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/65 to-transparent"></div>
                            <div class="absolute left-4 top-4 rounded-full border border-white/12 bg-black/35 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-sky-100 backdrop-blur-sm">Loot Engine</div>
                        </div>
                    </div>
                    <div class="w-full md:w-1/2">
                        <div class="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-400/12 text-sky-200 ring-1 ring-sky-300/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                            <WandMagicSparklesSolid class="h-6 w-6" />
                        </div>
                        <h3 class="mt-3 text-2xl font-black tracking-tight text-white md:text-[2rem]">Redesigned Item System</h3>
                        <p class="mt-4 max-w-xl text-[15px] leading-7 text-gray-300">Loot with affixes. Combine affixes to craft powerful builds.</p>
                        <div class="mt-6 flex flex-wrap gap-2">
                            <span class="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-200">Affixes</span>
                            <span class="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-200">Crafting</span>
                            <span class="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-200">Uniques</span>
                        </div>
                        <div class="mt-7">
                            <a href="https://wiki.pathofterraria.com/Gear" class="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/8 px-5 py-3 font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur transition hover:bg-white/12 focus:outline-none focus:ring-2 focus:ring-sky-300">Learn more</a>
                        </div>
                    </div>
                </div>
            </div>

            <div class="group rounded-[2rem] bg-gradient-to-br from-fuchsia-300/18 via-rose-200/8 to-violet-300/12 p-[1px] shadow-[0_20px_80px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_100px_rgba(0,0,0,0.38)]">
                <div class="flex flex-col items-center gap-6 rounded-[calc(2rem-1px)] bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.07),transparent_30%),linear-gradient(180deg,rgba(17,24,39,0.96),rgba(9,14,24,0.94))] p-5 ring-1 ring-white/10 backdrop-blur-sm md:flex-row-reverse md:gap-8 md:p-6">
                    <div class="w-full md:w-1/2">
                        <div class="relative aspect-video w-full overflow-hidden rounded-[1.4rem] border border-white/10 bg-gray-950 shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
                            <img src="/home/domains.jpg" alt="Path of Terraria boss domain arena" class="h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.03]" />
                            <div class="pointer-events-none absolute inset-0 bg-gradient-to-br from-fuchsia-300/16 via-transparent to-violet-300/10"></div>
                            <div class="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/65 to-transparent"></div>
                            <div class="absolute left-4 top-4 rounded-full border border-white/12 bg-black/35 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-fuchsia-100 backdrop-blur-sm">Boss Hunts</div>
                        </div>
                    </div>
                    <div class="w-full md:w-1/2">
                        <div class="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-fuchsia-400/12 text-fuchsia-200 ring-1 ring-fuchsia-300/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                            <AdjustmentsVerticalSolid class="h-6 w-6" />
                        </div>
                        <h3 class="mt-3 text-2xl font-black tracking-tight text-white md:text-[2rem]">Boss Domains</h3>
                        <p class="mt-4 max-w-xl text-[15px] leading-7 text-gray-300">Face bespoke arenas and mechanics with unique loot tailored to ARPG play.</p>
                        <div class="mt-6 flex flex-wrap gap-2">
                            <span class="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-200">Arenas</span>
                            <span class="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-200">Mechanics</span>
                            <span class="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-200">Loot</span>
                        </div>
                        <div class="mt-7">
                            <a href="https://wiki.pathofterraria.com/en/Quests" class="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/8 px-5 py-3 font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur transition hover:bg-white/12 focus:outline-none focus:ring-2 focus:ring-fuchsia-300">Learn more</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>
