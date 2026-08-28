import { HttpService } from "$lib/services/http-service";
import type {
    IEnglishTranslation,
    ITranslationContributorLeaderboardEntry,
    ITranslationEntry
} from "$lib/models/localization";

export class TranslationEntryService {
    httpService = HttpService.getInstance();

    public async getEnglishTranslations(): Promise<IEnglishTranslation[]> {
        let response = await this.httpService.get('TranslationEntry/EnglishTranslationsJson');
        if (response && response.data) {
            // Transform object format {key: value} into array of {key, value} objects
            const translationsObject = response.data as Record<string, string>;
            const translationsArray: IEnglishTranslation[] = Object.entries(translationsObject).map(
                ([key, value]) => ({ key, value })
            );
            return translationsArray;
        }
        return [];
    }

    public async getByLanguage(language: string): Promise<ITranslationEntry[]> {
        let response = await this.httpService.get(`TranslationEntry/Language/${language}`);
        if (response) {
            return response.data as ITranslationEntry[];
        }
        return [];
    }

    /**
     * Downloads the server-generated export for a language: a zip holding one
     * hjson file per category.
     */
    public async exportLanguage(language: string): Promise<Blob> {
        const response = await this.httpService.get(`TranslationEntry/Export/${language}`, { responseType: 'blob' });
        return response.data as Blob;
    }

    public async getLeaderboards(): Promise<ITranslationContributorLeaderboardEntry[]> {
        const response = await this.httpService.get('TranslationEntry/Leaderboard');
        if (response) {
            return response.data as ITranslationContributorLeaderboardEntry[];
        }
        return [];
    }

    public async update(translationEntry: ITranslationEntry): Promise<void> {
        await this.httpService.patch(`TranslationEntry`, translationEntry);
    }

    public async delete(id: string): Promise<void> {
        await this.httpService.delete(`TranslationEntry/${id}`);
    }

    public async create(translationEntry: ITranslationEntry): Promise<void> {
        translationEntry.id = undefined;
        await this.httpService.post('TranslationEntry', translationEntry);
    }
}
