import { HttpService } from "$lib/services/http-service";
import type {IEnglishTranslation} from "$lib/models/localization";

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
}
