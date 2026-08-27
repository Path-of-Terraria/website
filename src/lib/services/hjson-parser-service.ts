import type { ITranslationEntry } from '$lib/models/localization';

/** A category entry to export: the English source value and its translation, if any. */
export interface IHjsonExportEntry {
    key: string;
    value: string;
    translatedValue?: string;
}

/** Node of the tree built from dotted translation keys while serializing. */
interface HjsonNode {
    children?: Map<string, HjsonNode>;
    entry?: IHjsonExportEntry;
}

/**
 * Service for parsing HJSON content for translations
 * 
 * This service handles the parsing of HJSON content in the format:
 * 
 * ```
 * # Each entry comes with a standard, pre-generated line:
 * # "{1}{0} to stat"
 * IncreasedDamageAffix: {
 *     Description: "{1}{0}% урона"
 * }
 * DefenseItemAffix: {
 *     Description: "{1}{0} защиты"
 * }
 * ```
 * 
 * It extracts the entry names and their properties to create translation entries.
 */
export class HjsonParserService {
    /**
     * Parses HJSON content and returns a map of translation keys to values
     * 
     * @param hjsonContent The HJSON content to parse
     * @param category The category to use for the translations
     * @returns A record mapping translation keys to their values
     */
    public parseHjsonContent(hjsonContent: string, category: string): Record<string, string> {
        if (!hjsonContent.trim() || !category) return {};

        const parsedTranslations: Record<string, string> = {};
        const path: string[] = []; // holds things like ["BubbleDialogue", "Day"]

        // Simple tokenizer for line-based Hjson-ish content
        const lines = hjsonContent.split('\n');

        // Regex: captures (possibly quoted) key OR numeric key, and the remainder after the colon
        const kvRe = /^\s*(?:"([^"]+)"|([\w.-]+))\s*:\s*(.*)\s*$/;

        for (let index = 0; index < lines.length; index++) {
            const raw = lines[index];
            let line = raw.trim();

            // Skip blank lines and comments (# or //)
            if (!line || line.startsWith('#') || line.startsWith('//')) continue;

            // Handle closing braces. There may be multiple on one line (e.g., "}, }")
            if (/^\}+[,]*$/.test(line)) {
                // Pop one level for each '}' found
                const closes = line.replace(/[^}]/g, '').length;
                for (let i = 0; i < closes; i++) {
                    if (path.length > 0) path.pop();
                }
                continue;
            }

            const m = kvRe.exec(line);
            if (!m) continue;

            const keyPart = (m[1] ?? m[2] ?? '').trim(); // group 1: quoted, group 2: unquoted
            let rest = m[3].trim();

            // Strip a trailing comma from the remainder, if present
            if (rest.endsWith(',')) rest = rest.slice(0, -1).trim();

            const opensObject = rest === '{';

            if (opensObject) {
                // Opening a nested object: push key segment
                path.push(keyPart);
                continue;
            }

            // Leaf value
            // If value is quoted, remove the surrounding quotes; otherwise keep as-is
            let value = rest;

            if (value === "'''") {
                const blockLines: string[] = [];

                index += 1;
                while (index < lines.length && lines[index].trim() !== "'''") {
                    blockLines.push(lines[index].trim());
                    index += 1;
                }

                value = blockLines.join('\n').trim();
            } else if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }

            // Compose full key: Mods.PathOfTerraria.<category>.<path...>.<keyPart>
            const fullKey =
                ['Mods', 'PathOfTerraria', category]
                    .concat(path)
                    .concat(keyPart)
                    .join('.');

            // Skip empty values: exported files contain empty placeholders for entries
            // that are not translated yet, and those must not be imported as blanks.
            if (value.trim() === '') continue;

            parsedTranslations[fullKey] = value;
        }

        return parsedTranslations;
    }


    /**
     * Creates translation entries from parsed HJSON content
     * 
     * @param parsedTranslations The parsed translations
     * @param language The language code
     * @param category The category
     * @param existingKeys Set of existing translation keys to avoid duplicates
     * @returns An object containing the translation entries to add and statistics
     */
    public createTranslationEntries(
        parsedTranslations: Record<string, string>,
        language: string,
        category: string,
        existingKeys: Set<string>
    ): { 
        translationsToAdd: ITranslationEntry[],
        stats: { total: number, added: number, skipped: number }
    } {
        const stats = { total: 0, added: 0, skipped: 0 };
        const translationsToAdd: ITranslationEntry[] = [];
        
        stats.total = Object.keys(parsedTranslations).length;
        
        for (const [key, value] of Object.entries(parsedTranslations)) {
            if (!existingKeys.has(key)) {
                // Create new translation entry with the selected category
                const newTranslation: ITranslationEntry = {
                    id: '', // Will be assigned by the server
                    key: key,
                    value: value,
                    language: language,
                    category: category
                };
                
                translationsToAdd.push(newTranslation);
                stats.added++;
            } else {
                stats.skipped++;
            }
        }
        
        return { translationsToAdd, stats };
    }

    /**
     * Serializes the translations of a single category into HJSON, in the same
     * shape `parseHjsonContent` accepts (keys are written relative to
     * `Mods.PathOfTerraria.<category>.`), so an exported file can be edited and
     * imported back.
     *
     * Entries that have no translation yet fall back to their English value, so
     * the document is always complete and directly usable as a localization file.
     *
     * @param entries The category's entries: English value plus optional translation
     * @param category The category being exported
     * @returns The HJSON document
     */
    public serializeToHjson(entries: IHjsonExportEntry[], category: string): string {
        if (!category) return '';

        const prefix = `Mods.PathOfTerraria.${category}.`;
        const root: HjsonNode = {};

        for (const entry of entries) {
            if (!entry.key.startsWith(prefix)) continue;

            const segments = entry.key.slice(prefix.length).split('.').filter(Boolean);
            if (segments.length === 0) continue;

            let node = root;
            for (const segment of segments.slice(0, -1)) {
                const children = (node.children ??= new Map<string, HjsonNode>());
                let child = children.get(segment);
                if (!child) {
                    child = {};
                    children.set(segment, child);
                }
                node = child;
            }

            const children = (node.children ??= new Map<string, HjsonNode>());
            const leafName = segments[segments.length - 1];
            const leaf = children.get(leafName) ?? {};
            leaf.entry = entry;
            children.set(leafName, leaf);
        }

        const lines = this.renderNode(root, 0);
        return lines.length > 0 ? lines.join('\n') + '\n' : '';
    }

    /** Renders a node's children as indented HJSON lines. */
    private renderNode(node: HjsonNode, depth: number): string[] {
        const lines: string[] = [];
        const indent = '\t'.repeat(depth);
        const blockDelimiter = "'''";

        for (const [name, child] of node.children ?? []) {
            const key = /^[\w-]+$/.test(name) ? name : `"${name}"`;

            if (child.children && child.children.size > 0) {
                if (child.entry) {
                    // A key used both as a value and as a parent cannot be expressed in
                    // HJSON; keep the value visible as a comment so nothing is lost.
                    const own = child.entry.translatedValue || child.entry.value;
                    lines.push(`${indent}# ${key} = ${this.toSingleLine(own)}`);
                }

                lines.push(`${indent}${key}: {`);
                lines.push(...this.renderNode(child, depth + 1));
                lines.push(`${indent}}`);
                continue;
            }

            if (!child.entry) continue;

            // Untranslated entries fall back to the English text.
            const value = child.entry.translatedValue || child.entry.value;
            if (value.includes('\n')) {
                lines.push(`${indent}${key}: ${blockDelimiter}`);
                for (const valueLine of value.split('\n')) {
                    lines.push(`${indent}\t${valueLine}`);
                }
                lines.push(`${indent}${blockDelimiter}`);
            } else {
                // Surrounding quotes are stripped as a pair on import, so wrapping is
                // safe even when the value itself contains quotes, commas or braces.
                lines.push(`${indent}${key}: "${value}"`);
            }
        }

        return lines;
    }

    /** Collapses newlines so a value can be used inside a single-line comment. */
    private toSingleLine(value: string): string {
        return value.replace(/\s*\n\s*/g, ' ').trim();
    }
}
