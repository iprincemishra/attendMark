import * as SecureStore from 'expo-secure-store';
import { IUser } from '../types/api';

export async function saveToken(token: string) {
    await SecureStore.setItemAsync('auth_token', token);
}

export async function getToken(): Promise<string | null> {
    return await SecureStore.getItemAsync('auth_token');
}

export async function removeToken() {
    await SecureStore.deleteItemAsync('auth_token');
}

export async function saveUser(user: IUser) {
    await SecureStore.setItemAsync('auth_user', JSON.stringify(user));
}

export async function getUser(): Promise<IUser | null> {
    const userStr = await SecureStore.getItemAsync('auth_user');
    if (userStr) {
        return JSON.parse(userStr) as IUser;
    }
    return null;
}

export async function removeUser() {
    await SecureStore.deleteItemAsync('auth_user');
}