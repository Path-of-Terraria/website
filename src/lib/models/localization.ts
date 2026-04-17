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

export interface ITranslationContributorLeaderboardEntry {
    submitterId: string;
    profileName: string;
    contributionCount: number;
    approvedContributionCount: number;
    languageCount: number;
    lastContributionAt: string | null;
}
