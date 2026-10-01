import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export default function LoginScreen() {
    const router = useRouter();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Email aur password dono dal bhai!');
            return;
        }
        try {
            setLoading(true);
            const response = await api.post('/auth/login', { email, password });
            const { success, token, user, message } = response.data;

            if (!success || !token || !user) {
                throw new Error(message || 'Login failed');
            }

            await login(token, user);

            if (user.role === 'TEACHER') {
                router.replace('/(teacher)/dashboard');
            } else {
                if (!user.deviceId) {
                    router.replace('/(auth)/register-device');
                } else {
                    router.replace('/(student)/dashboard');
                }
            }
        } catch (error: any) {
            const errMessage =
                error.response?.data?.message ||
                error.message ||
                'Invalid credentials';
            Alert.alert('Login Failed ❌', errMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-slate-950 justify-center px-6"
        >
            <View className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl">

                <View className="mb-8">
                    <Text className="text-4xl font-bold text-white mb-2">AttendMark 🎯</Text>
                    <Text className="text-slate-400 text-sm">Apne credentials ke sath login kar bhai</Text>
                </View>

                <View className="mb-4">
                    <Text className="text-slate-300 text-xs font-semibold mb-2 uppercase tracking-wider">Email</Text>
                    <TextInput
                        className="bg-slate-950 border border-slate-800 text-white px-4 py-4 rounded-xl text-base mb-5"
                        placeholder="student@gccba.edu.in"
                        placeholderTextColor="#475569"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />

                    <Text className="text-slate-300 text-xs font-semibold mb-2 uppercase tracking-wider">Password</Text>
                    <TextInput
                        className="bg-slate-950 border border-slate-800 text-white px-4 py-4 rounded-xl text-base mb-8"
                        placeholder="••••••••"
                        placeholderTextColor="#475569"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    {loading ? (
                        <ActivityIndicator size="large" color="#3b82f6" />
                    ) : (
                        <TouchableOpacity
                            onPress={handleLogin}
                            className="bg-blue-600 py-4 rounded-xl items-center shadow-lg shadow-blue-500/30"
                        >
                            <Text className="text-white font-bold text-lg">Login 🚀</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}