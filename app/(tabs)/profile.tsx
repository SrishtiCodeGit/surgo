import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { themes, themeKeys } from '@/lib/theme';
import { ThemeKey } from '@/types';
import { AnimatedSplash } from '@/components/ui/AnimatedSplash';
import { HardcoreAnimatedSplash } from '@/components/ui/HardcoreAnimatedSplash';
import { BalancedAnimatedSplash } from '@/components/ui/BalancedAnimatedSplash';
import { MascotFaceIcon } from '@/components/ui/MascotFaceIcon';

const SETTINGS_ROWS = [
  { label: 'Notification Time', value: '9:00 AM' },
  { label: 'Account',           value: ''        },
  { label: 'About Surgo',       value: 'v1.0'   },
];

export default function ProfileScreen() {
  const { theme, themeKey, setTheme } = useTheme();
  const [showSoftSplash,     setShowSoftSplash]     = useState(false);
  const [showHardcoreSplash, setShowHardcoreSplash] = useState(false);
  const [showBalancedSplash, setShowBalancedSplash] = useState(false);

  const handleThemeSelect = (key: ThemeKey) => {
    if (key === 'soft')     setShowSoftSplash(true);
    if (key === 'hardcore') setShowHardcoreSplash(true);
    if (key === 'balanced') setShowBalancedSplash(true);
    setTheme(key);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Modal visible={showSoftSplash} animationType="fade" statusBarTranslucent>
        <AnimatedSplash onFinish={() => { setShowSoftSplash(false); router.replace('/(tabs)'); }} />
      </Modal>
      <Modal visible={showHardcoreSplash} animationType="fade" statusBarTranslucent>
        <HardcoreAnimatedSplash onFinish={() => { setShowHardcoreSplash(false); router.replace('/(tabs)'); }} />
      </Modal>
      <Modal visible={showBalancedSplash} animationType="fade" statusBarTranslucent>
        <BalancedAnimatedSplash onFinish={() => { setShowBalancedSplash(false); router.replace('/(tabs)'); }} />
      </Modal>

      <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 56 }}>

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <View style={{ marginBottom: 28 }}>
          <Text
            style={{
              color: theme.colors.text,
              fontSize: 32,
              fontWeight: '900',
              letterSpacing: -0.8,
            }}
          >
            Profile
          </Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: 14, marginTop: 4 }}>
            Your Surgo identity
          </Text>
        </View>

        {/* ── Active theme hero ─────────────────────────────────────────────── */}
        <View
          style={{
            backgroundColor: theme.colors.primary,
            borderRadius: 22,
            padding: 20,
            marginBottom: 14,
            overflow: 'hidden',
          }}
        >
          {/* Label */}
          <Text
            style={{
              color: theme.colors.textInverse,
              fontSize: 10,
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: 2.5,
              opacity: 0.65,
              marginBottom: 14,
            }}
          >
            Active mode
          </Text>

          {/* Mascot + name */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <View style={{ width: 54, height: 54, borderRadius: 27, overflow: 'hidden' }}>
              <MascotFaceIcon variant={themeKey} size={54} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: theme.colors.textInverse,
                  fontSize: 24,
                  fontWeight: '900',
                  letterSpacing: -0.5,
                }}
              >
                {theme.name}
              </Text>
              <Text
                style={{
                  color: theme.colors.textInverse,
                  opacity: 0.70,
                  fontSize: 13,
                  marginTop: 2,
                  fontWeight: '500',
                }}
              >
                {theme.tagline}
              </Text>
            </View>
          </View>

          {/* Colour swatches */}
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {[theme.colors.accent, theme.colors.success, theme.colors.warning, theme.colors.streakFire].map((c, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: c,
                  opacity: 0.80,
                }}
              />
            ))}
          </View>
        </View>

        {/* ── Section label ─────────────────────────────────────────────────── */}
        <Text
          style={{
            color: theme.colors.textMuted,
            fontSize: 10,
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: 2.5,
            marginBottom: 12,
            marginTop: 18,
          }}
        >
          Switch mode
        </Text>

        {/* ── Theme cards ───────────────────────────────────────────────────── */}
        <View style={{ gap: 10, marginBottom: 36 }}>
          {themeKeys.map((key) => {
            const t = themes[key];
            if (themeKey === key) return null;

            return (
              <TouchableOpacity
                key={key}
                onPress={() => handleThemeSelect(key as ThemeKey)}
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderWidth: 1,
                  borderRadius: 18,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                }}
                activeOpacity={0.72}
              >
                {/* Mascot face */}
                <View style={{ width: 48, height: 48, borderRadius: 24, overflow: 'hidden' }}>
                  <MascotFaceIcon variant={key as ThemeKey} size={48} />
                </View>

                {/* Name + tagline */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: theme.colors.text,
                      fontSize: 16,
                      fontWeight: '800',
                      letterSpacing: -0.2,
                      marginBottom: 3,
                    }}
                  >
                    {t.name}
                  </Text>
                  <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '500' }}>
                    {t.tagline}
                  </Text>
                </View>

                {/* Colour dots only — no arrow button */}
                <View style={{ gap: 5 }}>
                  {[t.colors.primary, t.colors.accent, t.colors.success].map((c, i) => (
                    <View
                      key={i}
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: 3.5,
                        backgroundColor: c,
                      }}
                    />
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Settings ──────────────────────────────────────────────────────── */}
        <Text
          style={{
            color: theme.colors.textMuted,
            fontSize: 10,
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: 2.5,
            marginBottom: 12,
          }}
        >
          Settings
        </Text>

        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: 18,
            borderColor: theme.colors.border,
            borderWidth: 1,
            overflow: 'hidden',
          }}
        >
          {SETTINGS_ROWS.map((row, i) => (
            <TouchableOpacity
              key={row.label}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 18,
                paddingVertical: 16,
                borderBottomWidth: i < SETTINGS_ROWS.length - 1 ? 1 : 0,
                borderBottomColor: theme.colors.border,
              }}
              activeOpacity={0.65}
            >
              <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: '600', flex: 1 }}>
                {row.label}
              </Text>
              {row.value ? (
                <Text style={{ color: theme.colors.textMuted, fontSize: 13, marginRight: 8 }}>
                  {row.value}
                </Text>
              ) : null}
              <Text style={{ color: theme.colors.textMuted, fontSize: 20, lineHeight: 20 }}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <Text
            style={{
              color: theme.colors.primary,
              fontSize: 12,
              fontWeight: '900',
              letterSpacing: 5,
            }}
          >
            SURGO
          </Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: 11, marginTop: 5, letterSpacing: 0.5 }}>
            Rise every day
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
