import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Audio } from 'expo-av';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';

// ─── Play launch sound once when app opens ────────────────────────────────────

async function playLaunchSound() {
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: false });
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/open.mp3'),
      { shouldPlay: true, volume: 0.7 },
    );
    // Unload after playback to free memory
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch {
    // Silently ignore — sound is non-critical
  }
}

// ─── Inner layout (has access to theme) ──────────────────────────────────────

function RootLayoutInner() {
  const { theme, isLoaded } = useTheme();

  useEffect(() => {
    if (isLoaded) playLaunchSound();
  }, [isLoaded]);

  if (!isLoaded) return null;

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

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutInner />
    </ThemeProvider>
  );
}
