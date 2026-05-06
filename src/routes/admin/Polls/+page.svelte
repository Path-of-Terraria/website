<script lang="ts">
    import { onMount } from "svelte";
    import { Button, Card, Input, Label, P, Textarea, Toggle } from "flowbite-svelte";
    import { UserService } from "$lib/services/user-service";
    import { PollService, type IPoll, type ICreatePollQuestionRequest } from "$lib/services/poll-service";
    import { toast } from "$lib/toast";

    const userService = new UserService();
    const pollService = new PollService();

    let canManagePolls = $state(false);
    let checkingPermission = $state(true);

    let mode = $state<"simple" | "advanced">("simple");
    let title = $state("");
    let endDate = $state("");

    // Advanced editor state
    type DraftOption = { text: string };
    type DraftQuestion = { text: string; allowMultiple: boolean; options: DraftOption[] };
    let questions = $state<DraftQuestion[]>([]);

    let creating = $state(false);
    let createError = $state("");

    let polls = $state<IPoll[]>([]);
    let loadingPolls = $state(true);

    onMount(async () => {
        try {
            canManagePolls = await userService.hasRole("ManagePolls");
        } catch (e) {
            console.error("Failed to resolve poll permissions", e);
        } finally {
            checkingPermission = false;
        }
        await loadPolls();
    });

    async function loadPolls() {
        loadingPolls = true;
        try {
            polls = await pollService.getAll();
        } catch (e) {
            console.error("Failed to load polls", e);
        } finally {
            loadingPolls = false;
        }
    }

    function switchToAdvanced() {
        if (mode === "advanced") return;
        // Pre-fill from simple mode: one question with title text and Yes/No options
        questions = [
            {
                text: title.trim() || "",
                allowMultiple: false,
                options: [{ text: "Yes" }, { text: "No" }]
            }
        ];
        mode = "advanced";
    }

    function switchToSimple() {
        mode = "simple";
    }

    function addQuestion() {
        questions = [
            ...questions,
            { text: "", allowMultiple: false, options: [{ text: "" }, { text: "" }] }
        ];
    }

    function removeQuestion(index: number) {
        questions = questions.filter((_, i) => i !== index);
    }

    function addOption(qIndex: number) {
        questions[qIndex].options = [...questions[qIndex].options, { text: "" }];
    }

    function removeOption(qIndex: number, oIndex: number) {
        if (questions[qIndex].options.length <= 2) return;
        questions[qIndex].options = questions[qIndex].options.filter((_, i) => i !== oIndex);
    }

    function buildPayloadQuestions(): ICreatePollQuestionRequest[] {
        if (mode === "simple") {
            return [
                {
                    text: title.trim(),
                    allowMultiple: false,
                    options: [{ text: "Yes" }, { text: "No" }]
                }
            ];
        }
        return questions.map(q => ({
            text: q.text.trim(),
            allowMultiple: q.allowMultiple,
            options: q.options.map(o => ({ text: o.text.trim() }))
        }));
    }

    function validateAdvanced(): string | null {
        if (questions.length === 0) {
            return "Add at least one question.";
        }
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.text.trim()) return `Question ${i + 1} needs text.`;
            if (q.options.length < 2) return `Question ${i + 1} needs at least two options.`;
            for (let j = 0; j < q.options.length; j++) {
                if (!q.options[j].text.trim()) return `Question ${i + 1}, option ${j + 1} needs text.`;
            }
        }
        return null;
    }

    async function createPoll() {
        createError = "";
        if (!title.trim()) {
            createError = "Title is required.";
            return;
        }
        if (!endDate) {
            createError = "End date is required.";
            return;
        }
        const end = new Date(endDate);
        if (Number.isNaN(end.getTime()) || end <= new Date()) {
            createError = "End date must be in the future.";
            return;
        }
        if (mode === "advanced") {
            const err = validateAdvanced();
            if (err) {
                createError = err;
                return;
            }
        }

        creating = true;
        try {
            await pollService.create({
                title: title.trim(),
                endDate: end.toISOString(),
                questions: buildPayloadQuestions()
            });
            toast.push("Poll created.", { type: "success", duration: 2000 });
            title = "";
            endDate = "";
            questions = [];
            mode = "simple";
            await loadPolls();
        } catch (e) {
            console.error("Failed to create poll", e);
            createError = "Failed to create poll.";
        } finally {
            creating = false;
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

    let activePolls = $derived(polls.filter(p => p.isActive));
    let endedPolls = $derived(polls.filter(p => !p.isActive));
</script>

<div class="container mx-auto px-4 py-24 text-white">
    <div class="mx-auto mb-6 max-w-3xl">
        <a
            href="/admin"
            class="inline-flex items-center rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-sm font-semibold text-sky-200 transition hover:border-sky-300/40 hover:bg-sky-400/16 hover:text-white"
        >
            &larr; Back to Admin
        </a>
        <h1 class="mt-4 text-3xl font-black tracking-tight text-white">Polls</h1>
    </div>

    <Card size="xl" class="mx-auto mb-8 w-full !max-w-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.98),rgba(9,14,24,0.96))] p-4 text-white sm:p-6">
        <div class="mb-6 flex items-start justify-between gap-3">
            <div>
                <h2 class="text-2xl font-semibold text-white">Create a Poll</h2>
                <p class="mt-2 text-gray-300">
                    Simple polls have a single yes/no question. Advanced polls let you add multiple questions and multi-choice answers.
                </p>
            </div>
            <div class="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
                <button
                    type="button"
                    class={`rounded-full px-3 py-1 text-sm transition ${mode === "simple" ? "bg-sky-500 text-white" : "text-gray-300 hover:text-white"}`}
                    onclick={switchToSimple}
                >
                    Simple
                </button>
                <button
                    type="button"
                    class={`rounded-full px-3 py-1 text-sm transition ${mode === "advanced" ? "bg-sky-500 text-white" : "text-gray-300 hover:text-white"}`}
                    onclick={switchToAdvanced}
                >
                    Advanced
                </button>
            </div>
        </div>

        {#if checkingPermission}
            <P class="text-gray-300">Checking permissions...</P>
        {:else if !canManagePolls}
            <P class="text-red-300">You do not have permission to manage polls.</P>
        {:else}
            <div class="space-y-4">
                <div>
                    <Label for="poll-title" class="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-gray-300">
                        {mode === "simple" ? "Question" : "Title"}
                    </Label>
                    <Textarea
                        id="poll-title"
                        bind:value={title}
                        rows={2}
                        maxlength={255}
                        placeholder={mode === "simple" ? "Should we add seasonal leagues?" : "Roadmap feedback"}
                        class="w-full border-white/10 bg-white/8 text-white placeholder:text-gray-500"
                    />
                    <div class="mt-1 text-right text-xs text-gray-400">{title.length}/255</div>
                </div>

                <div>
                    <Label for="poll-end-date" class="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-gray-300">
                        End Date
                    </Label>
                    <Input
                        id="poll-end-date"
                        type="datetime-local"
                        bind:value={endDate}
                        class="w-full border-white/10 bg-white/8 text-white"
                    />
                </div>

                {#if mode === "advanced"}
                    <div class="space-y-4 border-t border-white/10 pt-4">
                        <div class="flex items-center justify-between">
                            <h3 class="text-lg font-semibold text-white">Questions</h3>
                            <Button
                                size="sm"
                                class="border-sky-400/20 bg-sky-500 text-white hover:bg-sky-400"
                                onclick={addQuestion}
                            >
                                + Add Question
                            </Button>
                        </div>

                        {#if questions.length === 0}
                            <P class="text-gray-400">No questions yet. Click "Add Question" to start.</P>
                        {/if}

                        {#each questions as question, qIndex (qIndex)}
                            <div class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                                <div class="mb-3 flex items-start justify-between gap-3">
                                    <div class="flex-1">
                                        <Label class="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-300">
                                            Question {qIndex + 1}
                                        </Label>
                                        <Textarea
                                            bind:value={question.text}
                                            rows={2}
                                            maxlength={500}
                                            placeholder="What do you want to see next?"
                                            class="w-full border-white/10 bg-white/8 text-white placeholder:text-gray-500"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        class="ml-2 mt-6 text-rose-300 hover:text-rose-100"
                                        onclick={() => removeQuestion(qIndex)}
                                        title="Remove question"
                                    >
                                        &times;
                                    </button>
                                </div>

                                <div class="mb-3 flex items-center gap-2">
                                    <Toggle bind:checked={question.allowMultiple} />
                                    <span class="text-sm text-gray-200">Allow multiple answers</span>
                                </div>

                                <Label class="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-300">Options</Label>
                                <div class="space-y-2">
                                    {#each question.options as option, oIndex (oIndex)}
                                        <div class="flex items-center gap-2">
                                            <Input
                                                bind:value={option.text}
                                                maxlength={255}
                                                placeholder={`Option ${oIndex + 1}`}
                                                class="flex-1 border-white/10 bg-white/8 text-white"
                                            />
                                            {#if question.options.length > 2}
                                                <button
                                                    type="button"
                                                    class="text-rose-300 hover:text-rose-100"
                                                    onclick={() => removeOption(qIndex, oIndex)}
                                                    title="Remove option"
                                                >
                                                    &times;
                                                </button>
                                            {/if}
                                        </div>
                                    {/each}
                                </div>
                                <Button
                                    size="xs"
                                    class="mt-2 border-white/10 bg-white/[0.06] text-gray-100 hover:bg-white/[0.1]"
                                    onclick={() => addOption(qIndex)}
                                >
                                    + Add Option
                                </Button>
                            </div>
                        {/each}
                    </div>
                {/if}

                <div class="flex items-center gap-3">
                    <Button
                        class="border-emerald-400/20 bg-emerald-500 text-white hover:bg-emerald-400 disabled:bg-white/8 disabled:text-gray-400"
                        disabled={creating || !title.trim() || !endDate}
                        onclick={createPoll}
                    >
                        {creating ? "Creating..." : "Create Poll"}
                    </Button>
                </div>
                {#if createError}
                    <P class="text-red-300">{createError}</P>
                {/if}
            </div>
        {/if}
    </Card>

    <div class="mx-auto max-w-3xl">
        <h2 class="mb-4 text-2xl font-semibold text-white">Active Polls</h2>
        {#if loadingPolls}
            <P class="text-gray-300">Loading polls...</P>
        {:else if activePolls.length === 0}
            <P class="text-gray-300">No active polls.</P>
        {:else}
            <div class="space-y-4">
                {#each activePolls as poll (poll.id)}
                    <a
                        href={`/admin/Polls/${poll.id}`}
                        class="block rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.98),rgba(9,14,24,0.96))] p-4 text-white transition hover:border-sky-300/40 hover:bg-white/[0.04]"
                    >
                        <div class="mb-3 flex items-start justify-between gap-3">
                            <div>
                                <h3 class="text-lg font-semibold text-white">{poll.title}</h3>
                                <p class="mt-1 text-xs uppercase tracking-[0.18em] text-gray-400">
                                    Ends {formatDate(poll.endDate)}
                                    {#if poll.createdByProfileName}
                                        &middot; by {poll.createdByProfileName}
                                    {/if}
                                    &middot; {poll.questions.length} {poll.questions.length === 1 ? "question" : "questions"}
                                </p>
                            </div>
                            <span class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
                                {poll.totalAnswers} {poll.totalAnswers === 1 ? "response" : "responses"}
                            </span>
                        </div>
                    </a>
                {/each}
            </div>
        {/if}

        {#if endedPolls.length > 0}
            <h2 class="mb-4 mt-10 text-2xl font-semibold text-white">Ended Polls</h2>
            <div class="space-y-4">
                {#each endedPolls as poll (poll.id)}
                    <a
                        href={`/admin/Polls/${poll.id}`}
                        class="block rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.98),rgba(9,14,24,0.96))] p-4 text-white transition hover:border-sky-300/40 hover:bg-white/[0.04]"
                    >
                        <div class="mb-2">
                            <h3 class="text-lg font-semibold text-white">{poll.title}</h3>
                            <p class="mt-1 text-xs uppercase tracking-[0.18em] text-gray-400">
                                Ended {formatDate(poll.endDate)}
                                &middot; {poll.totalAnswers} {poll.totalAnswers === 1 ? "response" : "responses"}
                            </p>
                        </div>
                    </a>
                {/each}
            </div>
        {/if}
    </div>
</div>
