import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { AnimatedSplash } from '@/components/ui/AnimatedSplash';

function RootLayoutInner() {
  const { theme, isLoaded } = useTheme();
  const [splashDone, setSplashDone] = useState(false);

  // Show animated splash while theme loads or splash hasn't finished
  if (!isLoaded || !splashDone) {
    return (
      <>
        <StatusBar style="dark" />
        <AnimatedSplash onFinish={() => setSplashDone(true)} />
      </>
    );
  }

  return (
    <>
      <StatusBar style={theme.key === 'hardcore' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="goal/[id]"
          options={{
            headerShown: true,
            headerTitle: 'Goal',
            headerStyle: { backgroundColor: theme.colors.background },
            headerTintColor: theme.colors.primary,
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="review"
          options={{
            headerShown: true,
            headerTitle: 'Nightly Review',
            headerStyle: { backgroundColor: theme.colors.background },
            headerTintColor: theme.colors.primary,
            headerBackTitle: 'Back',
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutInner />
    </ThemeProvider>
  );
}
