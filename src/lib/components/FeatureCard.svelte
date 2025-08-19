<script lang="ts">
    import { Card, Button } from 'flowbite-svelte';
    import { ArrowRightOutline } from 'flowbite-svelte-icons';
    export let title: string = "title";
    export let target: string = "_blank";
    export let description: string = "description";
    export let link: string = "#";
    export let linkText: string = "Read more";
</script>

<Card class="p-4 sm:p-6 md:p-8">
    <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        {title}
    </h5>
    <p class="mb-3 font-normal text-gray-700 dark:text-gray-400 leading-tight">
        {description}
    </p>
    {#if link}
        <a href={link} target={target}>
            <Button class="w-fit">
                {linkText} <ArrowRightOutline class="w-6 h-6 ms-2 text-white" />
            </Button>
        </a>
    {/if}
</Card>