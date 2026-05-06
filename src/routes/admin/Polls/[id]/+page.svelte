<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import { Card, P } from "flowbite-svelte";
    import { UserService } from "$lib/services/user-service";
    import { PollService, type IPoll, type IPollAnswerDetail } from "$lib/services/poll-service";

    const userService = new UserService();
    const pollService = new PollService();

    let canManagePolls = $state(false);
    let checkingPermission = $state(true);

    let poll = $state<IPoll | null>(null);
    let answers = $state<IPollAnswerDetail[]>([]);
    let loading = $state(true);
    let error = $state("");

    let pollId = $derived(page.params.id ?? "");

    let optionLookup = $derived.by(() => {
        const map: Record<string, { questionText: string; optionText: string; allowMultiple: boolean }> = {};
        if (!poll) return map;
        for (const q of poll.questions) {
            for (const o of q.options) {
                map[o.id] = { questionText: q.text, optionText: o.text, allowMultiple: q.allowMultiple };
            }
        }
        return map;
    });

    onMount(async () => {
        try {
            canManagePolls = await userService.hasRole("ManagePolls");
        } catch (e) {
            console.error("Failed to resolve poll permissions", e);
        } finally {
            checkingPermission = false;
        }

        if (!canManagePolls || !pollId) {
            loading = false;
            return;
        }

        try {
            const [pollResponse, answersResponse] = await Promise.all([
                pollService.getById(pollId),
                pollService.getAnswers(pollId)
            ]);
            poll = pollResponse;
            answers = answersResponse;
            if (!poll) {
                error = "Poll not found.";
            }
        } catch (e) {
            console.error("Failed to load poll detail", e);
            error = "Failed to load poll.";
        } finally {
            loading = false;
        }
    });

    function pct(n: number, total: number) {
        if (total <= 0) return 0;
        return Math.round((n / total) * 100);
    }

    function formatDate(value: string | null) {
        if (!value) return "";
        try {
            return new Date(value).toLocaleString();
        } catch {
            return value;
        }
    }

    function selectionsByQuestion(answer: IPollAnswerDetail) {
        if (!poll) return [] as { questionId: string; questionText: string; optionTexts: string[] }[];
        return poll.questions.map(q => {
            const optionTexts = q.options
                .filter(o => answer.selectedOptionIds.includes(o.id))
                .map(o => o.text);
            return { questionId: q.id, questionText: q.text, optionTexts };
        });
    }
</script>

<div class="container mx-auto px-4 py-24 text-white">
    <div class="mx-auto mb-6 max-w-3xl">
        <a
            href="/admin/Polls"
            class="inline-flex items-center rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-sm font-semibold text-sky-200 transition hover:border-sky-300/40 hover:bg-sky-400/16 hover:text-white"
        >
            &larr; Back to Polls
        </a>
        <h1 class="mt-4 text-3xl font-black tracking-tight text-white">Poll Detail</h1>
    </div>

    <div class="mx-auto max-w-3xl">
        {#if checkingPermission || loading}
            <P class="text-gray-300">Loading...</P>
        {:else if !canManagePolls}
            <P class="text-red-300">You do not have permission to view this page.</P>
        {:else if error}
            <P class="text-red-300">{error}</P>
        {:else if poll}
            <Card size="xl" class="mb-6 w-full !max-w-none border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.98),rgba(9,14,24,0.96))] p-4 text-white sm:p-6">
                <div class="mb-4 flex items-start justify-between gap-3">
                    <div>
                        <h2 class="text-2xl font-semibold text-white">{poll.title}</h2>
                        <p class="mt-1 text-xs uppercase tracking-[0.18em] text-gray-400">
                            {poll.isActive ? "Ends" : "Ended"} {formatDate(poll.endDate)}
                            {#if poll.createdByProfileName}
                                &middot; by {poll.createdByProfileName}
                            {/if}
                        </p>
                    </div>
                    <span class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
                        {poll.totalAnswers} {poll.totalAnswers === 1 ? "response" : "responses"}
                    </span>
                </div>

                <div class="space-y-5">
                    {#each poll.questions as question (question.id)}
                        <div>
                            <div class="mb-2 flex items-center gap-2">
                                <h3 class="text-base font-semibold text-white">{question.text}</h3>
                                <span class="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-gray-400">
                                    {question.allowMultiple ? "Multi-select" : "Single"}
                                </span>
                            </div>
                            <div class="space-y-2">
                                {#each question.options as option (option.id)}
                                    <div>
                                        <div class="mb-1 flex items-center justify-between text-sm">
                                            <span class="text-gray-100">{option.text}</span>
                                            <span class="text-gray-300">{option.voteCount} ({pct(option.voteCount, poll.totalAnswers)}%)</span>
                                        </div>
                                        <div class="h-2 overflow-hidden rounded-full bg-white/10">
                                            <div class="h-full bg-sky-400" style="width: {pct(option.voteCount, poll.totalAnswers)}%"></div>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/each}
                </div>
            </Card>

            <h3 class="mb-3 text-xl font-semibold text-white">Voters</h3>
            {#if answers.length === 0}
                <P class="text-gray-300">No one has voted yet.</P>
            {:else}
                <div class="space-y-3">
                    {#each answers as answer (answer.answerId)}
                        <Card size="xl" class="w-full !max-w-none border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.98),rgba(9,14,24,0.96))] p-4 text-white">
                            <div class="flex items-start justify-between gap-3">
                                <div>
                                    <a
                                        href={`/admin/Users?search=${encodeURIComponent(answer.profileName)}`}
                                        class="text-base font-semibold text-sky-200 hover:text-white hover:underline"
                                    >
                                        {answer.profileName || "Unknown user"}
                                    </a>
                                    {#if answer.createdDate}
                                        <p class="mt-1 text-xs uppercase tracking-[0.18em] text-gray-400">
                                            Voted {formatDate(answer.createdDate)}
                                        </p>
                                    {/if}
                                </div>
                            </div>

                            <div class="mt-3 space-y-2 text-sm">
                                {#each selectionsByQuestion(answer) as group (group.questionId)}
                                    <div class="rounded-md border border-white/10 bg-white/5 p-2">
                                        <div class="text-xs uppercase tracking-[0.18em] text-gray-400">{group.questionText}</div>
                                        <div class="mt-1 flex flex-wrap gap-1">
                                            {#each group.optionTexts as text}
                                                <span class="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-200">{text}</span>
                                            {:else}
                                                <span class="text-xs text-gray-400">No selection</span>
                                            {/each}
                                        </div>
                                    </div>
                                {/each}
                            </div>

                            {#if answer.comment}
                                <div class="mt-3 rounded-md border border-white/10 bg-white/5 p-3 text-sm text-gray-200">
                                    <p class="whitespace-pre-wrap">{answer.comment}</p>
                                </div>
                            {/if}
                        </Card>
                    {/each}
                </div>
            {/if}
        {/if}
    </div>
</div>
