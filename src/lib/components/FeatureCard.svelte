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

<Card class="relative overflow-hidden border border-rune-300/12 bg-[radial-gradient(circle_at_top_left,rgba(130,216,255,0.09),transparent_32%),linear-gradient(180deg,rgba(17,28,41,0.96),rgba(9,15,25,0.94))] p-4 text-white shadow-[0_20px_60px_rgba(0,0,0,0.28)] sm:p-6 md:p-8">
    <!-- A thin rime of frost along the top edge. -->
    <div class="rune-crust pointer-events-none absolute inset-x-0 top-0 h-6 opacity-30"></div>
    <h5 class="relative mb-2 text-2xl font-bold tracking-tight text-white">
        {title}
    </h5>
    <p class="relative mb-3 leading-tight font-normal text-gray-300">
        {description}
    </p>
    {#if link}
        <a href={link} target={target} class="relative">
            <Button class="w-fit cursor-pointer border-rune-300/15 bg-rune-500/10 text-white hover:bg-rune-500/16">
                {linkText} <ArrowRightOutline class="w-6 h-6 ms-2 text-rune-100" />
            </Button>
        </a>
    {/if}
</Card>
