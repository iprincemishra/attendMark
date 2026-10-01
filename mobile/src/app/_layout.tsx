import { Slot } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { View } from 'react-native';
import '../../global.css';

export default function RootLayout() {
  return (
    <AuthProvider>
      <View className="flex-1 bg-slate-950">
        <Slot />
      </View>
    </AuthProvider>
  );
}