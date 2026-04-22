import { HttpService } from "$lib/services/http-service";

export interface ISendAnnouncementRequest {
    message: string;
}

export class AnnouncementService {
    httpService = HttpService.getInstance();

    public async sendAnnouncement(request: ISendAnnouncementRequest) {
        const response = await this.httpService.post("Announcement", request);
        if (response) {
            return response.data;
        }
        return null;
    }
}
