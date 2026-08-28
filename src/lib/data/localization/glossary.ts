/**
 * Translation glossary support.
 *
 * Glossary terms are ordinary translation entries served by the API under the
 * `Glossary` category, e.g. `Mods.PathOfTerraria.Glossary.glossary_Skill`. The
 * last key segment is the English term, written with a `glossary_` prefix that
 * marks it as a term and is stripped here; remaining underscores become spaces
 * (`glossary_Critical_Strike` -> "critical strike"). The value is the note
 * explaining how to translate the term. The note is translated on the
 * localization page like any other string, and the translated note is shown as
 * a tooltip when hovering the term in the English column.
 *
 * Terms are matched case-insensitively on whole words, including simple
 * plural forms (`skill`, `skills`).
 */
export const GLOSSARY_CATEGORY = 'Glossary';

/** Marks a key in the glossary category as a term; not part of the term itself. */
const TERM_KEY_PREFIX = 'glossary_';

export interface GlossaryEntry {
    key: string;
    value: string;
    translatedValue?: string;
}

export interface Glossary {
    regex: RegExp | null;
    notes: Map<string, string>; // lowercase term -> note
}

export const EMPTY_GLOSSARY: Glossary = { regex: null, notes: new Map() };

function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function termFromKey(key: string): string {
    let last = key.slice(key.lastIndexOf('.') + 1);

    // Strip the marker prefix before turning the rest into a term, so that
    // `glossary_Critical_Strike` yields "critical strike" and not "glossary ...".
    if (last.toLowerCase().startsWith(TERM_KEY_PREFIX)) {
        last = last.slice(TERM_KEY_PREFIX.length);
    }

    return last.replace(/_/g, ' ').trim().toLowerCase();
}

/**
 * Builds a glossary from the `Glossary` category entries. Uses the translated
 * note when available and the English note otherwise.
 */
export function buildGlossary(entries: GlossaryEntry[]): Glossary {
    const notes = new Map<string, string>();
    for (const entry of entries) {
        const term = termFromKey(entry.key);
        const note = entry.translatedValue || entry.value;
        if (!term || !note) continue;
        notes.set(term, note);
        notes.set(term + 's', note);
        notes.set(term + 'es', note);
    }
    if (notes.size === 0) return EMPTY_GLOSSARY;
    const words = [...notes.keys()]
        .sort((a, b) => b.length - a.length) // longest first so longer terms win
        .map(escapeRegex);
    return { regex: new RegExp(`\\b(${words.join('|')})\\b`, 'gi'), notes };
}

export type GlossarySegment =
    | { kind: 'text'; text: string }
    | { kind: 'term'; text: string; note: string };

/** Splits `text` into plain segments and glossary-term segments with their notes. */
export function segmentText(text: string, glossary: Glossary): GlossarySegment[] {
    if (!text || !glossary.regex) return [{ kind: 'text', text }];
    const segments: GlossarySegment[] = [];
    let last = 0;
    for (const match of text.matchAll(glossary.regex)) {
        const note = glossary.notes.get(match[0].toLowerCase());
        if (!note) continue;
        const start = match.index ?? 0;
        if (start > last) segments.push({ kind: 'text', text: text.slice(last, start) });
        segments.push({ kind: 'term', text: match[0], note });
        last = start + match[0].length;
    }
    if (last < text.length) segments.push({ kind: 'text', text: text.slice(last) });
    return segments;
}
