import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import DeveloperBadge from '@/components/DeveloperBadge';

const TeacherDashboard = () => {

    const router = useRouter();
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        router.replace('/');
    };

    return (
        <ScrollView className="flex-1 bg-gray-50">
            <View className='flex h-screen justify-between'>

                <View className='flex'>
                    <View className="bg-blue-600 pt-16 pb-8 px-6 rounded-b-3xl shadow-md">
                        <View className="flex-row justify-between items-center">
                            <View>
                                <Text className="text-blue-100 text-lg">Professor,</Text>
                                <Text className="text-white text-3xl font-bold">{user?.name || 'Teacher'}</Text>
                                <Text className="text-blue-200 mt-1">{user?.email}</Text>
                            </View>
                            <TouchableOpacity
                                onPress={handleLogout}
                                className="bg-blue-700 px-3 py-2 rounded-full border border-blue-500 flex flex-row justify-center items-center"
                            >
                                <Feather name='log-out' color={"#ffffff70"} size={20} />
                                <Text className="text-white font-bold px-2">Logout</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className="p-6">
                        <Text className="text-gray-500 text-sm font-semibold mb-3 uppercase tracking-wider">Quick Actions</Text>
                        <TouchableOpacity
                            onPress={() => router.push('/(teacher)/create-session')}
                            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8 items-center flex-row"
                        >
                            <View className="bg-blue-100 p-4 rounded-full mr-4">
                                <Feather name="edit-3" size={28} color="#2563eb" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-xl font-bold text-gray-800">Start New Class</Text>
                                <Text className="text-gray-500 mt-1">Create a attendance session for your subject</Text>
                            </View>
                            <Feather name="arrow-right" size={24} color="#3b82f6" />
                        </TouchableOpacity>

                        <View className="mt-8 bg-blue-50 p-6 rounded-3xl border border-blue-100 border-dashed items-center">
                            <Feather name="bar-chart-2" size={32} color="#93c5fd" style={{ marginBottom: 12 }} />
                            <Text className="text-blue-400/60 font-bold text-center">
                                Detailed attendance analytics and history export will be available here soon.
                            </Text>
                        </View>
                    </View>
                </View>

                <DeveloperBadge />

            </View>
        </ScrollView>
    );
};

export default TeacherDashboard;