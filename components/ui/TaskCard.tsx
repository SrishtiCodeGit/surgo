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

export function TaskCard({ task, onComplete }: TaskCardProps) {
  const { theme } = useTheme();
  const isCompleted = !!task.completedAt;
  const cat = categoriseTask(task.title);

  const accentColor = isCompleted ? '#22C55E' : cat.color;
  const cardBg      = isCompleted ? '#FFFFFF'  : cat.bg;
  const borderColor = isCompleted ? 'rgba(0,0,0,0.10)' : cat.color + '55';

  return (
    <TouchableOpacity
      onPress={() => {
        if (isCompleted) return;
        playComplete();
        onComplete(task.id);
      }}
      activeOpacity={0.82}
      style={{
        backgroundColor: cardBg,
        borderRadius:    16,
        marginBottom:    10,
        flexDirection:   'row',
        alignItems:      'stretch',
        overflow:        'hidden',
        opacity:         isCompleted ? 0.55 : 1,
        // Duolingo-style: thick border + hard offset shadow
        borderWidth:     2,
        borderColor:     borderColor,
        borderBottomWidth: isCompleted ? 2 : 4,
        borderBottomColor: isCompleted ? borderColor : cat.color + '80',
        shadowColor:     accentColor,
        shadowOffset:    { width: 0, height: 3 },
        shadowOpacity:   0.18,
        shadowRadius:    4,
        elevation:       4,
      }}
    >
      {/* Left accent bar — slightly wider */}
      <View style={{ width: 5, backgroundColor: accentColor }} />

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
        {/* Checkbox — rounder, Duo-style */}
        <View style={{
          width:           26,
          height:          26,
          borderRadius:    8,
          backgroundColor: isCompleted ? '#22C55E' : 'transparent',
          borderColor:     isCompleted ? '#22C55E' : cat.color,
          borderWidth:     2.5,
          alignItems:      'center',
          justifyContent:  'center',
          flexShrink:      0,
          shadowColor:     isCompleted ? '#22C55E' : cat.color,
          shadowOffset:    { width: 0, height: 2 },
          shadowOpacity:   isCompleted ? 0.30 : 0.12,
          shadowRadius:    3,
        }}>
          {isCompleted && (
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '900', lineHeight: 16 }}>✓</Text>
          )}
        </View>

        {/* Title + meta */}
        <View style={{ flex: 1 }}>
          <Text style={{
            color:              '#1C1C1E',
            fontSize:           15,
            fontWeight:         '700',
            lineHeight:         21,
            textDecorationLine: isCompleted ? 'line-through' : 'none',
          }}>
            {task.title}
          </Text>

          {!isCompleted && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 4 }}>
              {/* Category pill — chunky Duo style */}
              <View style={{
                flexDirection:    'row',
                alignItems:       'center',
                gap:              4,
                backgroundColor:  cat.color,
                paddingHorizontal: 8,
                paddingVertical:   3,
                borderRadius:     20,
              }}>
                <Text style={{ fontSize: 10 }}>{cat.emoji}</Text>
                <Text style={{
                  color:         '#fff',
                  fontSize:      10,
                  fontWeight:    '800',
                  letterSpacing: 0.4,
                }}>
                  {cat.label}
                </Text>
              </View>

              {/* Time */}
              {(task.estimatedMinutes ?? 0) > 0 && (
                <Text style={{
                  color:         'rgba(0,0,0,0.35)',
                  fontSize:      11,
                  fontWeight:    '600',
                }}>
                  {task.estimatedMinutes} min
                </Text>
              )}
            </View>
          )}
        </View>

        {/* AI badge */}
        {task.aiGenerated && !isCompleted && (
          <View style={{
            backgroundColor:   cat.color,
            paddingHorizontal: 7,
            paddingVertical:   4,
            borderRadius:      8,
            flexShrink:        0,
          }}>
            <Text style={{
              color:         '#fff',
              fontSize:      9,
              fontWeight:    '900',
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
