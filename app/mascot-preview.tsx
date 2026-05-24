/**
 * Mascot Pose Preview — dev screen, not in tab bar.
 * Navigate to it with: router.push('/mascot-preview')
 * or just visit it directly in Expo Go.
 */
import { ScrollView, View, Text } from 'react-native';
import { WelcomeMascot, MascotPose } from '@/components/ui/WelcomeMascot';
import { useTheme } from '@/context/ThemeContext';

const POSES: { pose: MascotPose; label: string }[] = [
  { pose: 'happy',      label: '😊  Happy'      },
  { pose: 'thumbsUp',   label: '👍  Thumbs Up'  },
  { pose: 'motivating', label: '🔥  Motivating' },
  { pose: 'sad',        label: '😞  Sad'        },
  { pose: 'crying',     label: '😢  Crying'     },
];

const THEMES = ['soft', 'balanced', 'hardcore'] as const;

export default function MascotPreview() {
  const { theme } = useTheme();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
    >
      <Text style={{
        color: theme.colors.text,
        fontSize: 22, fontWeight: '900',
        marginBottom: 24, letterSpacing: -0.5,
      }}>
        Mascot Poses
      </Text>

      {POSES.map(({ pose, label }) => (
        <View key={pose} style={{ marginBottom: 32 }}>
          <Text style={{
            color: theme.colors.textMuted,
            fontSize: 11, fontWeight: '800',
            letterSpacing: 2, textTransform: 'uppercase',
            marginBottom: 12,
          }}>
            {label}
          </Text>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            {THEMES.map(themeKey => (
              <View key={themeKey} style={{
                flex: 1,
                backgroundColor: theme.colors.surface,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: theme.colors.border,
                alignItems: 'center',
                paddingVertical: 16,
              }}>
                <WelcomeMascot themeKey={themeKey} size={88} pose={pose} />
                <Text style={{
                  color: theme.colors.textMuted,
                  fontSize: 9, fontWeight: '700',
                  letterSpacing: 1.2, textTransform: 'uppercase',
                  marginTop: 8,
                }}>
                  {themeKey}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
