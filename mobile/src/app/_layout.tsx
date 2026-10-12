import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { View } from 'react-native';
import '../../global.css';

export default function RootLayout() {
  return (
    <AuthProvider>
      <View className="flex-1 bg-gray-50">
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor: '#f9fafb' },
          }}
        />
      </View>
    </AuthProvider>
  );
}