import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { StreakState } from '@/types';

interface StreakBadgeProps {
  count: number;
  state: StreakState;
  freezeCards: number;
  onFreezePress?: () => void;
}

export function StreakBadge({
  count,
  state,
  freezeCards,
  onFreezePress,
}: StreakBadgeProps) {
  const { theme } = useTheme();

  const stateConfig: Record<StreakState, { label: string; bg: string; text: string }> = {
    active: {
      label: `${theme.emoji.streak} ${count} day streak`,
      bg: theme.colors.primary,
      text: theme.colors.textInverse,
    },
    at_risk: {
      label: `⚠️ ${count} days — check in!`,
      bg: theme.colors.warning,
      text: '#1a1a1a',
    },
    grace: {
      label: `❄️ ${count} days — freeze used`,
      bg: theme.colors.surfaceAlt,
      text: theme.colors.text,
    },
    broken: {
      label: `💔 Streak reset — start again`,
      bg: theme.colors.danger,
      text: '#fff',
    },
    new: {
      label: `${theme.emoji.streak} Start your streak today`,
      bg: theme.colors.surfaceAlt,
      text: theme.colors.text,
    },
  };

  const config = stateConfig[state];

  return (
    <View className="flex-row items-center gap-2">
      {/* Main streak pill */}
      <View
        style={{ backgroundColor: config.bg }}
        className="px-4 py-2 rounded-full"
      >
        <Text
          style={{ color: config.text }}
          className="text-sm font-bold"
        >
          {config.label}
        </Text>
      </View>

      {/* Freeze card button (shown when at risk and cards available) */}
      {state === 'at_risk' && freezeCards > 0 && onFreezePress && (
        <TouchableOpacity
          onPress={onFreezePress}
          style={{ backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border }}
          className="px-3 py-2 rounded-full border"
        >
          <Text style={{ color: theme.colors.textMuted }} className="text-xs font-semibold">
            ❄️ Freeze ({freezeCards})
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
