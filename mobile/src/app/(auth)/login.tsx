import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import * as Application from 'expo-application';
import CustomAlert from '@/components/CustomAlert';

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
            className="flex-1 bg-slate-950 justify-center px-6"
        >
            <View className="bg-slate-900 px-8 py-6 rounded-3xl border border-slate-800 shadow-xl mb-20">

                <View className="mb-8">
                    <Text className="text-4xl font-bold text-white mb-2">AttendMark</Text>
                    <Text className="text-slate-400 text-sm">Sign in to your account</Text>
                </View>

                <View className="flex-row bg-slate-950 rounded-xl p-1 mb-6 border border-slate-800">
                    <TouchableOpacity
                        onPress={() => setRole('student')}
                        className={`flex-1 py-3 rounded-lg items-center ${role === 'student' ? 'bg-blue-600' : 'bg-transparent'}`}
                    >
                        <Text className={`font-semibold ${role === 'student' ? 'text-white' : 'text-slate-400'}`}>
                            Student
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setRole('teacher')}
                        className={`flex-1 py-3 rounded-lg items-center ${role === 'teacher' ? 'bg-blue-600' : 'bg-transparent'}`}
                    >
                        <Text className={`font-semibold ${role === 'teacher' ? 'text-white' : 'text-slate-400'}`}>
                            Teacher
                        </Text>
                    </TouchableOpacity>
                </View>

                <View className="mb-4">
                    <Text className="text-slate-300 text-xs font-semibold mb-2 uppercase tracking-wider">Email Address</Text>
                    <TextInput
                        className="bg-slate-950 border border-slate-800 text-white px-4 py-4 rounded-xl text-base mb-5"
                        placeholder={role === 'student' ? "student@gccba.edu.in" : "teacher@gccba.edu.in"}
                        placeholderTextColor="#475569"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />

                    {role === 'teacher' ? (
                        <>
                            <Text className="text-slate-300 text-xs font-semibold mb-2 uppercase tracking-wider">Password</Text>
                            <TextInput
                                className="bg-slate-950 border border-slate-800 text-white px-4 py-4 rounded-xl text-base mb-8"
                                placeholder="Enter your password"
                                placeholderTextColor="#475569"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </>
                    ) : (
                        <>
                            <Text className="text-slate-300 text-xs font-semibold mb-2 uppercase tracking-wider">Roll Number</Text>
                            <TextInput
                                className="bg-slate-950 border border-slate-800 text-white px-4 py-4 rounded-xl text-base mb-8"
                                placeholder="e.g. 2433029/24"
                                placeholderTextColor="#475569"
                                value={rollNumber}
                                onChangeText={setRollNumber}
                                keyboardType="default"
                            />
                        </>
                    )}

                    {loading ? (
                        <ActivityIndicator size="large" color="#3b82f6" />
                    ) : (
                        <TouchableOpacity
                            onPress={handleLogin}
                            className="bg-blue-600 py-4 rounded-xl items-center shadow-lg shadow-blue-500/30"
                        >
                            <Text className="text-white font-bold text-lg">Login</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
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