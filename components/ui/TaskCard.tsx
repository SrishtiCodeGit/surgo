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
        borderColor: isCompleted ? theme.colors.success : theme.colors.border,
        borderWidth: 1,
        opacity: isCompleted ? 0.6 : 1,
      }}
      className="rounded-2xl p-4 mb-3 flex-row items-center gap-3"
    >
      {/* Checkbox */}
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: isCompleted ? theme.colors.success : 'transparent',
          borderColor: isCompleted ? theme.colors.success : theme.colors.border,
          borderWidth: 2,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isCompleted && (
          <Text style={{ color: '#fff', fontSize: 14 }}>✓</Text>
        )}
      </View>

      {/* Content */}
      <View className="flex-1">
        <Text
          style={{
            color: theme.colors.text,
            textDecorationLine: isCompleted ? 'line-through' : 'none',
          }}
          className="text-base font-semibold"
        >
          {task.title}
        </Text>
        {(task.estimatedMinutes ?? 0) > 0 && !isCompleted && (
          <Text style={{ color: theme.colors.textMuted }} className="text-xs mt-0.5">
            ~{task.estimatedMinutes} min
          </Text>
        )}
      </View>

      {/* AI badge */}
      {task.aiGenerated && !isCompleted && (
        <View
          style={{ backgroundColor: theme.colors.primaryLight }}
          className="px-2 py-0.5 rounded-full"
        >
          <Text style={{ color: theme.colors.primary }} className="text-xs font-bold">
            AI
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
