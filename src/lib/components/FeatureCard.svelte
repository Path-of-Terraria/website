<script lang="ts">
    import { Card, Button } from 'flowbite-svelte';
    import { ArrowRightOutline } from 'flowbite-svelte-icons';
    let { 
        title = "title",
        target = "_blank",
        description = "description",
        link = "#",
        linkText = "Read more"
    } = $props<{ title?: string; target?: string; description?: string; link?: string; linkText?: string }>();
</script>

<Card class="border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.07),transparent_30%),linear-gradient(180deg,rgba(17,24,39,0.96),rgba(9,14,24,0.94))] p-4 text-white shadow-[0_20px_60px_rgba(0,0,0,0.28)] sm:p-6 md:p-8">
    <h5 class="mb-2 text-2xl font-bold tracking-tight text-white">
        {title}
    </h5>
    <p class="mb-3 leading-tight font-normal text-gray-300">
        {description}
    </p>
    {#if link}
        <a href={link} target={target}>
            <Button class="w-fit cursor-pointer border-white/10 bg-white/8 text-white hover:bg-white/12">
                {linkText} <ArrowRightOutline class="w-6 h-6 ms-2 text-white" />
            </Button>
        </a>
    {/if}
</Card>
