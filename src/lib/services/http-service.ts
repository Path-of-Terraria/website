import axios from 'axios';
import {GetJwtToken} from './session-service';

export class HttpService {
    private static instance: HttpService;

    constructor() {
        axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;
        axios.interceptors.request.use((config) => {
            if (GetJwtToken()) {
                config.headers['Authorization'] = `Bearer ${GetJwtToken()}`;
            }
            return config;
        }, (error) => {
            // Do something with request error
            return Promise.reject(error);
        });
    }

    public async get(url: string): Promise<any> {
        return await axios.get(url);
    }

    public async post(url: string, data: any): Promise<any> {
        return await axios.post(url, data);
    }

    public async put(url: string, data: any): Promise<any> {
        return await axios.put(url, data);
    }

    public async delete(url: string): Promise<any> {
        return await axios.delete(url);
    }

    public async patch(url: string, data: any): Promise<any> {
        return await axios.patch(url, data);
    }
}