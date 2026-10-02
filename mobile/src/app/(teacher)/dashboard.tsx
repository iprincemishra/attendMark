import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const TeacherDashboard = () => {

    const params = useLocalSearchParams();
    const sessionId = params.sessionId;

    const router = useRouter();
    const { user, logout } = useAuth();

    const [activeSession, setActiveSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchActiveSession = async () => {
        if (!sessionId) {
            console.log("No sessionId found in params, stopping fetch.");
            setActiveSession(null);
            setLoading(false);
            setRefreshing(false);
            return;
        }

        try {
            setLoading(true);
            console.log(`Fetching session details for: ${sessionId}`);
            const res = await api.get(`/attendance/${sessionId}`);

            if (res.data.success) {
                console.log("Session fetched successfully:", res.data.data);
                setActiveSession(res.data.data);
            } else {
                setActiveSession(null);
            }
        } catch (error: any) {
            console.error('Error fetching active session:', error);
            setActiveSession(null);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchActiveSession();
    }, [sessionId]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchActiveSession();
    }, [sessionId]);

    const handleLogout = async () => {
        await logout();
        router.replace('/');
    };

    return (
        <ScrollView
            className="flex-1 bg-gray-50"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <View className="bg-blue-600 pt-16 pb-8 px-6 rounded-b-3xl shadow-md">
                <View className="flex-row justify-between items-center">
                    <View>
                        <Text className="text-blue-100 text-lg">Professor,</Text>
                        <Text className="text-white text-3xl font-bold">{user?.name || 'Teacher'}</Text>
                        <Text className="text-blue-200 mt-1">{user?.email}</Text>
                    </View>
                    <TouchableOpacity
                        onPress={handleLogout}
                        className="bg-blue-700 p-2 rounded-full border border-blue-500"
                    >
                        <Text className="text-white font-bold px-2">Logout</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View className="p-6">
                <TouchableOpacity
                    onPress={() => router.push('/(teacher)/create-session')}
                    className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8 items-center flex-row"
                >
                    <View className="bg-blue-100 p-4 rounded-full mr-4">
                        <Text className="text-3xl">📝</Text>
                    </View>
                    <View className="flex-1">
                        <Text className="text-xl font-bold text-gray-800">Start New Class</Text>
                        <Text className="text-gray-500 mt-1">Create a session & broadcast BLE</Text>
                    </View>
                    <Text className="text-2xl text-blue-500">→</Text>
                </TouchableOpacity>

                <Text className="text-xl font-bold text-gray-800 mb-4">Current Status</Text>

                {loading && !refreshing ? (
                    <ActivityIndicator size="large" color="#2563eb" className="mt-8" />
                ) : activeSession ? (
                    <TouchableOpacity
                        onPress={() => router.push({
                            pathname: '/(teacher)/session-live',
                            params: { id: activeSession.id }
                        })}
                        className="bg-blue-50 p-6 rounded-3xl shadow-sm border border-blue-200 flex-row justify-between items-center"
                    >
                        <View>
                            <View className="flex-row items-center mb-2">
                                <View className="w-3 h-3 rounded-full bg-green-500 mr-2" />
                                <Text className="text-green-600 font-bold uppercase tracking-widest text-xs">Live Broadcasting</Text>
                            </View>
                            <Text className="text-2xl font-bold text-gray-800">{activeSession.subject}</Text>
                            <Text className="text-gray-500 mt-1 font-medium">Tap to view live attendance</Text>
                        </View>
                        <Text className="text-4xl">📡</Text>
                    </TouchableOpacity>
                ) : (
                    <View className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 items-center">
                        <Text className="text-5xl mb-4">📴</Text>
                        <Text className="text-lg font-bold text-gray-700">No active classes</Text>
                        <Text className="text-gray-400 text-center mt-2">
                            When you start a class, it will appear here while broadcasting.
                        </Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
};

export default TeacherDashboard;