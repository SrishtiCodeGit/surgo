import { View, Text, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import { useTheme } from '@/context/ThemeContext';
import { Task } from '@/types';
import { categoriseTask } from '@/lib/taskCategory';

async function playComplete() {
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    const { sound } = await Audio.Sound.createAsync(
      require('@/assets/whoosh.mp3'),
      { shouldPlay: true, volume: 1.0 },
    );
    setTimeout(() => sound.unloadAsync().catch(() => {}), 3000);
  } catch {}
}

interface TaskCardProps {
  task:       Task;
  onComplete: (taskId: string) => void;
}

const DONE_COLOR: Record<string, string> = {
  soft:     '#FFB6C1',  // baby pink
  balanced: '#1C1C1E',  // black
  hardcore: '#FF2800',  // red
};

export function TaskCard({ task, onComplete }: TaskCardProps) {
  const { theme, themeKey } = useTheme();
  const isCompleted = !!task.completedAt;
  const cat = categoriseTask(task.title);

  const doneColor   = DONE_COLOR[themeKey] ?? theme.colors.success;
  const tickColor   = themeKey === 'soft' ? '#7A3340' : '#FFFFFF';

  // When completed: theme done colour. When pending: use category colour.
  const accentColor = isCompleted ? doneColor       : cat.color;
  const cardBg      = isCompleted ? theme.colors.surface : cat.bg;

  return (
    <TouchableOpacity
      onPress={() => {
        if (isCompleted) return;
        playComplete();
        onComplete(task.id);
      }}
      activeOpacity={0.75}
      style={{
        backgroundColor: cardBg,
        borderRadius:    14,
        marginBottom:    8,
        flexDirection:   'row',
        alignItems:      'stretch',
        overflow:        'hidden',
        opacity:         isCompleted ? 0.55 : 1,
        borderWidth:     1,
        borderColor:     isCompleted ? theme.colors.border : cat.color + '30',
        shadowColor:     '#000',
        shadowOffset:    { width: 0, height: 1 },
        shadowOpacity:   0.05,
        shadowRadius:    6,
        elevation:       1,
      }}
    >
      {/* Left accent bar */}
      <View style={{ width: 4, backgroundColor: accentColor }} />

      {/* Content */}
      <View style={{
        flex:          1,
        flexDirection: 'row',
        alignItems:    'center',
        gap:           12,
        paddingVertical:  14,
        paddingLeft:      14,
        paddingRight:     14,
      }}>
        {/* Checkbox */}
        <View style={{
          width:           22,
          height:          22,
          borderRadius:    6,
          backgroundColor: isCompleted ? doneColor : 'transparent',
          borderColor:     isCompleted ? doneColor  : cat.color + '80',
          borderWidth:     1.5,
          alignItems:      'center',
          justifyContent:  'center',
          flexShrink:      0,
        }}>
          {isCompleted && (
            <Text style={{ color: tickColor, fontSize: 12, fontWeight: '900' }}>✓</Text>
          )}
        </View>

        {/* Title + duration */}
        <View style={{ flex: 1 }}>
          <Text style={{
            color:              theme.colors.text,
            fontSize:           15,
            fontWeight:         '400',
            lineHeight:         21,
            textDecorationLine: isCompleted ? 'line-through' : 'none',
          }}>
            {task.title}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 }}>
            {/* Category label */}
            {!isCompleted && (
              <View style={{
                flexDirection:   'row',
                alignItems:      'center',
                gap:             3,
                backgroundColor: cat.color + '18',
                paddingHorizontal: 6,
                paddingVertical:   2,
                borderRadius:    5,
              }}>
                <Text style={{ fontSize: 10 }}>{cat.emoji}</Text>
                <Text style={{
                  color:       cat.color,
                  fontSize:    10,
                  fontWeight:  '400',
                  letterSpacing: 0.3,
                }}>
                  {cat.label}
                </Text>
              </View>
            )}

            {/* Time estimate */}
            {(task.estimatedMinutes ?? 0) > 0 && !isCompleted && (
              <Text style={{
                color:         theme.colors.textMuted,
                fontSize:      11,
                fontWeight:    '400',
                letterSpacing: 0.4,
              }}>
                {task.estimatedMinutes} min
              </Text>
            )}
          </View>
        </View>

        {/* AI badge */}
        {task.aiGenerated && !isCompleted && (
          <View style={{
            backgroundColor:   cat.color + '20',
            paddingHorizontal: 7,
            paddingVertical:   3,
            borderRadius:      6,
            flexShrink:        0,
          }}>
            <Text style={{
              color:         cat.color,
              fontSize:      9,
              fontWeight:    '500',
              letterSpacing: 1.2,
            }}>
              AI
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
