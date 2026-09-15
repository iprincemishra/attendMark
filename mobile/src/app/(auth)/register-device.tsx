import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as Device from "expo-device";
import { api } from '@/services/api';

const RegisterDeviceScreen = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleRegisterDevice = async () => {
        try {
            setLoading(true);
            const deviceId =
                Device.osInternalBuildId ||
                Device.modelId ||
                Device.deviceName ||
                'unknown_device';

            const response = await api.post('/auth/register-device', {
                deviceId,
                modelName: Device.modelName,
                osName: Device.osName,
            });

            const { success, message } = response.data;
            if (!success) {
                throw new Error(message || 'Failed to bind device');
            }

            Alert.alert('Device Locked! 🔒', 'Tera phone successfully register ho gaya hai.', [
                { text: 'OK', onPress: () => router.replace('/(student)/dashboard') }
            ]);
        } catch (error: any) {
            const errMessage = error.response?.data?.error || error.message || 'Something went wrong';
            Alert.alert('Registration Failed', errMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-white items-center justify-center p-6">
            <View className="items-center mb-10 w-full">
                <View className="bg-blue-50 p-6 rounded-full mb-8 border border-blue-100 shadow-sm">
                    <Text className="text-6xl">📱🔒</Text>
                </View>

                <Text className="text-3xl font-bold text-gray-800 mb-4 text-center">
                    Secure Your Account
                </Text>

                <Text className="text-gray-500 text-center px-4 text-base leading-relaxed mb-6">
                    To maintain attendance integrity, your student account must be bound to this specific physical device.
                </Text>

                <View className="bg-red-50 w-full p-4 rounded-xl border border-red-100">
                    <Text className="font-bold text-red-600 mb-1">⚠️ Important Note:</Text>
                    <Text className="text-red-500 text-sm">
                        You will not be able to mark attendance from any other phone after this step. Only do this on your personal device.
                    </Text>
                </View>
            </View>

            <TouchableOpacity
                className={`w-full py-4 rounded-2xl items-center shadow-md ${loading ? 'bg-blue-300' : 'bg-blue-600'}`}
                onPress={handleRegisterDevice}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text className="text-white font-bold text-xl tracking-wide">
                        Lock Device to Account
                    </Text>
                )}
            </TouchableOpacity>
        </View>
    );
};

export default RegisterDeviceScreen;