import { api } from '@/services/api'
import { bleService } from '@/services/ble'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
    Text, TouchableOpacity, View, ActivityIndicator, KeyboardAvoidingView, Platform, Modal, ScrollView
} from 'react-native'
import CustomAlert from '@/components/CustomAlert'
import * as Haptics from "expo-haptics"
import { BCA_CURRICULUM } from '@/constants/curriculum'

const CreateSessionScreen = () => {

    const router = useRouter()

    const [selectedSem, setSelectedSem] = useState(BCA_CURRICULUM[4])
    const [subject, setSubject] = useState('')
    const [loading, setLoading] = useState(false)
    const [semDropdownOpen, setSemDropdownOpen] = useState(false)
    const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false)

    const [alert, setAlert] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'info' as 'success' | 'error' | 'info',
        onConfirm: undefined as (() => void) | undefined
    })

    const showAlert = (
        title: string,
        message: string,
        type: 'success' | 'error' | 'info' = 'info',
        onConfirm?: () => void
    ) => setAlert({
        visible: true,
        title,
        message,
        type,
        onConfirm
    })

    const closeAlert = () => setAlert(prev => ({ ...prev, visible: false }))

    const handleStartSession = async () => {
        if (!selectedSem || !subject.trim()) {
            showAlert('Selection Required', 'Please select both a semester and a subject.', 'error')
            return
        }
        try {
            setLoading(true)
            const response = await api.post('/attendance/start-session', {
                subject,
                year: selectedSem.year
            })

            const { success, message, data } = response.data

            if (!success || !data?.sessionCode) {
                throw new Error(message || 'Failed to create session on the server.')
            }

            await bleService.startBroadcasting(data.sessionCode)

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            showAlert(
                'Session Started !!!',
                'Attendance session is now active.',
                'success',
                () => {
                    closeAlert()
                    router.replace({
                        pathname: '/(teacher)/session-live',
                        params: { sessionId: data.sessionId }
                    })
                }
            )

        } catch (error: any) {
            const errMsg = error.response?.data?.error || error.message || "An unexpected error occurred.";
            let displayMsg = errMsg;

            if (errMsg.includes('not supported') || errMsg.toLowerCase().includes('bluetooth')) {
                displayMsg = "Please turn on your device's Bluetooth to start broadcasting.";
            }
            showAlert("Broadcast Failed", displayMsg, 'error');
        } finally {
            setLoading(false)
        }
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="flex-1 bg-gray-50"
        >
            <View className="bg-blue-600 pt-16 pb-8 px-6 rounded-b-3xl shadow-md">
                <Text className="text-blue-100 text-lg">New Attendance</Text>
                <Text className="text-white text-3xl font-bold">Create Session</Text>
                <Text className="text-blue-200 mt-1">Select semester and subject to initialize session</Text>
            </View>

            <View className="px-6 -mt-4">
                <View className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">

                    {/* Select Semester & Year */}
                    <Text className="text-gray-700 text-xs font-semibold mt-2 mb-2 uppercase tracking-wider">
                        Select Semester
                    </Text>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => setSemDropdownOpen(true)}
                        disabled={loading}
                        className="bg-gray-50 border border-gray-200 px-4 py-4 rounded-xl flex-row justify-between items-center mb-4"
                    >
                        <View className="flex-row items-center">
                            <Text className="text-gray-800 text-base font-medium">
                                {selectedSem.semester}
                            </Text>
                            <Text className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-semibold">
                                {selectedSem.year}
                            </Text>
                        </View>
                        <Text className="text-gray-500 text-xs">▼</Text>
                    </TouchableOpacity>

                    {/* Select Subject */}
                    <Text className="text-gray-700 text-xs font-semibold mb-2 uppercase tracking-wider">
                        Select Subject
                    </Text>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => setSubjectDropdownOpen(true)}
                        disabled={loading}
                        className="bg-gray-50 border border-gray-200 px-4 py-4 rounded-xl flex-row justify-between items-center"
                    >
                        <Text className={subject ? "text-gray-800 text-base font-medium" : "text-gray-400 text-base"} numberOfLines={1}>
                            {subject || "Tap to choose subject..."}
                        </Text>
                        <Text className="text-gray-500 text-xs">▼</Text>
                    </TouchableOpacity>

                    <View className="flex-row items-center bg-blue-50 rounded-xl p-4 mt-5">
                        <View className="w-2 h-2 rounded-full bg-blue-500 mr-3" />
                        <Text className="text-blue-700 text-xs flex-1">
                            This device will begin broadcasting a BLE signal immediately. Students within a 10-15 meter radius can mark their attendance.
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={handleStartSession}
                        disabled={loading || !subject || !selectedSem}
                        className={`py-4 rounded-xl items-center shadow-lg mt-6 ${loading || !subject || !selectedSem ? 'bg-blue-300 shadow-none' : 'bg-blue-600 shadow-blue-500/30'}`}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                            <Text className="text-white font-bold text-lg">Start Broadcast</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.back()}
                        disabled={loading}
                        className="items-center mt-4 py-2"
                    >
                        <Text className="text-gray-400 font-medium">Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Semester */}
            <Modal
                visible={semDropdownOpen}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSemDropdownOpen(false)}
            >
                <TouchableOpacity
                    className="flex-1 bg-black/40 justify-center items-center px-6"
                    activeOpacity={1}
                    onPress={() => setSemDropdownOpen(false)}
                >
                    <View className="bg-white w-full rounded-3xl p-2 shadow-2xl">
                        <View className="p-4 border-b border-gray-100 flex-row justify-between items-center">
                            <Text className="text-gray-800 font-bold text-lg">Select Semester</Text>
                        </View>
                        <ScrollView className="max-h-80">
                            {BCA_CURRICULUM.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    className={`p-4 mx-2 my-1 rounded-xl flex-row justify-between items-center ${selectedSem.semester === item.semester ? 'bg-blue-50' : 'bg-transparent'}`}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setSelectedSem(item);
                                        setSubject('');
                                        setSemDropdownOpen(false);
                                    }}
                                >
                                    <View className="flex-row items-center">
                                        <Text className={`text-base ${selectedSem.semester === item.semester ? 'text-blue-600 font-bold' : 'text-gray-700'}`}>
                                            {item.semester}
                                        </Text>
                                        <Text className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                                            {item.year}
                                        </Text>
                                    </View>
                                    {selectedSem.semester === item.semester && <Text className="text-blue-600 font-bold">✓</Text>}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Subject */}
            <Modal
                visible={subjectDropdownOpen}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSubjectDropdownOpen(false)}
            >
                <TouchableOpacity
                    className="flex-1 bg-black/40 justify-center items-center px-6"
                    activeOpacity={1}
                    onPress={() => setSubjectDropdownOpen(false)}
                >
                    <View className="bg-white w-full rounded-3xl p-2 shadow-2xl">
                        <View className="p-4 border-b border-gray-100 flex-row justify-between items-center">
                            <Text className="text-gray-800 font-bold text-lg">Subjects for {selectedSem.semester}</Text>
                        </View>

                        <ScrollView className="max-h-80">
                            {selectedSem.subjects.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    className={`p-4 mx-2 my-1 rounded-xl flex-row justify-between items-center ${subject === item ? 'bg-blue-50' : 'bg-transparent'}`}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setSubject(item);
                                        setSubjectDropdownOpen(false);
                                    }}
                                >
                                    <Text className={`text-base ${subject === item ? 'text-blue-600 font-bold' : 'text-gray-700'}`}>
                                        {item}
                                    </Text>
                                    {subject === item && (
                                        <Text className="text-blue-600 font-bold">✓</Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            <CustomAlert
                visible={alert.visible}
                title={alert.title}
                message={alert.message}
                type={alert.type}
                onClose={closeAlert}
                onConfirm={alert.onConfirm}
                confirmText={alert.onConfirm ? 'View Live' : 'OK'}
                hideCancel={!!alert.onConfirm}
            />
        </KeyboardAvoidingView>
    )
}

export default CreateSessionScreen