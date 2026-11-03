import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../services/api';
import { Ionicons, Feather } from '@expo/vector-icons';
import { downloadAttendanceReport } from '@/services/downloadAttendanceReport';
import CustomAlert from '@/components/CustomAlert';
import * as Haptics from 'expo-haptics';

export default function TeacherReportsScreen() {
    const router = useRouter();
    const { year } = useLocalSearchParams<{ year: string }>();

    const [subjects, setSubjects] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [downloadingSubject, setDownloadingSubject] = useState<string | null>(null);

    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'info' as 'success' | 'error' | 'info',
    });

    const showAlert = (
        title: string,
        message: string,
        type: 'success' | 'error' | 'info' = 'info'
    ) => {
        setAlertConfig({ visible: true, title, message, type });
    };

    const closeAlert = () =>
        setAlertConfig((prev) => ({ ...prev, visible: false }));

    useEffect(() => {
        fetchSubjects();
    }, [year]);

    const fetchSubjects = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/attendance/subjects/${year}`);
            if (response.data.success) {
                setSubjects(response.data.data);
            }
        } catch (error: any) {
            console.error('Error fetching subjects:', error.response?.data || error.message);
            if (error.response?.status !== 404) {
                showAlert('Error', 'Failed to load subjects for this year', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (subject: string) => {
        try {
            Haptics.selectionAsync();
            setDownloadingSubject(subject);
            await downloadAttendanceReport(year!, subject);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showAlert(
                'Download Successful',
                `Cumulative attendance report for ${subject} has been exported successfully.`,
                'success'
            );
        } catch (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            showAlert(
                'Download Failed',
                'Could not generate or share the attendance report. Please try again.',
                'error'
            );
        } finally {
            setDownloadingSubject(null);
        }
    };

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header Section matching app design language */}
            <View className="bg-blue-600 pt-16 pb-8 px-6 rounded-b-3xl shadow-md">
                <View className="flex-row items-center gap-4">
                    <TouchableOpacity
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.back();
                        }}
                        className="bg-white/10 p-2.5 rounded-full border border-blue-400/30 items-center justify-center"
                    >
                        <Feather name="arrow-left" size={20} color="#ffffff" />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-blue-100 text-sm font-medium">{year} Academic Records</Text>
                        <Text className="text-white text-2xl font-bold">Attendance Reports</Text>
                    </View>
                </View>
            </View>

            {/* Main Content Area */}
            <View className="flex-1 px-6 pt-6">
                <View className="mb-4">
                    <Text className="text-gray-800 font-bold text-lg">Select Subject</Text>
                    <Text className="text-gray-400 text-xs mt-0.5">Choose a course module to export cumulative CSV matrix</Text>
                </View>

                {loading ? (
                    <View className="flex-1 justify-center items-center pb-20">
                        <ActivityIndicator size="large" color="#2563eb" />
                        <Text className="text-gray-400 text-xs mt-3">Fetching active subjects...</Text>
                    </View>
                ) : subjects.length === 0 ? (
                    <View className="flex-1 justify-center items-center pb-20 px-6">
                        <View className="bg-blue-50 p-6 rounded-full mb-4 border border-blue-100">
                            <Ionicons name="folder-open-outline" size={40} color="#2563eb" />
                        </View>
                        <Text className="text-gray-800 font-bold text-base text-center">No Subjects Found</Text>
                        <Text className="text-gray-400 text-center text-xs mt-1">
                            No attendance sessions or subjects have been registered for {year} yet.
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={subjects}
                        keyExtractor={(item) => item}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 30 }}
                        renderItem={({ item: subject }) => (
                            <View className="bg-white border border-gray-100 rounded-2xl p-4 mb-3.5 flex-row items-center justify-between shadow-sm">
                                <View className="flex-row items-center flex-1 mr-3">
                                    <View className="p-3 bg-blue-50 rounded-xl mr-3.5 border border-blue-100 items-center justify-center">
                                        <Ionicons name="book-outline" size={20} color="#2563eb" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-800 font-bold text-base" numberOfLines={1}>
                                            {subject}
                                        </Text>
                                        <Text className="text-gray-400 text-xs mt-0.5">Cumulative Matrix & Logs</Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    onPress={() => handleDownload(subject)}
                                    disabled={downloadingSubject === subject}
                                    activeOpacity={0.8}
                                    className="bg-blue-600 px-4 py-3 rounded-xl flex-row items-center justify-center shadow-sm shadow-blue-500/20 min-w-[100px]"
                                >
                                    {downloadingSubject === subject ? (
                                        <ActivityIndicator size="small" color="#ffffff" />
                                    ) : (
                                        <>
                                            <Ionicons name="download-outline" size={15} color="#ffffff" style={{ marginRight: 5 }} />
                                            <Text className="text-white font-bold text-xs uppercase tracking-wider">Export</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    />
                )}
            </View>

            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={closeAlert}
            />
        </View>
    );
}