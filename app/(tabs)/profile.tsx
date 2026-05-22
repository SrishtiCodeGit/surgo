import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { themes, themeKeys } from '@/lib/theme';
import { ThemeKey } from '@/types';

const SETTINGS_ROWS = [
  { icon: '🔔', label: 'Notification Time', value: '9:00 AM' },
  { icon: '👤', label: 'Account',            value: '' },
  { icon: 'ℹ️',  label: 'About Surgo',        value: 'v1.0' },
];

export default function ProfileScreen() {
  const { theme, themeKey, setTheme } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ color: theme.colors.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.5 }}>
            Profile
          </Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: 14, marginTop: 4 }}>
            Customise your Surgo experience
          </Text>
        </View>

        {/* ── Active theme hero ───────────────────────────────────────────── */}
        <View
          style={{
            backgroundColor: theme.colors.primary,
            borderRadius: 24,
            padding: 22,
            marginBottom: 20,
            shadowColor: theme.colors.primary,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.4,
            shadowRadius: 16,
            elevation: 6,
          }}
        >
          <Text
            style={{
              color: theme.colors.textInverse,
              fontSize: 11,
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: 2,
              marginBottom: 12,
              opacity: 0.7,
            }}
          >
            Current vibe
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 14 }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: 'rgba(255,255,255,0.18)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 28 }}>{theme.emoji.streak}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: theme.colors.textInverse,
                  fontSize: 22,
                  fontWeight: '800',
                  letterSpacing: -0.4,
                }}
              >
                {theme.name}
              </Text>
              <Text
                style={{
                  color: theme.colors.textInverse,
                  opacity: 0.75,
                  fontSize: 13,
                  marginTop: 2,
                }}
              >
                {theme.tagline}
              </Text>
            </View>
          </View>

          {/* Color swatches */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[theme.colors.accent, theme.colors.success, theme.colors.warning, theme.colors.streakFire].map((c, i) => (
              <View
                key={i}
                style={{
                  width: 32,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: c,
                  opacity: 0.85,
                }}
              />
            ))}
          </View>
        </View>

        {/* ── Theme Picker ────────────────────────────────────────────────── */}
        <Text
          style={{
            color: theme.colors.textMuted,
            fontSize: 11,
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: 2,
            marginBottom: 14,
          }}
        >
          Switch vibe
        </Text>

        <View style={{ gap: 12, marginBottom: 36 }}>
          {themeKeys.map((key) => {
            const t = themes[key];
            const isActive = themeKey === key;
            if (isActive) return null; // active one shown as hero above

            return (
              <TouchableOpacity
                key={key}
                onPress={() => setTheme(key as ThemeKey)}
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderWidth: 1.5,
                  borderRadius: 20,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                }}
                activeOpacity={0.75}
              >
                {/* Emoji */}
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: t.colors.primaryLight,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 24 }}>{t.emoji.streak}</Text>
                </View>

                {/* Text + swatches */}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <Text
                      style={{
                        color: theme.colors.text,
                        fontSize: 16,
                        fontWeight: '800',
                      }}
                    >
                      {t.name}
                    </Text>
                    {/* Mini color dots */}
                    {[t.colors.primary, t.colors.accent, t.colors.success].map((c, i) => (
                      <View
                        key={i}
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: c,
                        }}
                      />
                    ))}
                  </View>
                  <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
                    {t.tagline}
                  </Text>
                </View>

                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: t.colors.primaryLight,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: t.colors.primary, fontSize: 16 }}>→</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Settings ────────────────────────────────────────────────────── */}
        <Text
          style={{
            color: theme.colors.textMuted,
            fontSize: 11,
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: 2,
            marginBottom: 14,
          }}
        >
          Settings
        </Text>

        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: 20,
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
                gap: 14,
                borderBottomWidth: i < SETTINGS_ROWS.length - 1 ? 1 : 0,
                borderBottomColor: theme.colors.border,
              }}
              activeOpacity={0.65}
            >
              <Text style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{row.icon}</Text>
              <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: '600', flex: 1 }}>
                {row.label}
              </Text>
              {row.value ? (
                <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>{row.value}</Text>
              ) : null}
              <Text style={{ color: theme.colors.textMuted, fontSize: 18 }}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <View style={{ alignItems: 'center', marginTop: 36 }}>
          <Text style={{ color: theme.colors.primary, fontSize: 13, fontWeight: '800', letterSpacing: 3 }}>
            SURGO
          </Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: 11, marginTop: 4 }}>
            Rise every day
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
