import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { AnimatedSplash }         from '@/components/ui/AnimatedSplash';
import { BalancedAnimatedSplash } from '@/components/ui/BalancedAnimatedSplash';
import { HardcoreAnimatedSplash } from '@/components/ui/HardcoreAnimatedSplash';
import { ThemeKey } from '@/types';

// ─── Theme-matched sounds ─────────────────────────────────────────────────────

const SOUNDS: Record<ThemeKey, ReturnType<typeof require>> = {
  soft:     require('../assets/soft.mp3'),
  balanced: require('../assets/balanced.mp3'),
  hardcore: require('../assets/hardcore.mp3'),
};

// ─── Play the sound that matches the current theme ────────────────────────────

async function playLaunchSound(themeKey: ThemeKey) {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
    const { sound } = await Audio.Sound.createAsync(
      SOUNDS[themeKey],
      { shouldPlay: true, volume: 1.0 },
    );
    // Unload after 6s — safely covers the longest intro (3.6s)
    setTimeout(() => sound.unloadAsync().catch(() => {}), 6000);
  } catch {
    // Silently ignore — sound is non-critical
  }
}

// ─── Splash picker ────────────────────────────────────────────────────────────

function ThemeSplash({ themeKey, onFinish }: { themeKey: ThemeKey; onFinish: () => void }) {
  if (themeKey === 'soft')     return <AnimatedSplash         onFinish={onFinish} />;
  if (themeKey === 'hardcore') return <HardcoreAnimatedSplash onFinish={onFinish} />;
  return                              <BalancedAnimatedSplash  onFinish={onFinish} />;
}

// ─── Inner layout (has access to theme) ──────────────────────────────────────

function RootLayoutInner() {
  const { theme, themeKey, isLoaded } = useTheme();
  const [showIntro, setShowIntro] = useState(true);
  const soundStarted = useRef(false);

  useEffect(() => {
    if (isLoaded && !soundStarted.current) {
      soundStarted.current = true;
      playLaunchSound(themeKey);
    }
  }, [isLoaded]);

  if (!isLoaded) return null;

  // ── Show the theme-matched splash on every app open ──
  if (showIntro) {
    return (
      <>
        <StatusBar style={themeKey === 'soft' ? 'dark' : 'light'} />
        <ThemeSplash themeKey={themeKey} onFinish={() => setShowIntro(false)} />
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
