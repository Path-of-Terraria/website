<script lang="ts">
    import { Card, Button } from 'flowbite-svelte';
    import { ArrowRightOutline } from 'flowbite-svelte-icons';
    export let title: string = "title";
    export let description: string = "description";
    export let link: string = "#";
</script>

<Card>
    <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        {title}
    </h5>
    <p class="mb-3 font-normal text-gray-700 dark:text-gray-400 leading-tight">
        {description}
    </p>
    {#if link}
        <a href={link} target="_blank">
            <Button class="w-fit">
                Read more <ArrowRightOutline class="w-6 h-6 ms-2 text-white" />
            </Button>
        </a>
    {/if}
</Card>