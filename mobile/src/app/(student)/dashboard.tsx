import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const StudentDashboard = () => {
    const router = useRouter();
    const { user, logout } = useAuth();

    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = async () => {
        try {
            const res = await api.get('/attendance/my-history');
            if (res.data.success) {
                setStats(res.data.data);
            }
        } catch (error: any) {
            console.error('Error fetching student stats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchStats();
    }, []);

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
                        <Text className="text-blue-100 text-lg">Welcome back,</Text>
                        <Text className="text-white text-3xl font-bold">{user?.name || 'Student'}</Text>
                        <Text className="text-blue-200 mt-1">{user?.rollNumber || 'BCA Student'}</Text>
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
                    onPress={() => router.push('/(student)/scanner')}
                    className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8 items-center flex-row"
                >
                    <View className="bg-blue-100 p-4 rounded-full mr-4">
                        <Text className="text-3xl">📡</Text>
                    </View>
                    <View className="flex-1">
                        <Text className="text-xl font-bold text-gray-800">Mark Attendance</Text>
                        <Text className="text-gray-500 mt-1">Scan for teacher's active class</Text>
                    </View>
                    <Text className="text-2xl text-blue-500">→</Text>
                </TouchableOpacity>

                <Text className="text-xl font-bold text-gray-800 mb-4">My Overview</Text>

                {loading && !refreshing ? (
                    <ActivityIndicator size="large" color="#208AEF" className="mt-8" />
                ) : stats ? (
                    <View className="flex-row justify-between flex-wrap">
                        <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 w-full mb-4">
                            <Text className="text-gray-500 font-medium">Overall Attendance</Text>
                            <Text className="text-4xl font-black text-blue-600 mt-1">
                                {stats.overall?.overallPercentage || '0%'}
                            </Text>
                        </View>

                        <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 w-[48%]">
                            <Text className="text-gray-500 font-medium mb-1">Attended</Text>
                            <Text className="text-2xl font-bold text-green-600">
                                {stats.overall?.totalAttended || 0}
                            </Text>
                        </View>

                        <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 w-[48%]">
                            <Text className="text-gray-500 font-medium mb-1">Skipped</Text>
                            <Text className="text-2xl font-bold text-red-500">
                                {stats.overall?.totalSkipped || 0}
                            </Text>
                        </View>
                    </View>
                ) : (
                    <View className="bg-white p-6 rounded-2xl shadow-sm items-center">
                        <Text className="text-gray-500">No attendance data found.</Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
};

export default StudentDashboard;