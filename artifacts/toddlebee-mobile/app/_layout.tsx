import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  useFonts as useDMSansFonts,
} from '@expo-google-fonts/dm-sans';
import {
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
  useFonts,
} from '@expo-google-fonts/nunito';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { setBaseUrl } from '@workspace/api-client-react';
import { AppSettingsProvider } from '@/src/settings';
import { DemoAuthProvider, useDemoAuth } from '@/src/auth';
import { useRouter, useSegments } from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();
const configuredApiUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const apiDomain = process.env.EXPO_PUBLIC_DOMAIN?.trim();
const apiBaseUrl = configuredApiUrl || (apiDomain ? `https://${apiDomain}` : null);
setBaseUrl(apiBaseUrl ? (/^https?:\/\//i.test(apiBaseUrl) ? apiBaseUrl : `https://${apiBaseUrl}`) : null);

function RootLayoutNav() {
  const { ready, signedIn } = useDemoAuth();
  const segments = useSegments();
  const router = useRouter();
  useEffect(() => {
    if (!ready) return;
    const atLogin = segments[0] === 'login';
    if (!signedIn && !atLogin) router.replace('/login');
    if (signedIn && atLogin) router.replace('/');
  }, [ready, signedIn, segments, router]);
  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Protected guard={!ready || !signedIn}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={ready && signedIn}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="craft" options={{ headerShown: false }} />
        <Stack.Screen name="craft-lotus" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [dmSansLoaded, dmSansError] = useDMSansFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });
  const [nunitoLoaded, nunitoError] = useFonts({
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });
  const fontsLoaded = dmSansLoaded && nunitoLoaded;
  const fontError = dmSansError || nunitoError;

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView>
            <KeyboardProvider>
              <AppSettingsProvider>
                <DemoAuthProvider>
                  <RootLayoutNav />
                </DemoAuthProvider>
              </AppSettingsProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
