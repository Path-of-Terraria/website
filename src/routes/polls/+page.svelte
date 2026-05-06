<script lang="ts">
    import { onMount } from "svelte";
    import { Button, Card, Checkbox, Label, P, Radio, Textarea } from "flowbite-svelte";
    import { PollService, type IPoll } from "$lib/services/poll-service";
    import { user } from "$lib/stores/user-store";
    import { toast } from "$lib/toast";

    const pollService = new PollService();

    let polls = $state<IPoll[]>([]);
    let loading = $state(true);
    let currentUser = $state<unknown>(null);
    let comments = $state<Record<string, string>>({});

    function sortBucket(p: IPoll) {
        if (p.isActive && !p.hasAnswered) return 0;
        if (p.isActive) return 1;
        return 2;
    }

    let sortedPolls = $derived(
        [...polls].sort((a, b) => {
            const bucket = sortBucket(a) - sortBucket(b);
            if (bucket !== 0) return bucket;
            return new Date(b.createdDate ?? 0).getTime() - new Date(a.createdDate ?? 0).getTime();
        })
    );
    // selections[pollId][questionId] = optionId (single) | optionId[] (multi)
    let selections = $state<Record<string, Record<string, string | string[]>>>({});
    let submitting = $state<Record<string, boolean>>({});

    user.subscribe(value => {
        currentUser = value;
    });

    onMount(async () => {
        await loadPolls();
    });

    async function loadPolls() {
        loading = true;
        try {
            polls = await pollService.getAll();
            for (const poll of polls) {
                if (!selections[poll.id]) {
                    selections[poll.id] = {};
                    for (const q of poll.questions) {
                        selections[poll.id][q.id] = q.allowMultiple ? [] : "";
                    }
                }
            }
        } catch (e) {
            console.error("Failed to load polls", e);
        } finally {
            loading = false;
        }
    }

    function toggleMulti(pollId: string, questionId: string, optionId: string) {
        const current = (selections[pollId][questionId] as string[]) ?? [];
        if (current.includes(optionId)) {
            selections[pollId][questionId] = current.filter(id => id !== optionId);
        } else {
            selections[pollId][questionId] = [...current, optionId];
        }
    }

    function buildSelectedIds(poll: IPoll): string[] {
        const result: string[] = [];
        for (const q of poll.questions) {
            const value = selections[poll.id]?.[q.id];
            if (q.allowMultiple) {
                result.push(...(value as string[] ?? []));
            } else if (typeof value === "string" && value) {
                result.push(value);
            }
        }
        return result;
    }

    function isReadyToSubmit(poll: IPoll): boolean {
        for (const q of poll.questions) {
            const value = selections[poll.id]?.[q.id];
            if (q.allowMultiple) {
                if (!value || (value as string[]).length === 0) return false;
            } else {
                if (!value) return false;
            }
        }
        return true;
    }

    async function submit(poll: IPoll) {
        if (!currentUser) {
            toast.push("Please sign in to vote.");
            return;
        }
        if (!isReadyToSubmit(poll)) {
            toast.push("Answer every question before submitting.");
            return;
        }
        submitting[poll.id] = true;
        try {
            const updated = await pollService.submitAnswer(poll.id, {
                selectedOptionIds: buildSelectedIds(poll),
                comment: comments[poll.id]?.trim() || null
            });
            if (updated) {
                polls = polls.map(p => (p.id === poll.id ? updated : p));
                toast.push("Vote recorded.", { type: "success", duration: 2000 });
            }
        } catch (e) {
            console.error("Failed to submit answer", e);
        } finally {
            submitting[poll.id] = false;
        }
    }

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
</script>

<div class="container mx-auto px-4 py-24 text-white">
    <h1 class="mb-4 text-3xl font-black tracking-tight text-white">Community Polls</h1>
    <p class="mb-6 text-gray-300">Vote on what's next for Path of Terraria.</p>

    {#if !currentUser}
        <div class="mb-6 flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-amber-100">
            <svg class="mt-0.5 h-5 w-5 shrink-0 text-amber-300" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" />
            </svg>
            <div class="text-sm">
                <p class="font-semibold text-amber-50">You're not signed in</p>
                <p class="mt-1 text-amber-100/90">Sign in before answering. Votes from signed-out visitors won't be recorded.</p>
            </div>
        </div>
    {/if}

    {#if loading}
        <P class="text-gray-300">Loading polls...</P>
    {:else if polls.length === 0}
        <Card size="xl" class="w-full !max-w-none border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.98),rgba(9,14,24,0.96))] p-6 text-white">
            <P class="text-gray-300">There are no polls right now. Check back soon.</P>
        </Card>
    {:else}
        <div class="space-y-6">
            {#each sortedPolls as poll (poll.id)}
                {@const showResults = poll.hasAnswered || !poll.isActive}
                <Card size="xl" class="w-full !max-w-none border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.98),rgba(9,14,24,0.96))] p-4 text-white sm:p-6">
                    <div class="mb-4 flex items-start justify-between gap-4">
                        <div>
                            <h2 class="text-xl font-semibold text-white">{poll.title}</h2>
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

                    <div class="space-y-6">
                        {#each poll.questions as question (question.id)}
                            <div>
                                <div class="mb-2 flex items-center gap-2">
                                    <h3 class="text-base font-semibold text-white">{question.text}</h3>
                                    <span class="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-gray-400">
                                        {question.allowMultiple ? "Multi-select" : "Single"}
                                    </span>
                                </div>

                                {#if showResults}
                                    <div class="space-y-2">
                                        {#each question.options as option (option.id)}
                                            {@const isMine = poll.mySelectedOptionIds.includes(option.id)}
                                            <div>
                                                <div class="mb-1 flex items-center justify-between text-sm">
                                                    <span class="text-gray-100">
                                                        {option.text}
                                                        {#if isMine}
                                                            <span class="ml-1 text-xs text-emerald-300">&middot; your pick</span>
                                                        {/if}
                                                    </span>
                                                    <span class="text-gray-300">{option.voteCount} ({pct(option.voteCount, poll.totalAnswers)}%)</span>
                                                </div>
                                                <div class="h-2 overflow-hidden rounded-full bg-white/10">
                                                    <div class="h-full {isMine ? 'bg-emerald-400' : 'bg-sky-400'}" style="width: {pct(option.voteCount, poll.totalAnswers)}%"></div>
                                                </div>
                                            </div>
                                        {/each}
                                    </div>
                                {:else}
                                    <div class="space-y-2">
                                        {#each question.options as option (option.id)}
                                            <label class="flex cursor-pointer items-center gap-2 rounded-md border border-white/10 bg-white/5 p-2 hover:border-sky-300/40 hover:bg-white/[0.08]">
                                                {#if question.allowMultiple}
                                                    <Checkbox
                                                        checked={(selections[poll.id]?.[question.id] as string[] ?? []).includes(option.id)}
                                                        onchange={() => toggleMulti(poll.id, question.id, option.id)}
                                                        class="border-white/20 bg-white/8 text-emerald-400 focus:ring-emerald-400/50"
                                                    />
                                                {:else}
                                                    <Radio
                                                        name={`${poll.id}-${question.id}`}
                                                        bind:group={selections[poll.id][question.id]}
                                                        value={option.id}
                                                        class="border-white/20 bg-white/8 text-emerald-400 focus:ring-emerald-400/50"
                                                    />
                                                {/if}
                                                <span class="text-gray-100">{option.text}</span>
                                            </label>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        {/each}

                        {#if showResults}
                            {#if poll.hasAnswered && poll.myComment}
                                <div class="rounded-md border border-white/10 bg-white/5 p-3 text-sm text-gray-200">
                                    <span class="text-xs uppercase tracking-[0.18em] text-gray-400">Your comment</span>
                                    <p class="mt-1 whitespace-pre-wrap">{poll.myComment}</p>
                                </div>
                            {/if}
                            {#if poll.hasAnswered}
                                <p class="text-xs text-gray-400">Your response is locked in and cannot be changed.</p>
                            {/if}
                        {:else}
                            <div>
                                <Label for={`comment-${poll.id}`} class="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-gray-300">
                                    Comment (optional)
                                </Label>
                                <Textarea
                                    id={`comment-${poll.id}`}
                                    bind:value={comments[poll.id]}
                                    rows={2}
                                    maxlength={2000}
                                    placeholder="Add an optional comment with your vote"
                                    class="w-full border-white/10 bg-white/8 text-white placeholder:text-gray-500"
                                />
                            </div>
                            <div class="flex items-center gap-3">
                                <Button
                                    class="border-emerald-400/20 bg-emerald-500 text-white hover:bg-emerald-400 disabled:bg-white/8 disabled:text-gray-400"
                                    disabled={!currentUser || submitting[poll.id] || !isReadyToSubmit(poll)}
                                    onclick={() => submit(poll)}
                                >
                                    {submitting[poll.id] ? "Submitting..." : "Submit Vote"}
                                </Button>
                                {#if !currentUser}
                                    <span class="text-sm text-gray-300">Sign in to vote.</span>
                                {/if}
                            </div>
                        {/if}
                    </div>
                </Card>
            {/each}
        </div>
    {/if}
</div>
