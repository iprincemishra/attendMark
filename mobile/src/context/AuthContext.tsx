import React, { createContext, useContext, useState, useEffect } from 'react';
import { IUser } from '../types/api';
import { getToken, saveToken, removeToken, getUser, saveUser, removeUser } from '../utils/secureStore';

interface AuthContextType {
    user: IUser | null;
    token: string | null;
    isLoading: boolean;
    login: (token: string, userData: IUser) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    const [user, setUser] = useState<IUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadStoredAuth() {
            try {
                const storedToken = await getToken();
                const storedUser = await getUser();

                if (storedToken && storedUser) {
                    setToken(storedToken);
                    setUser(storedUser);
                }
            } catch (error) {
                console.error('Failed to load auth state', error);
            } finally {
                setIsLoading(false);
            }
        }
        loadStoredAuth();
    }, []);

    const login = async (newToken: string, userData: IUser) => {
        await saveToken(newToken);
        await saveUser(userData);
        setToken(newToken);
        setUser(userData);
    };

    const logout = async () => {
        await removeToken();
        await removeUser();
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};