import axios, {type AxiosRequestConfig, type AxiosResponse} from 'axios';
import { GetJwtToken } from './session-service';
import { toast } from "@zerodevx/svelte-toast";

export class HttpService {
    private static instance: HttpService;

    private constructor() {
        axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;
        axios.interceptors.request.use((config) => {
            if (GetJwtToken()) {
                config.headers['Authorization'] = `Bearer ${GetJwtToken()}`;
            }
            return config;
        }, (error) => {
            return Promise.reject(error);
        });

        axios.interceptors.response.use(function (response) {
            return response;
        }, function (error) {
            toast.push('Failed to fetch');
            return Promise.reject(error);
        });
    }

    public static getInstance(): HttpService {
        if (!HttpService.instance) {
            HttpService.instance = new HttpService();
        }
        return HttpService.instance;
    }

    public async get(url: string): Promise<AxiosResponse> {
        return await axios.get(url);
    }

    public async post(url: string, data: any, options?: AxiosRequestConfig): Promise<AxiosResponse> {
        return await axios.post(url, data, options);
    }

    public async put(url: string, data: any): Promise<AxiosResponse> {
        return await axios.put(url, data);
    }

    public async delete(url: string): Promise<AxiosResponse> {
        return await axios.delete(url);
    }

    public async patch(url: string, data: any): Promise<AxiosResponse> {
        return await axios.patch(url, data);
    }
}