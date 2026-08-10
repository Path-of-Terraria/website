<script lang="ts">
    import {type IUser, user} from "$lib/stores/user-store";
    import {onDestroy} from "svelte";

    let currentUser: IUser | null = $state(null);

    const unsubscribe = user.subscribe(value => {
        currentUser = value;
    });

    // Cleanup on component destruction
    onDestroy(() => {
        unsubscribe();
    });
</script>

<div class="flex items-center justify-center px-4 py-24">
    <div class="w-full max-w-lg rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(130,216,255,0.09),transparent_32%),linear-gradient(180deg,rgba(17,28,41,0.96),rgba(9,15,25,0.94))] p-8 text-center text-white shadow-[0_24px_70px_rgba(0,0,0,0.32)]">

        <!-- Success Icon -->
        <div class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-300/25 bg-emerald-300/12">
            <svg class="h-8 w-8 text-emerald-300"
                 xmlns="http://www.w3.org/2000/svg"
                 viewBox="0 0 24 24"
                 stroke="currentColor"
            >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
        </div>

        <!-- Title -->
        <h1 class="mb-4 text-2xl font-bold text-white">
            Thank You for Your Support!
        </h1>

        <!-- Message -->
        <p class="mb-6 text-gray-300">
            Your order has been confirmed.
            A receipt has been sent to
            <span class="font-medium text-white">
                {currentUser?.email}
            </span>
        </p>
    </div>
</div>
