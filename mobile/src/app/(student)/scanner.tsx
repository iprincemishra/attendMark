import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useRouter } from 'expo-router';
import { bleService } from "@/services/ble";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { getDeviceUuid } from "@/utils/secureStore";

const ScannerScreen = () => {
    const router = useRouter();
    const { user } = useAuth();

    const [scanning, setScanning] = useState(false);
    const [loading, setLoading] = useState(false);
    const [foundSession, setFoundSession] = useState<{
        token: string;
        deviceName: string
    } | null>(null);

    useEffect(() => {
        return () => {
            bleService.stopScanning();
        };
    }, []);

    const startScan = async () => {
        try {
            setScanning(true);
            setFoundSession(null);

            await bleService.startScanning((device, token) => {
                console.log('Found AttendMark Session Device:', device.name);
                setFoundSession({
                    token,
                    deviceName: device.name || 'Teacher Beacon'
                });
                bleService.stopScanning();
                setScanning(false);
            });

            setTimeout(() => {
                if (scanning) {
                    stopScan();
                    Alert.alert('Scan Timeout', 'No teacher device found nearby. Make sure you are in the classroom.');
                }
            }, 15000);

        } catch (error: any) {
            Alert.alert('Scan Error', error.message || 'Failed to start BLE scan');
            setScanning(false);
        }
    };

    const stopScan = () => {
        bleService.stopScanning();
        setScanning(false);
    };

    const markAttendance = async () => {
        if (!foundSession) return;

        try {
            setLoading(true);

            const deviceId = await getDeviceUuid();

            const tokenParts = foundSession.token.split(':');
            const sessionId = tokenParts[0];
            const actualToken = tokenParts.length > 1 ? tokenParts[1] : null;

            if (!sessionId || !actualToken) {
                throw new Error('Invalid session token format');
            }

            const response = await api.post('/attendance/mark', {
                sessionId,
                token: actualToken,
                deviceId: deviceId,
                timestamp: new Date().toISOString(),
            });

            const { success, message } = response.data;
            if (!success) {
                throw new Error(message || 'Failed to mark attendance');
            }

            Alert.alert('Success! 🎉', 'Teri attendance lag gayi bhai!', [
                {
                    text: 'OK',
                    onPress: () => router.back()
                }
            ]);
        } catch (error: any) {
            const errMessage = error.response?.data?.message || error.message || 'Something went wrong';
            Alert.alert('Attendance Failed', errMessage);
        } finally {
            setLoading(false);
        }
    }

    return (
        <View className="flex-1 bg-white items-center justify-center p-6">
            <View className="items-center mb-12">
                <Text className="text-3xl font-bold text-gray-800 mb-2">Scan for Class</Text>
                <Text className="text-gray-500 text-center px-4">
                    Ensure Bluetooth is on and you are physically present in the classroom.
                </Text>
            </View>

            {!foundSession ? (
                <View className="items-center justify-center h-64">
                    {scanning ? (
                        <View className="items-center">
                            <View className="bg-blue-100 p-8 rounded-full mb-6">
                                <ActivityIndicator size="large" color="#208AEF" />
                            </View>
                            <Text className="text-lg text-blue-500 font-semibold mb-6">
                                Looking for Teacher's Signal...
                            </Text>
                            <TouchableOpacity
                                className="bg-red-50 px-8 py-3 rounded-full border border-red-200"
                                onPress={stopScan}
                            >
                                <Text className="text-red-500 font-bold">Stop Scan</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            className="bg-blue-500 h-48 w-48 rounded-full items-center justify-center shadow-2xl shadow-blue-400 border-4 border-blue-400"
                            onPress={startScan}
                        >
                            <Text className="text-white font-bold text-2xl tracking-wider">SCAN</Text>
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                <View className="w-full bg-blue-50 p-6 rounded-3xl border border-blue-100 items-center shadow-sm">
                    <View className="bg-white p-4 rounded-full mb-4 shadow-sm">
                        <Text className="text-4xl">📡</Text>
                    </View>
                    <Text className="text-2xl font-bold text-gray-800 mb-1">Session Found!</Text>
                    <Text className="text-gray-500 mb-8 font-medium">Device: {foundSession.deviceName}</Text>

                    <TouchableOpacity
                        className={`w-full py-4 rounded-2xl items-center shadow-md ${loading ? 'bg-blue-300' : 'bg-blue-600'}`}
                        onPress={markAttendance}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-bold text-xl">Mark Present</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="mt-6 p-2"
                        onPress={() => setFoundSession(null)}
                        disabled={loading}
                    >
                        <Text className="text-gray-400 font-bold">Scan Again</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    )
}

export default ScannerScreen;