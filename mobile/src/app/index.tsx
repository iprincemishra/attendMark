import { View, ActivityIndicator } from "react-native";
import { useRouter, useSegments } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

export default function Index() {
  const { token, user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!token && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (token && user) {
      if (user.role === 'TEACHER') {
        router.replace('/(teacher)/dashboard');
      } else {
        router.replace('/(student)/dashboard');
      }
    }
  }, [token, user, isLoading, segments]);

  return (
    <View className="flex-1 items-center justify-center bg-slate-950">
      <ActivityIndicator size="large" color="#3b82f6" />
    </View>
  );
}