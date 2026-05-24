import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { StreakState } from '@/types';

interface StreakBadgeProps {
  count: number;
  state: StreakState;
  freezeCards: number;
  onFreezePress?: () => void;
}

export function StreakBadge({ count, state, freezeCards, onFreezePress }: StreakBadgeProps) {
  const { theme } = useTheme();

  const isActive = state === 'active';
  const isAtRisk = state === 'at_risk';
  const isGrace  = state === 'grace';
  const isBroken = state === 'broken';

  const accentColor =
    isActive  ? theme.colors.primary :
    isAtRisk  ? theme.colors.warning :
    isBroken  ? theme.colors.danger  :
    theme.colors.border;

  const statusDot =
    isActive  ? theme.colors.success :
    isAtRisk  ? theme.colors.warning :
    isBroken  ? theme.colors.danger  :
    theme.colors.textMuted;

  const statusTag =
    isActive  ? 'ACTIVE'   :
    isAtRisk  ? 'AT RISK'  :
    isGrace   ? 'PROTECTED':
    isBroken  ? 'BROKEN'   :
    'INACTIVE';

  const statusLabel =
    isActive  ? 'Checked in today' :
    isAtRisk  ? 'Check in before midnight' :
    isGrace   ? 'Rest day used — streak safe' :
    isBroken  ? 'Start fresh today' :
    'Begin your streak';

  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      {/* Thin accent line at top — colour signals streak state */}
      <View style={{ height: 3, backgroundColor: accentColor }} />

      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, gap: 0 }}>

        {/* Big streak number */}
        <View style={{ minWidth: 72 }}>
          <Text
            style={{
              color: theme.colors.text,
              fontSize: 44,
              fontWeight: '900',
              letterSpacing: -2,
              lineHeight: 46,
            }}
          >
            {count === 0 ? '—' : count}
          </Text>
          <Text
            style={{
              color: theme.colors.textMuted,
              fontSize: 10,
              fontWeight: '700',
              letterSpacing: 2,
              textTransform: 'uppercase',
              marginTop: 1,
            }}
          >
            {count === 1 ? 'Day' : 'Days'} streak
          </Text>
        </View>

        {/* Divider */}
        <View
          style={{
            width: 1,
            height: 42,
            backgroundColor: theme.colors.border,
            marginHorizontal: 18,
          }}
        />

        {/* Status */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusDot }} />
            <Text
              style={{
                color: statusDot,
                fontSize: 10,
                fontWeight: '800',
                letterSpacing: 1.5,
                textTransform: 'uppercase',
              }}
            >
              {statusTag}
            </Text>
          </View>
          <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '600', lineHeight: 18 }}>
            {statusLabel}
          </Text>
        </View>

        {/* Freeze button — minimal, text-only */}
        {isAtRisk && freezeCards > 0 && onFreezePress && (
          <TouchableOpacity
            onPress={onFreezePress}
            style={{
              borderWidth: 1,
              borderColor: theme.colors.border,
              paddingHorizontal: 10,
              paddingVertical: 7,
              borderRadius: 10,
              marginLeft: 8,
            }}
            activeOpacity={0.7}
          >
            <Text
              style={{
                color: theme.colors.textMuted,
                fontSize: 10,
                fontWeight: '800',
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}
            >
              Freeze · {freezeCards}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
