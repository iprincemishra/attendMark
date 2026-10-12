import { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from 'expo-router';
import { bleService } from "@/services/ble";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { getDeviceUuid } from "@/utils/secureStore";
import { Ionicons, Feather } from "@expo/vector-icons";
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
        <View className="flex-1 bg-gray-50">

            <View className="bg-blue-600 pt-16 pb-8 rounded-b-3xl shadow-md">
                <View className="flex-row items-center gap-5 px-6">
                    <TouchableOpacity
                        onPress={() => {
                            stopScan()
                            router.back()
                        }}
                        className="bg-white p-2.5 rounded-full border border-gray-200 shadow-sm"
                    >
                        <Feather name="arrow-left" size={20} color="#374151" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-white text-3xl font-bold">Scan for Class</Text>
                        <Text className="text-blue-200 mt-1 w-[330px]">Ensure Bluetooth is enabled and you are seated inside the classroom.</Text>
                    </View>
                </View>
            </View>

            <View className="flex-1 items-center justify-center px-6 pb-12">
                {!foundSession ? (
                    <View className="items-center justify-center w-full">
                        {scanning ? (
                            <View className="bg-white w-full max-w-sm p-8 rounded-3xl items-center shadow-sm border border-gray-100">
                                <View className="bg-blue-50 p-6 rounded-full mb-6">
                                    <ActivityIndicator size="large" color="#2563eb" />
                                </View>
                                <Text className="text-lg text-blue-600 font-bold mb-2">
                                    Searching for Beacon...
                                </Text>
                                <Text className="text-gray-400 text-xs text-center mb-8">
                                    Listening for active teacher broadcast signals nearby
                                </Text>
                                <TouchableOpacity
                                    className="w-full bg-red-50 py-3.5 rounded-2xl border border-red-100 items-center"
                                    onPress={stopScan}
                                >
                                    <Text className="text-red-500 font-bold text-sm">Cancel Scan</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View className="items-center">
                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    className="bg-blue-600 h-52 w-52 rounded-full items-center justify-center shadow-xl shadow-blue-500/30 border-8 border-blue-100"
                                    onPress={startScan}
                                >
                                    <View className="items-center justify-center">
                                        <Ionicons name="radio-outline" size={100} style={{ opacity: 0.3 }} color="white" />
                                        <Text className="text-white absolute font-black text-3xl tracking-widest">SCAN</Text>
                                    </View>
                                </TouchableOpacity>
                                <Text className="text-gray-400 text-xs mt-8 font-medium">Tap to start searching</Text>
                            </View>
                        )}
                    </View>
                ) : (
                    <View className="w-full max-w-sm bg-white p-8 rounded-3xl border border-gray-100 items-center shadow-xl">
                        <View className="bg-green-50 p-4 rounded-full mb-4 shadow-sm border border-green-100">
                            <Ionicons name="checkmark-circle" size={40} color="#16a34a" />
                        </View>
                        <Text className="text-2xl font-black text-gray-900 mb-1">Session Found!</Text>
                        <Text className="text-gray-500 text-xs mb-8">Teacher broadcast detected successfully</Text>

                        <TouchableOpacity
                            className={`w-full py-4 rounded-2xl items-center shadow-md mb-3 ${loading ? 'bg-blue-300' : 'bg-blue-600 shadow-blue-500/20'}`}
                            onPress={markAttendance}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-bold text-base tracking-wide">Mark Present</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="py-2 px-4"
                            onPress={() => setFoundSession(null)}
                            disabled={loading}
                        >
                            <Text className="text-gray-400 font-semibold text-sm">Scan Again</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

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