import axios from 'axios';
import { getToken } from '../utils/secureStore';

const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL!;

export const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    async (config) => {
        try {
            const token = await getToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error fetching token from storage:', error);
        }
        return config;
    },
    (error) => Promise.reject(error)
);