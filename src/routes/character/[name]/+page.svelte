<script lang="ts">
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();
</script>

<svelte:head>
    <title>{data.name} | Path of Terraria</title>
    <meta name="description" content="Character links now require a profile name." />
</svelte:head>

<div class="relative -mt-20 min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(151,255,120,0.10),transparent_22%),linear-gradient(180deg,#090c12_0%,#111827_30%,#10191c_62%,#10191c_100%)] pt-20 text-white">
    <section class="container mx-auto px-4 py-24">
        <div class="mx-auto max-w-2xl rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(130,216,255,0.09),transparent_32%),linear-gradient(180deg,rgba(17,28,41,0.96),rgba(9,15,25,0.94))] p-8 text-center shadow-[0_20px_90px_rgba(0,0,0,0.28)]">
            <h1 class="text-2xl font-black tracking-tight text-white">Character Link Needs a Profile</h1>
            <p class="mt-3 text-sm text-gray-300">
                Character names are no longer unique across all users, so this page now requires the owner's profile name too.
            </p>
            <p class="mt-2 text-sm text-gray-400">
                The requested character was "{data.name}".
            </p>
            <a href="/leaderboards" class="mt-6 inline-block text-sm font-semibold text-emerald-400 hover:underline">
                Back to leaderboards
            </a>
        </div>
    </section>
</div>
