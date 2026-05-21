import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { themes, themeKeys } from '@/lib/theme';
import { ThemeKey } from '@/types';

export default function ProfileScreen() {
  const { theme, themeKey, setTheme } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ color: theme.colors.text }} className="text-3xl font-bold mb-2">
          Profile
        </Text>
        <Text style={{ color: theme.colors.textMuted }} className="text-sm mb-8">
          Make Velo yours.
        </Text>

        {/* ── Theme Picker ────────────────────────────────────────────────── */}
        <Text style={{ color: theme.colors.text }} className="text-base font-bold mb-3">
          Your Vibe
        </Text>
        <View className="gap-3 mb-8">
          {themeKeys.map((key) => {
            const t = themes[key];
            const isActive = themeKey === key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setTheme(key as ThemeKey)}
                style={{
                  backgroundColor: isActive ? t.colors.primary : theme.colors.surface,
                  borderColor: isActive ? t.colors.primary : theme.colors.border,
                  borderWidth: 2,
                }}
                className="rounded-2xl p-4 flex-row items-center gap-4"
                activeOpacity={0.8}
              >
                <Text className="text-3xl">{t.emoji.streak}</Text>
                <View className="flex-1">
                  <Text
                    style={{ color: isActive ? t.colors.textInverse : theme.colors.text }}
                    className="text-base font-bold"
                  >
                    {t.name}
                  </Text>
                  <Text
                    style={{ color: isActive ? t.colors.textInverse + 'cc' : theme.colors.textMuted }}
                    className="text-xs mt-0.5"
                  >
                    {t.tagline}
                  </Text>
                </View>
                {isActive && (
                  <View
                    style={{ backgroundColor: t.colors.textInverse + '30' }}
                    className="w-6 h-6 rounded-full items-center justify-center"
                  >
                    <Text style={{ color: t.colors.textInverse, fontSize: 12 }}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Settings placeholder ─────────────────────────────────────────── */}
        <Text style={{ color: theme.colors.text }} className="text-base font-bold mb-3">
          Settings
        </Text>
        {['Notification Time', 'Account', 'About Surgo'].map((item) => (
          <TouchableOpacity
            key={item}
            style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderBottomWidth: 1 }}
            className="py-4 px-2 flex-row justify-between items-center"
          >
            <Text style={{ color: theme.colors.text }} className="text-sm">
              {item}
            </Text>
            <Text style={{ color: theme.colors.textMuted }}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
