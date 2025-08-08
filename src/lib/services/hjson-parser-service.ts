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
        if (!hjsonContent.trim() || !category) {
            return {};
        }

        // Parse the HJSON content
        // The format is expected to be like:
        // IncreasedDamageAffix: {
        //     Description: "{1}{0}% урона"
        // }
        
        const lines = hjsonContent.split('\n');
        let entry = '';
        let parsedTranslations: Record<string, string> = {};
        
        for (let line of lines) {
            line = line.trim();
            
            // Skip comments and empty lines
            if (line.startsWith('#') || line === '') {
                continue;
            }
            
            // Check if this is an entry definition line (ends with colon and opening brace)
            if (line.includes(':') && line.includes('{') && !entry) {
                entry = line.split(':')[0].trim();
            }
            // Check if this is a closing brace, which means end of current entry
            else if (line === '}') {
                entry = '';
            }
            // Check if this is a property inside an entry
            else if (entry && line.includes(':')) {
                const parts = line.split(':', 2); // Split only on the first colon
                const property = parts[0].trim();
                
                // Get everything after the first colon
                let value = line.substring(line.indexOf(':') + 1).trim();
                
                // Handle different formats of values
                // Remove trailing comma if present
                if (value.endsWith(',')) {
                    value = value.slice(0, -1).trim();
                }
                
                // Remove surrounding quotes if present
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                }
                
                // Handle HJSON format where values might be wrapped in braces
                if (value.startsWith('{') && value.endsWith('}')) {
                    // Keep the braces as they might be part of the format string
                    // For example: "{1}{0}% урона"
                }
                
                // Create the full key with the selected category
                const fullKey = `Mods.PathOfTerraria.${category}.${entry}.${property}`;
                
                parsedTranslations[fullKey] = value;
            }
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