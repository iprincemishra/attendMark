import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Image,
    ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import * as Application from 'expo-application';
import CustomAlert from '@/components/CustomAlert';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    FadeIn,
    FadeOut
} from 'react-native-reanimated';
import DeveloperBadge from '@/components/DeveloperBadge';

export default function LoginScreen() {
    const router = useRouter();
    const { login } = useAuth();

    const [role, setRole] = useState<'student' | 'teacher'>('student');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rollNumber, setRollNumber] = useState('');
    const [loading, setLoading] = useState(false);

    const [alert, setAlert] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'info' as 'success' | 'error' | 'info',
    });

    const showAlert = (
        title: string,
        message: string,
        type: 'success' | 'error' | 'info' = 'info') => {
        setAlert({
            visible: true,
            title,
            message,
            type
        });
    };

    const closeAlert = () => setAlert(prev => ({ ...prev, visible: false }));

    const tabOffset = useSharedValue(0);

    const switchTab = (selectedRole: 'student' | 'teacher') => {
        setRole(selectedRole);
        tabOffset.value = withTiming(selectedRole === 'student' ? 0 : 1, { duration: 250 });
    };

    const animatedSliderStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: `${tabOffset.value * 100}%` }],
    }));

    const getDeviceId = async () => {
        let deviceId = '';
        if (Platform.OS === 'android') {
            deviceId = Application.getAndroidId() || '';
        } else if (Platform.OS === 'ios') {
            deviceId = await Application.getIosIdForVendorAsync() || '';
        }
        return deviceId;
    };

    const handleLogin = async () => {
        if (role === 'teacher' && (!email || !password)) {
            showAlert('Required Fields', 'Please enter both your email and password.', 'error');
            return;
        }
        if (role === 'student' && (!email || !rollNumber)) {
            showAlert('Required Fields', 'Please enter both your email and roll number.', 'error');
            return;
        }

        try {
            setLoading(true);
            let response;

            if (role === 'teacher') {
                response = await api.post('/auth/teacher-login', {
                    email: email.toLowerCase().trim(),
                    password
                });
            } else {
                const deviceId = await getDeviceId();

                response = await api.post('/auth/student-login', {
                    email: email.toLowerCase().trim(),
                    rollNumber: rollNumber.trim(),
                    deviceId: deviceId
                });
            }

            const { success, token, message, data: user } = response.data;

            if (!success || !token || !user) {
                throw new Error(message || 'Login failed. Please check your credentials.');
            }

            await login(token, user);

            if (user?.role?.toUpperCase() === 'TEACHER') {
                router.replace('/(teacher)/dashboard');
            } else {
                router.replace('/(student)/dashboard');
            }

        } catch (error: any) {
            const errMessage = error.response?.data?.message || error.message || 'Invalid credentials. Please try again.';
            showAlert('Login Failed', errMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-white"
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
                className="flex-1"
                showsVerticalScrollIndicator={false}
            >
                <View className="py-16 flex-1 bg-white justify-center px-14 gap-24">
                    <View className="items-center mt-4">
                        <Image
                            source={require('@/assets/images/icon.png')}
                            className="w-20 h-20 mb-3"
                            resizeMode="contain"
                        />
                        <Text className="text-3xl font-black text-gray-900 tracking-tight">
                            AttendMark
                        </Text>
                        <Text className="text-gray-400 text-sm mt-1">
                            Smart Proximity Attendance
                        </Text>
                    </View>

                    <View className="my-8">
                        <View className="relative flex-row bg-gray-100 p-1 rounded-2xl mb-6 overflow-hidden">
                            <Animated.View
                                style={animatedSliderStyle}
                                className="absolute left-1 top-1 bottom-1 w-1/2 bg-blue-600 rounded-xl"
                            />

                            <TouchableOpacity
                                onPress={() => switchTab('student')}
                                className="flex-1 py-3 items-center z-10"
                                activeOpacity={0.8}
                            >
                                <Text className={`font-bold text-sm ${role === 'student' ? 'text-white' : 'text-gray-500'}`}>
                                    Student
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => switchTab('teacher')}
                                className="flex-1 py-3 items-center z-10"
                                activeOpacity={0.8}
                            >
                                <Text className={`font-bold text-sm ${role === 'teacher' ? 'text-white' : 'text-gray-500'}`}>
                                    Teacher
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View className="space-y-4">
                            <View>
                                <Text className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                                    Email Address
                                </Text>
                                <TextInput
                                    className="bg-gray-50 border border-gray-200 text-gray-900 px-4 py-3.5 rounded-xl text-base"
                                    placeholder={role === 'student' ? 'student@gccba.edu.in' : 'teacher@gccba.edu.in'}
                                    placeholderTextColor="#9ca3af"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    returnKeyType="next"
                                />
                            </View>

                            {role === 'teacher' ? (
                                <Animated.View
                                    key="teacher-input"
                                    entering={FadeIn.duration(200)}
                                    exiting={FadeOut.duration(150)}
                                    className="mt-3"
                                >
                                    <Text className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                                        Password
                                    </Text>
                                    <TextInput
                                        className="bg-gray-50 border border-gray-200 text-gray-900 px-4 py-3.5 rounded-xl text-base"
                                        placeholder="Enter your password"
                                        placeholderTextColor="#9ca3af"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                        returnKeyType="done"
                                        onSubmitEditing={handleLogin}
                                    />
                                </Animated.View>
                            ) : (
                                <Animated.View
                                    key="student-input"
                                    entering={FadeIn.duration(200)}
                                    exiting={FadeOut.duration(150)}
                                    className="mt-3"
                                >
                                    <Text className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                                        Roll Number
                                    </Text>
                                    <TextInput
                                        className="bg-gray-50 border border-gray-200 text-gray-900 px-4 py-3.5 rounded-xl text-base"
                                        placeholder="e.g. 24330XX/24"
                                        placeholderTextColor="#9ca3af"
                                        value={rollNumber}
                                        onChangeText={setRollNumber}
                                        keyboardType="default"
                                        returnKeyType="done"
                                        onSubmitEditing={handleLogin}
                                    />
                                </Animated.View>
                            )}

                            <TouchableOpacity
                                onPress={handleLogin}
                                disabled={loading}
                                activeOpacity={0.8}
                                className="bg-[#0083C3] py-4 rounded-xl items-center shadow-md shadow-[#0083C3]/30 mt-6"
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="#ffffff" />
                                ) : (
                                    <Text className="text-white font-bold text-base tracking-wide">
                                        Sign In
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    <DeveloperBadge />
                </View>
            </ScrollView>
            <CustomAlert
                visible={alert.visible}
                title={alert.title}
                message={alert.message}
                type={alert.type}
                onClose={closeAlert}
            />
        </KeyboardAvoidingView>
    );
}