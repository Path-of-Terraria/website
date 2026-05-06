import { HttpService } from "$lib/services/http-service";

export interface IPollOption {
    id: string;
    text: string;
    orderIndex: number;
    voteCount: number;
}

export interface IPollQuestion {
    id: string;
    text: string;
    allowMultiple: boolean;
    orderIndex: number;
    options: IPollOption[];
}

export interface IPoll {
    id: string;
    title: string;
    endDate: string;
    createdDate: string | null;
    createdById: string;
    createdByProfileName: string | null;
    isActive: boolean;
    totalAnswers: number;
    hasAnswered: boolean;
    myComment: string | null;
    mySelectedOptionIds: string[];
    questions: IPollQuestion[];
}

export interface IPollAnswerDetail {
    answerId: string;
    userId: string;
    profileName: string;
    selectedOptionIds: string[];
    comment: string | null;
    createdDate: string | null;
}

export interface ICreatePollOptionRequest {
    text: string;
}

export interface ICreatePollQuestionRequest {
    text: string;
    allowMultiple: boolean;
    options: ICreatePollOptionRequest[];
}

export interface ICreatePollRequest {
    title: string;
    endDate: string;
    questions: ICreatePollQuestionRequest[];
}

export interface ISubmitPollAnswerRequest {
    selectedOptionIds: string[];
    comment?: string | null;
}

export class PollService {
    httpService = HttpService.getInstance();

    public async getAll(): Promise<IPoll[]> {
        const response = await this.httpService.get("Poll");
        return response?.data ?? [];
    }

    public async getById(id: string): Promise<IPoll | null> {
        const response = await this.httpService.get(`Poll/${id}`);
        return response?.data ?? null;
    }

    public async getAnswers(id: string): Promise<IPollAnswerDetail[]> {
        const response = await this.httpService.get(`Poll/${id}/Answers`);
        return response?.data ?? [];
    }

    public async create(request: ICreatePollRequest): Promise<string | null> {
        const response = await this.httpService.post("Poll", request);
        return response?.data ?? null;
    }

    public async submitAnswer(id: string, request: ISubmitPollAnswerRequest): Promise<IPoll | null> {
        const response = await this.httpService.post(`Poll/${id}/Answer`, request);
        return response?.data ?? null;
    }
}
