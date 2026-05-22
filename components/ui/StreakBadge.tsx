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

  const isActive  = state === 'active';
  const isAtRisk  = state === 'at_risk';
  const isGrace   = state === 'grace';
  const isBroken  = state === 'broken';

  const bgColor =
    isActive  ? theme.colors.primary :
    isAtRisk  ? theme.colors.warning :
    isBroken  ? theme.colors.danger  :
    theme.colors.surfaceAlt;

  const fgColor =
    isActive  ? theme.colors.textInverse :
    isAtRisk  ? '#1a1a1a' :
    isBroken  ? '#ffffff' :
    theme.colors.text;

  const subLabel =
    isActive  ? 'Checked in today ✓' :
    isAtRisk  ? 'Check in before midnight!' :
    isGrace   ? 'Freeze used — protected ❄️' :
    isBroken  ? 'Start fresh today' :
    'Start your streak today';

  const iconBg = (isActive || isBroken)
    ? 'rgba(255,255,255,0.18)'
    : isAtRisk
    ? 'rgba(0,0,0,0.10)'
    : theme.colors.primaryLight;

  return (
    <View
      style={{
        backgroundColor: bgColor,
        borderRadius: 20,
        paddingHorizontal: 18,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 20,
        shadowColor: bgColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isActive ? 0.35 : 0,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      {/* Emoji circle */}
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: iconBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 26 }}>{theme.emoji.streak}</Text>
      </View>

      {/* Text */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: fgColor,
            fontSize: 22,
            fontWeight: '800',
            letterSpacing: -0.4,
            lineHeight: 26,
          }}
        >
          {count === 0 ? 'Day 1 awaits' : `${count} day${count === 1 ? '' : 's'}`}
        </Text>
        <Text
          style={{
            color: fgColor,
            opacity: 0.72,
            fontSize: 12,
            fontWeight: '600',
            marginTop: 3,
          }}
        >
          {subLabel}
        </Text>
      </View>

      {/* Freeze button (only when at risk + cards available) */}
      {isAtRisk && freezeCards > 0 && onFreezePress && (
        <TouchableOpacity
          onPress={onFreezePress}
          style={{
            backgroundColor: 'rgba(255,255,255,0.28)',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 12,
          }}
          activeOpacity={0.75}
        >
          <Text style={{ color: '#1a1a1a', fontSize: 12, fontWeight: '700' }}>
            ❄️ {freezeCards}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
