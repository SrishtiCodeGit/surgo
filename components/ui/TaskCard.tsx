import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Task } from '@/types';

interface TaskCardProps {
  task: Task;
  onComplete: (taskId: string) => void;
}

export function TaskCard({ task, onComplete }: TaskCardProps) {
  const { theme } = useTheme();
  const isCompleted = !!task.completedAt;

  return (
    <TouchableOpacity
      onPress={() => !isCompleted && onComplete(task.id)}
      activeOpacity={0.7}
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: 18,
        padding: 16,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        borderWidth: 1.5,
        borderColor: isCompleted
          ? theme.colors.success + '55'
          : theme.colors.border,
        opacity: isCompleted ? 0.62 : 1,
        // iOS shadow
        shadowColor: theme.key === 'hardcore' ? '#000' : theme.colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: theme.key === 'hardcore' ? 0 : 0.07,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      {/* Checkbox */}
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: isCompleted ? theme.colors.success : 'transparent',
          borderColor: isCompleted ? theme.colors.success : theme.colors.border,
          borderWidth: 2,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {isCompleted && (
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>✓</Text>
        )}
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: theme.colors.text,
            fontSize: 15,
            fontWeight: '600',
            lineHeight: 22,
            textDecorationLine: isCompleted ? 'line-through' : 'none',
          }}
        >
          {task.title}
        </Text>
        {(task.estimatedMinutes ?? 0) > 0 && !isCompleted && (
          <Text
            style={{
              color: theme.colors.textMuted,
              fontSize: 12,
              marginTop: 3,
              fontWeight: '500',
            }}
          >
            ⏱ {task.estimatedMinutes} min
          </Text>
        )}
      </View>

      {/* AI badge */}
      {task.aiGenerated && !isCompleted && (
        <View
          style={{
            backgroundColor: theme.colors.primaryLight,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 8,
            flexShrink: 0,
          }}
        >
          <Text
            style={{
              color: theme.colors.primary,
              fontSize: 10,
              fontWeight: '800',
              letterSpacing: 0.5,
            }}
          >
            AI
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
