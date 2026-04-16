<script lang="ts">
    import type { PageData } from './$types';
    import { Modal, Button } from "flowbite-svelte";
    import { type IPlayer, PlayerService } from "$lib/services/player-service";
    import { UserService } from "$lib/services/user-service";
    import { toast } from "$lib/toast";

    let userService = new UserService();
    let playerService = new PlayerService();

    let { data }: { data: PageData } = $props();

    let playerPromise = $state<Promise<IPlayer[]>>(getPlayer());

    async function getPlayer() {
        return await userService.getPlayers(data.slug);
    }

    let deleteModalOpen = $state(false);
    let playerNameToDelete = $state("");
    let playerIdToDelete = $state("");

    function openDeleteModal(playerName: string, playerId: string) {
        playerNameToDelete = playerName;
        playerIdToDelete = playerId;
        deleteModalOpen = true;
    }

    async function confirmDelete() {
        try {
            await playerService.deletePlayer(playerIdToDelete);
            playerPromise = getPlayer();
            deleteModalOpen = false;
            toast.push("Player deleted successfully");
        } catch (error) {
            console.error("Error deleting player:", error);
            alert("Failed to delete player. Please try again.");
        }
    }
</script>

<div class="relative min-h-screen overflow-hidden text-white">
    <div class="container mx-auto px-4 py-24">
        <div class="mb-8">
            <h1 class="text-3xl font-black tracking-tight text-white">{data.slug}'s Characters</h1>
        </div>

        <div class="rounded-[2rem] bg-gradient-to-br from-amber-300/14 via-emerald-300/8 to-cyan-300/12 p-[1px] shadow-[0_20px_90px_rgba(0,0,0,0.28)]">
            <div class="rounded-[calc(2rem-1px)] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.07),transparent_30%),linear-gradient(180deg,rgba(17,24,39,0.96),rgba(9,14,24,0.94))] p-4 ring-1 ring-white/10 backdrop-blur-sm md:p-5">
                <div class="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0a1016] shadow-[0_18px_50px_rgba(0,0,0,0.3)]">
                    <div class="hidden grid-cols-[minmax(0,2.1fr)_0.7fr_0.8fr_0.8fr_0.8fr_1fr] gap-4 border-b border-white/10 bg-white/[0.04] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-300 md:grid">
                        <div>Character Name</div>
                        <div>Level</div>
                        <div>Strength</div>
                        <div>Dexterity</div>
                        <div>Intelligence</div>
                        <div>Actions</div>
                    </div>

                    {#await playerPromise}
                        <div class="divide-y divide-white/6 px-3 md:px-4">
                            {#each Array(4) as _}
                                <div class="animate-pulse py-3">
                                    <div class="grid gap-3 md:grid-cols-[minmax(0,2.1fr)_0.7fr_0.8fr_0.8fr_0.8fr_1fr] md:items-center md:gap-4">
                                        <div class="h-4 w-40 rounded bg-white/10"></div>
                                        <div class="h-4 w-12 rounded bg-white/10"></div>
                                        <div class="h-4 w-14 rounded bg-white/10"></div>
                                        <div class="h-4 w-14 rounded bg-white/10"></div>
                                        <div class="h-4 w-14 rounded bg-white/10"></div>
                                        <div class="h-8 w-20 rounded bg-white/10"></div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {:then players}
                        {#if players.length === 0}
                            <div class="px-5 py-14 text-center">
                                <div class="text-lg font-semibold text-white">No character data found</div>
                                <p class="mt-2 text-sm text-gray-400">This profile does not have any characters yet.</p>
                            </div>
                        {:else}
                            <div class="divide-y divide-white/6 px-3 md:px-4">
                                {#each players as player, index}
                                    <div class="py-3 transition-colors duration-200 hover:bg-white/[0.025]">
                                        <div class="grid gap-3 md:grid-cols-[minmax(0,2.1fr)_0.7fr_0.8fr_0.8fr_0.8fr_1fr] md:items-center md:gap-4">
                                            <div class="min-w-0">
                                                <div class="flex items-start justify-between gap-3 md:block">
                                                    <div class="flex min-w-0 items-center gap-3">
                                                        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/6 text-sm font-black text-white md:h-10 md:w-10">
                                                            {index + 1}
                                                        </div>
                                                        <div class="min-w-0">
                                                            <span class="truncate text-sm font-semibold text-white md:text-base">
                                                                {player.name}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div class="md:hidden">
                                                        <div class="inline-flex rounded-full border border-emerald-300/18 bg-emerald-300/10 px-2.5 py-1 text-xs font-semibold text-emerald-100">
                                                            Lv {player.stats.level}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold uppercase tracking-[0.18em] md:hidden">
                                                    <div class="flex items-baseline gap-1.5 text-amber-100">
                                                        <span class="text-amber-200/70">Str</span>
                                                        <span>{player.stats.strength}</span>
                                                    </div>
                                                    <div class="flex items-baseline gap-1.5 text-sky-100">
                                                        <span class="text-sky-200/70">Dex</span>
                                                        <span>{player.stats.dexterity}</span>
                                                    </div>
                                                    <div class="flex items-baseline gap-1.5 text-fuchsia-100">
                                                        <span class="text-fuchsia-200/70">Int</span>
                                                        <span>{player.stats.intelligence}</span>
                                                    </div>
                                                </div>
                                                <div class="mt-3 md:hidden">
                                                    <Button class="cursor-pointer border-red-400/20 bg-red-400/12 text-red-100 hover:bg-red-400/18" size="sm" onclick={() => openDeleteModal(player.name, player.id)}>
                                                        Delete
                                                    </Button>
                                                </div>
                                            </div>

                                            <div class="hidden md:block">
                                                <div class="inline-flex rounded-full border border-emerald-300/18 bg-emerald-300/10 px-3 py-1 text-sm font-semibold text-emerald-100">
                                                    {player.stats.level}
                                                </div>
                                            </div>

                                            <div class="hidden text-lg font-bold text-amber-100 md:block">{player.stats.strength}</div>
                                            <div class="hidden text-lg font-bold text-sky-100 md:block">{player.stats.dexterity}</div>
                                            <div class="hidden text-lg font-bold text-fuchsia-100 md:block">{player.stats.intelligence}</div>

                                            <div class="hidden md:block">
                                                <Button class="cursor-pointer border-red-400/20 bg-red-400/12 text-red-100 hover:bg-red-400/18" size="sm" onclick={() => openDeleteModal(player.name, player.id)}>
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    {:catch}
                        <div class="px-5 py-14 text-center">
                            <div class="text-lg font-semibold text-white">Failed to load characters</div>
                            <p class="mt-2 text-sm text-gray-400">There was a problem loading this player's character data.</p>
                        </div>
                    {/await}
                </div>
            </div>
        </div>
    </div>
</div>

<Modal title="Confirm Deletion" bind:open={deleteModalOpen} autoclose>
    <p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
        Are you sure you want to delete {playerNameToDelete}? This action cannot be undone.
    </p>

    {#snippet footer()}
        <div class="flex w-full justify-end">
            <Button color="alternative" onclick={() => deleteModalOpen = false} class="mr-6">
                Cancel
            </Button>
            <Button color="red" onclick={confirmDelete}>
                Delete
            </Button>
        </div>
    {/snippet}
</Modal>
