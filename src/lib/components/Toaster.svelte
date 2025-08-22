<script lang="ts">
  import { Toast } from 'flowbite-svelte';
  import { toasts, type ToastItem } from '$lib/toast';
  
  let items: ToastItem[] = $state([]);
  
  $effect(() => {
    const unsubscribe = toasts.subscribe((v) => (items = v));
    return () => unsubscribe();
  });
</script>

<div class="fixed top-24 right-5 z-50 flex flex-col gap-2 w-80 max-w-[90vw]">
  {#each items as t (t.id)}
    <Toast class="shadow-lg">
      <div class="text-sm font-normal">
        {t.message}
      </div>
    </Toast>
  {/each}
</div>
