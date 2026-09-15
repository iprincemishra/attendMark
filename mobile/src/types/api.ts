export interface IApiResponse<T> {
    success: boolean;
    message?: string;
    data: T;
    error?: string;
    token?: string;
}

export interface IUser {
    id: string;
    email: string;
    name: string;
    role: 'STUDENT' | 'TEACHER' | 'ADMIN';
    rollNumber?: string;
    deviceId?: string;
}

export interface ILoginResponse {
    user: IUser;
    token: string;
}