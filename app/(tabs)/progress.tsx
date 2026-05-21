import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { useStreakStore } from '@/stores/streakStore';

export default function ProgressScreen() {
  const { theme } = useTheme();
  const { stats } = useStreakStore();
  const streakStats = stats();

  const statCards = [
    { label: 'Current Streak', value: streakStats?.currentStreak ?? 0, suffix: 'days', emoji: theme.emoji.streak },
    { label: 'Longest Streak', value: streakStats?.longestStreak ?? 0, suffix: 'days', emoji: '🏆' },
    { label: 'Completion Rate', value: streakStats?.completionRate ?? 0, suffix: '%', emoji: '📊' },
    { label: 'Total Check-ins', value: streakStats?.completedDays ?? 0, suffix: 'days', emoji: '✅' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ color: theme.colors.text }} className="text-3xl font-bold mb-2">
          Progress
        </Text>
        <Text style={{ color: theme.colors.textMuted }} className="text-sm mb-8">
          Every day counts. Here's your story.
        </Text>

        {/* Stat grid */}
        <View className="flex-row flex-wrap gap-3 mb-8">
          {statCards.map((card) => (
            <View
              key={card.label}
              style={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderWidth: 1,
                width: '47%',
              }}
              className="rounded-2xl p-4"
            >
              <Text className="text-2xl mb-1">{card.emoji}</Text>
              <Text style={{ color: theme.colors.text }} className="text-2xl font-bold">
                {card.value}
                <Text style={{ color: theme.colors.textMuted }} className="text-sm font-normal">
                  {' '}{card.suffix}
                </Text>
              </Text>
              <Text style={{ color: theme.colors.textMuted }} className="text-xs mt-1">
                {card.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Weekly review placeholder */}
        <View
          style={{ backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border, borderWidth: 1 }}
          className="rounded-2xl p-5"
        >
          <Text style={{ color: theme.colors.text }} className="text-base font-bold mb-2">
            📋 Weekly AI Review
          </Text>
          <Text style={{ color: theme.colors.textMuted }} className="text-sm">
            Complete your first week of check-ins and your AI coach will write a personalised review here.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
