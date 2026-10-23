import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { View } from 'react-native';
import '../../global.css';
import { useEffect } from 'react';
import NetInfo from "@react-native-community/netinfo"
import { attendanceQueue } from '@/services/attendanceQueue';

export default function RootLayout() {

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        attendanceQueue.processQueue().then(result => {
          if (result.synced > 0 || result.failed > 0) {
            console.log(`[Offline Sync] Synced: ${result.synced}, Failed: ${result.failed}`);
          }
        })
      }
    })

    return () => unsubscribe()
  }, [])

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