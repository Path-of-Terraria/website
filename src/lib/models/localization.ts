export interface IEnglishTranslation {
    key: string;
    value: string;
}
export interface ITranslationEntry {
    id: string | undefined;
    category: string;
    key: string;
    language: string;
    value: string;
}