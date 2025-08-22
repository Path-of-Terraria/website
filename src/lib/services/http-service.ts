import axios, {type AxiosRequestConfig, type AxiosResponse} from 'axios';
import { GetJwtToken } from './session-service';
import { toast } from "$lib/toast";

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
            console.log('response error', error);
            if (error.response) {
                if (error.response.status === 401) {
                    toast.push(error?.response?.data?.message ?? 'Unauthorized');
                    return Promise.reject(error);
                }
                if (error.response.status === 403) {
                    toast.push(error?.response?.data?.message ?? 'Forbidden');
                    return Promise.reject(error);
                }
                if (error.response.status === 404) {
                    toast.push(error?.response?.data?.message ?? 'Not Found');
                    return Promise.reject(error);
                }
                if (error.response.data.message) {
                    toast.push(error.response.data.message);
                    return Promise.reject(error);
                }
            } else {
                toast.push('Failed to fetch');
            }
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