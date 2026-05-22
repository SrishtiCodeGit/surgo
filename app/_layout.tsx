import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { BalancedAnimatedSplash } from '@/components/ui/BalancedAnimatedSplash';

// ─── Play launch sound (works even on silent mode) ────────────────────────────

async function playLaunchSound() {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/open.mp3'),
      { shouldPlay: true, volume: 1.0 },
    );
    // Unload after 6s — safely covers the 3.6s intro
    setTimeout(() => sound.unloadAsync().catch(() => {}), 6000);
  } catch {
    // Silently ignore — sound is non-critical
  }
}

// ─── Inner layout (has access to theme) ──────────────────────────────────────

function RootLayoutInner() {
  const { theme, isLoaded } = useTheme();
  const [showIntro, setShowIntro] = useState(true);
  const soundStarted = useRef(false);

  useEffect(() => {
    if (isLoaded && !soundStarted.current) {
      soundStarted.current = true;
      playLaunchSound();
    }
  }, [isLoaded]);

  if (!isLoaded) return null;

  // ── Show branded splash intro on every app open ──
  if (showIntro) {
    return (
      <>
        <StatusBar style="light" />
        <BalancedAnimatedSplash onFinish={() => setShowIntro(false)} />
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

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutInner />
    </ThemeProvider>
  );
}
