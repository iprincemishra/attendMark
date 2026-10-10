import { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from 'expo-router';
import { bleService } from "@/services/ble";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { getDeviceUuid } from "@/utils/secureStore";
import { Ionicons } from "@expo/vector-icons";
import CustomAlert from "@/components/CustomAlert";
import * as Haptics from "expo-haptics"

const ScannerScreen = () => {
    const router = useRouter();
    const { user } = useAuth();

    const [scanning, setScanning] = useState(false);
    const [loading, setLoading] = useState(false);
    const [foundSession, setFoundSession] = useState<{
        sessionCode: string;
        deviceName: string
    } | null>(null);

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
    ) => setAlert({ visible: true, title, message, type, onConfirm })

    const closeAlert = () => setAlert(prev => ({ ...prev, visible: false }))

    const scanningRef = useRef(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearTimer = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    };

    useEffect(() => {
        return () => {
            clearTimer();
            bleService.stopScanning();
        };
    }, []);

    const startScan = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        try {
            setScanning(true);
            scanningRef.current = true
            setFoundSession(null);
            clearTimer()

            await bleService.startScanning((eventData: any) => {

                const code = eventData?.parsedData || eventData;
                const address = eventData?.deviceAddress || 'Teacher Beacon';

                clearTimer()
                scanningRef.current = false

                setFoundSession({
                    sessionCode: code,
                    deviceName: address
                });
                bleService.stopScanning();
                setScanning(false);
            });

            timeoutRef.current = setTimeout(() => {
                if (scanningRef.current) {
                    stopScan();
                    showAlert(
                        'Scan Timeout',
                        'No teacher device found nearby. Make sure you are in the classroom.',
                        'error'
                    );
                }
            }, 15000);

        } catch (error: any) {
            setScanning(false);
            scanningRef.current = false;

            const errMsg = error.message || 'Failed to start BLE scan';
            let displayMsg = errMsg;
            if (errMsg.includes('not supported') || errMsg.toLowerCase().includes('bluetooth')) {
                displayMsg = "Please turn on your device's Bluetooth and Location to scan for classes.";
            }

            showAlert('Bluetooth Error', displayMsg, 'error');
        }
    };

    const stopScan = () => {
        clearTimer()
        scanningRef.current = false
        bleService.stopScanning();
        setScanning(false);
    };

    const markAttendance = async () => {
        if (!foundSession) return;

        try {
            setLoading(true);

            const deviceId = (await getDeviceUuid()) || user?.deviceId;
            if (!deviceId) {
                showAlert("Authentication Error", "Device ID missing. Please re-login.", 'error');
                setLoading(false);
                return;
            }

            const response = await api.post('/attendance/mark', {
                sessionCode: foundSession.sessionCode,
                deviceId: deviceId,
                timestamp: Date.now(),
            });

            const { success, message } = response.data;
            if (!success) {
                throw new Error(message || 'Failed to mark attendance');
            }

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            showAlert(
                'Success!',
                'Your attendance has been marked successfully.',
                'success',
                () => {
                    closeAlert();
                    router.back();
                }
            );
        } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            const errMessage = error.response?.data?.message || error.message || 'Something went wrong';
            showAlert('Attendance Failed', errMessage, 'error');
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
                            <Text className="text-white/10 font-bold text-5xl tracking-wider absolute">SCAN</Text>
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                <View className="w-full bg-blue-50 p-6 rounded-3xl border border-blue-100 items-center shadow-sm">
                    <View className="bg-white p-4 rounded-full mb-4 shadow-sm">
                        <Ionicons name="radio" size={36} color="#2563eb" />
                    </View>
                    <Text className="text-2xl font-bold text-gray-800 mb-1">Session Found!</Text>

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
            <CustomAlert
                visible={alert.visible}
                title={alert.title}
                message={alert.message}
                type={alert.type}
                onClose={closeAlert}
                onConfirm={alert.onConfirm}
                confirmText={alert.onConfirm ? 'OK' : 'Got it'}
            />
        </View>
    )
}

export default ScannerScreen;