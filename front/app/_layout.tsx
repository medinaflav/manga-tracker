import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StatusBarStyle } from "expo-status-bar";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useTheme } from "@/contexts/ThemeContext";
import { detectBackendURL } from "@/utils/api";
import { useEffect } from "react";

// Ajout d'un flag pour le mode dev (doit matcher index.tsx)
const DEV_MODE = true;

function AppContent() {
  const { currentTheme, colors } = useTheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  // Détecter automatiquement le backend au démarrage
  useEffect(() => {
    console.log('🚀 App starting, detecting backend...');
    detectBackendURL().then(url => {
      console.log('✅ Backend detection completed:', url);
    }).catch(err => {
      console.error('❌ Backend detection failed:', err);
    });
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <AuthProvider>
        <NavigationThemeProvider value={currentTheme === "dark" ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ contentStyle: { backgroundColor: colors.background } }}>
            {!DEV_MODE && <Stack.Screen name="login" options={{ headerShown: false }} />}
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="reader" options={{ headerShown: false }} />
            <Stack.Screen name="manga/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style={currentTheme === 'dark' ? 'light-content' as StatusBarStyle : 'dark-content' as StatusBarStyle} backgroundColor={colors.background} />
        </NavigationThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
