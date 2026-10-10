import { api } from '@/services/api'
import { bleService } from '@/services/ble'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import {
    Text, TouchableOpacity, View, ActivityIndicator, KeyboardAvoidingView, Platform, Modal, ScrollView
} from 'react-native'
import CustomAlert from '@/components/CustomAlert'
import * as Haptics from "expo-haptics"

const SUBJECTS = [
    'Internet of Things',
    'Data Warehouse and Data Mining',
    'Java Programming',
    'Linux Operating System',
    'C # with .NET framework'
];

const CreateSessionScreen = () => {

    const router = useRouter()

    const [subject, setSubject] = useState('')
    const [loading, setLoading] = useState(false)
    const [dropdownOpen, setDropdownOpen] = useState(false)

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
        if (!subject.trim()) {
            showAlert('Selection Required', 'Please select a subject to continue.', 'error')
            return
        }
        try {
            setLoading(true)
            const response = await api.post('/attendance/start-session', { subject })

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
                <Text className="text-blue-200 mt-1">Select a subject to initialize the attendance session</Text>
            </View>

            <View className="px-6 -mt-4">
                <View className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">

                    <Text className="text-gray-700 text-xs font-semibold mt-4 mb-2 uppercase tracking-wider">
                        Select Subject
                    </Text>

                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => setDropdownOpen(true)}
                        disabled={loading}
                        className="bg-gray-50 border border-gray-200 px-4 py-4 rounded-xl flex-row justify-between items-center"
                    >
                        <Text className={subject ? "text-gray-800 text-base font-medium" : "text-gray-400 text-base"}>
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
                        disabled={loading || !subject}
                        className={`py-4 rounded-xl items-center shadow-lg mt-6 ${loading || !subject ? 'bg-blue-300 shadow-none' : 'bg-blue-600 shadow-blue-500/30'}`}
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
            <Modal
                visible={dropdownOpen}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setDropdownOpen(false)}
            >
                <TouchableOpacity
                    className="flex-1 bg-black/40 justify-center items-center px-6"
                    activeOpacity={1}
                    onPress={() => setDropdownOpen(false)}
                >
                    <View className="bg-white w-full rounded-3xl p-2 shadow-2xl">
                        <View className="p-4 border-b border-gray-100 flex-row justify-between items-center">
                            <Text className="text-gray-800 font-bold text-lg">BCA 5th Sem Subjects</Text>
                        </View>

                        <ScrollView className="max-h-80">
                            {SUBJECTS.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    className={`p-4 mx-2 my-1 rounded-xl flex-row justify-between items-center ${subject === item ? 'bg-blue-50' : 'bg-transparent'}`}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setSubject(item);
                                        setDropdownOpen(false);
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
            />
        </KeyboardAvoidingView>
    )
}

export default CreateSessionScreen