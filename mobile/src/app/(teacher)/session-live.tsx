import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { bleService } from '@/services/ble';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const StudentLiveItem = ({ name, rollNumber, time }: { name: string; rollNumber: string; time: string }) => (
    <View className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex-row items-center mb-3">
        <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-4">
            <Text className="text-blue-600 font-bold text-sm">{name?.charAt(0).toUpperCase()}</Text>
        </View>
        <View className="flex-1">
            <Text className="text-gray-900 font-bold text-base">{name}</Text>
            <Text className="text-gray-500 text-xs mt-0.5">{rollNumber}</Text>
        </View>
        <Text className="text-gray-400 text-xs font-medium">{time}</Text>
    </View>
);

const SessionLiveScreen = () => {
    const { sessionId } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();

    const [session, setSession] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchSession = useCallback(async () => {
        if (!sessionId) {
            setError('Session ID missing');
            setLoading(false);
            return;
        }
        try {
            const res = await api.get(`/attendance/${sessionId}`);
            if (res.data.success) {
                const sessionData = res.data.data;
                setSession(sessionData);
                setStudents(sessionData?.attendance || []);
                setError(null);
            } else {
                setError('Session data not found');
            }
        } catch (err: any) {
            console.error('Fetch error:', err);
            setError(err.response?.data?.message || 'Failed to load session');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [sessionId]);

    useEffect(() => {
        fetchSession();
        intervalRef.current = setInterval(fetchSession, 7000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [fetchSession]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchSession();
    }, [fetchSession]);

    const handleEndSession = async () => {
        try {
            await bleService.stopBroadcasting();
        } catch (e) {
            console.error('Error stopping broadcast on exit:', e);
        }
        router.back();
    };

    if (loading && !refreshing) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
                <ActivityIndicator size="large" color="#2563eb" />
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center px-6">
                <Feather name="alert-triangle" size={40} color="#dc2626" />
                <Text className="text-lg font-bold text-gray-700 mb-2">{error}</Text>
                <Text className="text-gray-400 text-center mb-6">Check your network or try refreshing.</Text>
                <TouchableOpacity onPress={fetchSession} className="bg-blue-600 px-8 py-3 rounded-xl">
                    <Text className="text-white font-bold">Retry</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const totalStudents = session?.totalStudents || 0;
    const markedCount = session?.totalPresent ?? students.length;
    const percentage = totalStudents > 0 ? Math.round((markedCount / totalStudents) * 100) : 0;

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="bg-blue-600 pt-16 pb-8 px-6 rounded-b-3xl shadow-md">
                <View className="flex-row justify-between items-center mb-4">
                    <View>
                        <Text className="text-blue-100 text-sm">Live Session</Text>
                        <Text className="text-white text-2xl font-bold mr-2">{session?.subject || 'Unknown Subject'}</Text>
                        {session?.year && (
                            <Text className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-md font-semibold">
                                {session.year}
                            </Text>
                        )}
                    </View>
                    <View className="bg-green-500/20 px-3 py-1 rounded-full flex-row items-center">
                        <View className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse" />
                        <Text className="text-green-300 text-xs font-bold uppercase">Live</Text>
                    </View>
                </View>

                <View className="flex-row items-center justify-between bg-blue-700/50 p-4 rounded-2xl">
                    <View className="flex-1 items-center">
                        <Text className="text-white text-3xl font-bold">{markedCount}</Text>
                        <Text className="text-blue-200 text-xs">Marked</Text>
                    </View>
                    <View className="w-px h-10 bg-blue-500 mx-4" />
                    <View className="flex-1 items-center">
                        <Text className="text-white text-3xl font-bold">{totalStudents}</Text>
                        <Text className="text-blue-200 text-xs">Total</Text>
                    </View>
                    <View className="w-px h-10 bg-blue-500 mx-4" />
                    <View className="flex-1 items-center">
                        <Text className="text-white text-3xl font-bold">{percentage}%</Text>
                        <Text className="text-blue-200 text-xs">Present</Text>
                    </View>
                </View>
            </View>

            <ScrollView
                className="flex-1 px-6 pt-6"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 24 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} tintColor="#2563eb" />}
            >
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-xl font-bold text-gray-800">Marked Students</Text>
                    <Text className="text-gray-400 text-xs">Auto-refreshing every 7s</Text>
                </View>

                {students.length > 0 ? (
                    students.map((item: any, index: number) => (
                        <StudentLiveItem
                            key={item.id || index}
                            name={item.student?.name || 'Unknown Student'}
                            rollNumber={item.student?.rollNumber || 'N/A'}
                            time={item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        />
                    ))
                ) : (
                    <View className="bg-white p-8 rounded-3xl border border-gray-100 items-center mt-2 shadow-sm">
                        <Ionicons name="time-outline" size={32} color="#2563eb" />
                        <Text className="text-base font-bold text-gray-700">Waiting for students...</Text>
                        <Text className="text-gray-400 text-center text-xs mt-1">
                            Students within 10-15 meters will appear here automatically.
                        </Text>
                    </View>
                )}
            </ScrollView>

            <View className="p-6 bg-white border-t border-gray-100">
                <TouchableOpacity
                    onPress={handleEndSession}
                    className="bg-red-500 py-4 rounded-xl items-center shadow-lg shadow-red-500/30"
                >
                    <Text className="text-white font-bold text-lg">End Session & Broadcast</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default SessionLiveScreen;