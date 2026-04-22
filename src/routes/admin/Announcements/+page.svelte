<script lang="ts">
    import { onMount } from "svelte";
    import { Button, Card, Label, P, Textarea } from "flowbite-svelte";
    import { UserService } from "$lib/services/user-service";
    import { AnnouncementService } from "$lib/services/announcement-service";
    import { toast } from "$lib/toast";

    const userService = new UserService();
    const announcementService = new AnnouncementService();

    let canSendAnnouncements = $state(false);
    let checkingPermission = $state(true);
    let message = $state("");
    let sending = $state(false);
    let success = $state(false);
    let error = $state("");

    onMount(async () => {
        try {
            canSendAnnouncements = await userService.hasRole("SendAnnouncements");
        } catch (e) {
            console.error("Failed to resolve announcement permissions", e);
            error = "Failed to verify permissions.";
        } finally {
            checkingPermission = false;
        }
    });

    async function sendAnnouncement() {
        if (!message.trim()) {
            error = "Announcement message is required.";
            return;
        }

        error = "";
        success = false;
        sending = true;

        try {
            await announcementService.sendAnnouncement({
                message: message.trim()
            });

            success = true;
            toast.push("Announcement sent.", { type: "success", duration: 2500 });
            message = "";
        } catch (e) {
            console.error("Failed to send announcement", e);
            error = "Failed to send announcement.";
        } finally {
            sending = false;
        }
    }
</script>

<div class="container mx-auto px-4 py-24 text-white">
    <div class="mx-auto mb-6 max-w-3xl">
        <a
            href="/admin"
            class="inline-flex items-center rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-sm font-semibold text-sky-200 transition hover:border-sky-300/40 hover:bg-sky-400/16 hover:text-white"
        >
            &larr; Back to Admin
        </a>
        <h1 class="mt-4 text-3xl font-black tracking-tight text-white">Announcements</h1>
    </div>

    <Card class="mx-auto max-w-3xl border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_30%),linear-gradient(180deg,rgba(17,24,39,0.98),rgba(9,14,24,0.96))] p-4 text-white shadow-[0_30px_90px_rgba(0,0,0,0.38)] sm:p-6 md:p-8">
        <div class="mb-6">
            <h2 class="text-2xl font-semibold text-white">Broadcast Announcement</h2>
            <p class="mt-2 text-gray-300">
                This sends a highlighted message to every connected Path of Terraria Online client through the mod socket.
            </p>
        </div>

        {#if checkingPermission}
            <P class="text-gray-300">Checking permissions...</P>
        {:else if !canSendAnnouncements}
            <P color="red" class="text-red-300">You do not have permission to send announcements.</P>
        {:else}
            <div class="space-y-4">
                <div>
                    <Label for="announcement-message" class="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-gray-300">
                        Announcement Message
                    </Label>
                    <Textarea
                        id="announcement-message"
                        bind:value={message}
                        rows={6}
                        maxlength={500}
                        placeholder="Server restart in 10 minutes. Finish your run and head to town."
                        class="w-full border-white/10 bg-white/8 text-white placeholder:text-gray-500"
                    />
                    <div class="mt-2 flex items-center justify-between text-sm text-gray-400">
                        <span>The mod displays this in the normal chat window with an announcement tag.</span>
                        <span>{message.length}/500</span>
                    </div>
                </div>

                <div class="flex items-center gap-3">
                    <Button
                        class="border-rose-400/20 bg-rose-500 text-white hover:bg-rose-400 disabled:border-white/10 disabled:bg-white/8 disabled:text-gray-400"
                        disabled={sending || !message.trim()}
                        onclick={sendAnnouncement}
                    >
                        {sending ? "Sending..." : "Send Announcement"}
                    </Button>

                    {#if success}
                        <P class="text-emerald-300">Announcement sent successfully.</P>
                    {/if}
                </div>

                {#if error}
                    <P color="red" class="text-red-300">{error}</P>
                {/if}
            </div>
        {/if}
    </Card>
</div>
