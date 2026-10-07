import { api } from '@/services/api'
import { bleService } from '@/services/ble'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import {
    Alert, Text, TextInput, TouchableOpacity, View,
    ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native'

const CreateSessionScreen = () => {

    const router = useRouter()

    const [subject, setSubject] = useState('')
    const [loading, setLoading] = useState(false)

    const handleStartSession = async () => {
        if (!subject.trim()) {
            Alert.alert('Error', 'Enter subject name!!')
            return
        }
        try {
            setLoading(true)
            const response = await api.post('/attendance/start-session', { subject })

            const { success, message, data } = response.data

            if (!success || !data?.sessionCode) {
                throw new Error(message || 'Failed to create session on backend')
            }

            await bleService.startBroadcasting(data.sessionCode)

            Alert.alert('Session started! ', 'BLE broadcast live ho gaya hai.', [
                {
                    text: 'View Live',
                    onPress: () => {
                        router.replace({
                            pathname: '/(teacher)/session-live',
                            params: { sessionId: data.sessionId }
                        })
                    }
                }
            ])

        } catch (error: any) {
            const errMessage = error.response?.data?.error || error.message || "Something went wrong"
            Alert.alert("Broadcast Failed", errMessage)
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
                <Text className="text-blue-200 mt-1">BLE broadcast ke through attendance mark hogi</Text>
            </View>

            <View className="px-6 -mt-4">
                <View className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">

                    <Text className="text-gray-700 text-xs font-semibold mb-2 uppercase tracking-wider">
                        Subject Name
                    </Text>
                    <TextInput
                        className="bg-gray-50 border border-gray-200 text-gray-900 px-4 py-4 rounded-xl text-base"
                        placeholder="e.g. Data Structures"
                        placeholderTextColor="#9ca3af"
                        value={subject}
                        onChangeText={setSubject}
                        autoCapitalize="words"
                        editable={!loading}
                        returnKeyType="go"
                        onSubmitEditing={handleStartSession}
                    />

                    <View className="flex-row items-center bg-blue-50 rounded-xl p-4 mt-5">
                        <View className="w-2 h-2 rounded-full bg-blue-500 mr-3" />
                        <Text className="text-blue-700 text-xs flex-1">
                            Session start karte hi phone BLE broadcast karega. Students 10-15 meter ke andar apna attendance mark kar payenge.
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={handleStartSession}
                        disabled={loading}
                        className={`py-4 rounded-xl items-center shadow-lg shadow-blue-500/30 mt-6 ${loading ? 'bg-blue-400' : 'bg-blue-600'}`}
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
        </KeyboardAvoidingView>
    )
}

export default CreateSessionScreen