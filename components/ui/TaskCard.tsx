import { View, Text, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import { useTheme } from '@/context/ThemeContext';
import { Task } from '@/types';

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
  task: Task;
  onComplete: (taskId: string) => void;
}

export function TaskCard({ task, onComplete }: TaskCardProps) {
  const { theme } = useTheme();
  const isCompleted = !!task.completedAt;

  return (
    <TouchableOpacity
      onPress={() => {
        if (isCompleted) return;
        playComplete();
        onComplete(task.id);
      }}
      activeOpacity={0.72}
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: 14,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'stretch',
        overflow: 'hidden',
        opacity: isCompleted ? 0.52 : 1,
        borderWidth: 1,
        borderColor: theme.colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 1,
      }}
    >
      {/* Left accent bar — primary when pending, success when done */}
      <View
        style={{
          width: 3,
          backgroundColor: isCompleted
            ? theme.colors.success
            : theme.colors.primary,
        }}
      />

      {/* Content row */}
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 14,
          paddingLeft: 14,
          paddingRight: 14,
        }}
      >
        {/* Checkbox — square with rounded corners */}
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            backgroundColor: isCompleted ? theme.colors.success : 'transparent',
            borderColor: isCompleted ? theme.colors.success : theme.colors.border,
            borderWidth: 1.5,
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {isCompleted && (
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>✓</Text>
          )}
        </View>

        {/* Title + duration */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: theme.colors.text,
              fontSize: 15,
              fontWeight: '600',
              lineHeight: 21,
              textDecorationLine: isCompleted ? 'line-through' : 'none',
            }}
          >
            {task.title}
          </Text>
          {(task.estimatedMinutes ?? 0) > 0 && !isCompleted && (
            <Text
              style={{
                color: theme.colors.textMuted,
                fontSize: 11,
                marginTop: 3,
                fontWeight: '600',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              {task.estimatedMinutes} min
            </Text>
          )}
        </View>

        {/* AI badge */}
        {task.aiGenerated && !isCompleted && (
          <View
            style={{
              backgroundColor: theme.colors.primaryLight,
              paddingHorizontal: 7,
              paddingVertical: 3,
              borderRadius: 6,
              flexShrink: 0,
            }}
          >
            <Text
              style={{
                color: theme.colors.primary,
                fontSize: 9,
                fontWeight: '900',
                letterSpacing: 1.2,
              }}
            >
              AI
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
