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

<div class="flex items-center justify-center py-16 px-4">
    <div class="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8 text-center">

        <!-- Success Icon -->
        <div class="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-green-100">
            <svg class="w-8 h-8 text-green-600"
                 xmlns="http://www.w3.org/2000/svg"
                 viewBox="0 0 24 24"
                 stroke="currentColor"
            >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
        </div>

        <!-- Title -->
        <h1 class="mb-4 text-2xl font-bold text-gray-900">
            Thank You for Your Support!
        </h1>

        <!-- Message -->
        <p class="mb-6 text-gray-600">
            Your order has been confirmed.
            A receipt has been sent to
            <span class="font-medium">
                {currentUser?.email}
            </span>
        </p>
    </div>
</div>
