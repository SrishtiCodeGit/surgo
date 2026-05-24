import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { StreakState } from '@/types';

interface StreakBadgeProps {
  count:         number;
  state:         StreakState;
  freezeCards:   number;
  onFreezePress?: () => void;
}

export function StreakBadge({ count, state, freezeCards, onFreezePress }: StreakBadgeProps) {
  const { theme } = useTheme();

  const isActive  = state === 'active';
  const isAtRisk  = state === 'at_risk';
  const isGrace   = state === 'grace';
  const isBroken  = state === 'broken';

  const accentColor =
    isActive  ? '#FF9F00' :   // flame orange
    isAtRisk  ? '#EF4444' :
    isBroken  ? '#6B7280' :
    theme.colors.primary;

  const shadowColor =
    isActive  ? '#FF9F00' :
    isAtRisk  ? '#EF4444' :
    theme.colors.primary;

  const statusLabel =
    isActive  ? 'Keep it up!'              :
    isAtRisk  ? 'Check in before midnight' :
    isGrace   ? 'Rest day — streak safe'   :
    isBroken  ? 'Start fresh today'        :
    'Begin your streak';

  const flameEmoji =
    isActive  ? '🔥' :
    isAtRisk  ? '⚠️' :
    isBroken  ? '💔' :
    '✨';

  return (
    <View style={{
      backgroundColor: '#FFFFFF',
      borderRadius:    20,
      borderWidth:     2.5,
      borderColor:     accentColor + '55',
      borderBottomWidth: 5,
      borderBottomColor: accentColor + '80',
      overflow: 'hidden',
      shadowColor:     shadowColor,
      shadowOffset:    { width: 0, height: 4 },
      shadowOpacity:   0.18,
      shadowRadius:    8,
      elevation:       5,
    }}>
      {/* Bold top colour bar */}
      <View style={{ height: 4, backgroundColor: accentColor }} />

      <View style={{
        flexDirection:  'row',
        alignItems:     'center',
        paddingHorizontal: 18,
        paddingVertical:   16,
        gap: 0,
      }}>

        {/* Flame + streak number — big game-feel */}
        <View style={{ alignItems: 'center', minWidth: 80 }}>
          <Text style={{ fontSize: count === 0 ? 28 : 36 }}>{flameEmoji}</Text>
          <Text style={{
            color:         '#1C1C1E',
            fontSize:      40,
            fontWeight:    '900',
            letterSpacing: -2,
            lineHeight:    42,
            marginTop:     -4,
          }}>
            {count === 0 ? '—' : count}
          </Text>
          <Text style={{
            color:         accentColor,
            fontSize:      10,
            fontWeight:    '800',
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            marginTop:     2,
          }}>
            {count === 1 ? 'Day' : 'Days'}
          </Text>
        </View>

        {/* Divider */}
        <View style={{
          width:            2,
          height:           54,
          backgroundColor:  'rgba(0,0,0,0.08)',
          marginHorizontal: 18,
          borderRadius:     1,
        }} />

        {/* Status */}
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <View style={{
            alignSelf:       'flex-start',
            backgroundColor: accentColor + '18',
            borderWidth:     1.5,
            borderColor:     accentColor + '40',
            borderRadius:    20,
            paddingHorizontal: 10,
            paddingVertical:   4,
            marginBottom:    8,
          }}>
            <Text style={{
              color:         accentColor,
              fontSize:      10,
              fontWeight:    '900',
              letterSpacing: 1.2,
              textTransform: 'uppercase',
            }}>
              {isActive ? 'ON FIRE' : isAtRisk ? 'AT RISK' : isGrace ? 'PROTECTED' : isBroken ? 'BROKEN' : 'NEW'}
            </Text>
          </View>

          <Text style={{
            color:      '#1C1C1E',
            fontSize:   13,
            fontWeight: '600',
            lineHeight: 18,
          }}>
            {statusLabel}
          </Text>
        </View>

        {/* Freeze button — chunky Duo style */}
        {isAtRisk && freezeCards > 0 && onFreezePress && (
          <TouchableOpacity
            onPress={onFreezePress}
            activeOpacity={0.8}
            style={{
              backgroundColor:  '#EEF2FF',
              borderWidth:      2,
              borderColor:      '#818CF8',
              borderBottomWidth: 4,
              borderBottomColor: '#6366F1',
              paddingHorizontal: 10,
              paddingVertical:   8,
              borderRadius:     12,
              marginLeft:       8,
              alignItems:       'center',
            }}
          >
            <Text style={{ fontSize: 16 }}>❄️</Text>
            <Text style={{
              color:      '#6366F1',
              fontSize:   10,
              fontWeight: '800',
              marginTop:   2,
            }}>
              {freezeCards}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
