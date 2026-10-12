import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import DeveloperBadge from '@/components/DeveloperBadge';

const StudentDashboard = () => {
    const router = useRouter();
    const { user, logout } = useAuth();

    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = async () => {
        try {
            const res = await api.get('/attendance/history');
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
        <View className='flex-1 bg-gray-50'>
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

            <View className="p-6 pb-0">
                <TouchableOpacity
                    onPress={() => router.push('/(student)/scanner')}
                    className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8 items-center flex-row"
                >
                    <View className="bg-blue-100 p-4 rounded-full mr-4">
                        <Feather name="radio" size={28} color="#2563eb" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-xl font-bold text-gray-800">Mark Attendance</Text>
                        <Text className="text-gray-500 mt-1">Scan for teacher's active class</Text>
                    </View>
                    <View>
                        <Feather name="arrow-right" size={24} color="#3b82f6" />
                    </View>
                </TouchableOpacity>

                <Text className="text-xl font-bold text-gray-800 mb-4">My Overview</Text>
            </View>

            <ScrollView
                className="flex-1 bg-gray-50 p-6 pt-0"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 16 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} tintColor="#2563eb" />
                }>

                <View className='flex pb-10'>

                    {loading ? (
                        <View className="w-[100%] h-80 flex justify-center items-center">
                            <ActivityIndicator size="large" color="#208AEF" />
                        </View>
                    ) : stats ? (
                        <>
                            <View className="flex-row justify-between flex-wrap mb-6">
                                <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 w-full mb-4">
                                    <Text className="text-gray-500 font-medium">Overall Attendance</Text>
                                    <Text className="text-4xl font-black text-blue-600 mt-1">
                                        {stats.overall?.percentage || '0%'}
                                    </Text>
                                </View>

                                <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 w-[48%]">
                                    <Text className="text-gray-500 font-medium mb-1">Attended</Text>
                                    <Text className="text-2xl font-bold text-green-600">
                                        {stats.overall?.classesAttended || 0}
                                    </Text>
                                </View>

                                <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 w-[48%]">
                                    <Text className="text-gray-500 font-medium mb-1">Skipped</Text>
                                    <Text className="text-2xl font-bold text-red-500">
                                        {stats.overall?.skippedClasses || 0}
                                    </Text>
                                </View>
                            </View>

                            {stats.subjectWise && Object.keys(stats.subjectWise).length > 0 && (
                                <View className="mb-6">
                                    <Text className="text-xl font-bold text-gray-800 mb-4">Subject Breakdown</Text>
                                    {Object.entries(stats.subjectWise).map(([subject, data]: any, index) => (
                                        <View key={index} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-3">
                                            <View className="flex-row justify-between mb-2">
                                                <Text className="text-gray-800 font-bold">{subject}</Text>
                                                <Text className="text-blue-600 font-bold">{data.percentage}%</Text>
                                            </View>
                                            <View className="bg-gray-200 h-2 rounded-full overflow-hidden mb-2">
                                                <View
                                                    className="bg-blue-500 h-2 rounded-full"
                                                    style={{ width: `${Math.min(Number(data.percentage), 100)}%` }}
                                                />
                                            </View>
                                            <Text className="text-gray-500 text-xs">
                                                Attended: {data.attended} / {data.total}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {stats.recentHistory && stats.recentHistory.length > 0 && (
                                <View>
                                    <Text className="text-xl font-bold text-gray-800 mb-4">Recent Classes</Text>
                                    {stats.recentHistory.map((item: any, index: number) => (
                                        <View key={index} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-3 flex-row justify-between items-center">
                                            <View>
                                                <Text className="text-gray-800 font-bold text-base">
                                                    {item.session?.subject || 'Unknown Class'}
                                                </Text>
                                                <Text className="text-gray-400 text-xs mt-1">
                                                    {new Date(item.timestamp).toLocaleString()}
                                                </Text>
                                            </View>
                                            <View className={`px-3 py-1 rounded-full ${item.status === 'PRESENT' ? 'bg-green-100' : 'bg-red-100'}`}>
                                                <Text className={`${item.status === 'PRESENT' ? 'text-green-600' : 'text-red-600'} font-bold text-xs uppercase`}>
                                                    {item.status}
                                                </Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </>
                    ) : (
                        <View className="bg-white p-6 rounded-2xl shadow-sm items-center py-10">
                            <Ionicons name="file-tray-outline" size={48} color="#9ca3af" style={{ marginBottom: 12 }} />
                            <Text className="text-gray-500">No attendance data found.</Text>
                        </View>
                    )}
                </View>

                <DeveloperBadge />

            </ScrollView>
        </View>
    );
};

export default StudentDashboard;