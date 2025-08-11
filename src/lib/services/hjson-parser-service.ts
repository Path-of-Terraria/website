import type { ITranslationEntry } from '$lib/models/localization';

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

        for (let raw of lines) {
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
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }

            // Compose full key: Mods.PathOfTerraria.<category>.<path...>.<keyPart>
            const fullKey =
                ['Mods', 'PathOfTerraria', category]
                    .concat(path)
                    .concat(keyPart)
                    .join('.');

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
}