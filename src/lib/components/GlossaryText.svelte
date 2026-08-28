<script lang="ts">
    import { segmentText, type Glossary } from '$lib/data/localization/glossary';

    interface Props {
        text: string;
        glossary: Glossary;
    }

    let { text, glossary }: Props = $props();

    const segments = $derived(segmentText(text, glossary));
</script>

<!--
    Kept on one line on purpose: this component renders inline inside a sentence,
    so any newline or indentation between the tags would be rendered as a real
    space - underlining the whitespace after a term and padding plain segments.
-->
{#each segments as segment}{#if segment.kind === 'term'}<span class="glossary-term" tabindex="0">{segment.text}<span class="glossary-tooltip" role="tooltip">{segment.note}</span></span>{:else}{segment.text}{/if}{/each}

<style>
    .glossary-term {
        position: relative;
        text-decoration: underline dotted;
        text-decoration-color: rgb(251 191 36 / 0.8);
        text-underline-offset: 3px;
        cursor: help;
        outline: none;
    }

    .glossary-term:hover,
    .glossary-term:focus-visible {
        text-decoration-style: solid;
        color: rgb(253 224 71);
    }

    .glossary-tooltip {
        position: absolute;
        left: 0;
        bottom: calc(100% + 6px);
        z-index: 60;
        width: max-content;
        max-width: 22rem;
        padding: 0.5rem 0.75rem;
        border-radius: 0.5rem;
        border: 1px solid rgb(255 255 255 / 0.12);
        background: rgb(17 24 39 / 0.98);
        color: rgb(229 231 235);
        font-size: 0.8125rem;
        line-height: 1.35;
        text-decoration: none;
        white-space: normal;
        box-shadow: 0 8px 24px rgb(0 0 0 / 0.45);
        opacity: 0;
        pointer-events: none;
        transform: translateY(4px);
        transition: opacity 120ms ease, transform 120ms ease;
    }

    .glossary-term:hover > .glossary-tooltip,
    .glossary-term:focus-visible > .glossary-tooltip {
        opacity: 1;
        transform: translateY(0);
    }
</style>
