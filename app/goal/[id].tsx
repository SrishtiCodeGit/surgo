import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useGoalStore } from '@/stores/goalStore';

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const { goals, tasks, milestones, deleteGoal, completeTask } = useGoalStore();

  const goal = goals.find((g) => g.id === id);
  if (!goal) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: theme.colors.textMuted }}>Goal not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: theme.colors.primary }}>← Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const goalTasks = tasks.filter((t) => t.goalId === id);
  const goalMilestones = milestones.filter((m) => m.goalId === id);
  const doneTasks = goalTasks.filter((t) => !!t.completedAt).length;

  // Group tasks by due date
  const tasksByDate = goalTasks.reduce<Record<string, typeof goalTasks>>((acc, task) => {
    if (!acc[task.dueDate]) acc[task.dueDate] = [];
    acc[task.dueDate].push(task);
    return acc;
  }, {});

  const sortedDates = Object.keys(tasksByDate).sort();

  const daysLeft = Math.max(0, Math.ceil(
    (new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  ));

  const handleDelete = () => {
    Alert.alert(
      'Delete Goal',
      `Delete "${goal.title}"? This removes all tasks too.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => { await deleteGoal(goal.id); router.back(); },
        },
      ],
    );
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (dateStr === dateStr.slice(0, 10) && d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

        {/* Back + Delete */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: theme.colors.primary, fontSize: 16 }}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete}>
            <Text style={{ color: theme.colors.danger, fontSize: 14, fontWeight: '600' }}>Delete</Text>
          </TouchableOpacity>
        </View>

        {/* Goal header */}
        <View style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: 16, padding: 18, marginBottom: 20 }}>
          <Text style={{ color: theme.colors.text, fontSize: 22, fontWeight: '800', marginBottom: 4 }}>
            {goal.title}
          </Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: 13, marginBottom: 14 }}>
            {daysLeft} days remaining · Due {new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </Text>

          {/* Progress */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>Progress</Text>
            <Text style={{ color: theme.colors.primary, fontWeight: '700', fontSize: 12 }}>
              {doneTasks}/{goalTasks.length} tasks · {goal.progress}%
            </Text>
          </View>
          <View style={{ backgroundColor: theme.colors.border, height: 6, borderRadius: 3 }}>
            <View style={{ backgroundColor: theme.colors.primary, height: 6, borderRadius: 3, width: `${goal.progress}%` }} />
          </View>
        </View>

        {/* Milestones */}
        {goalMilestones.length > 0 && (
          <>
            <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '800', marginBottom: 12 }}>
              🏁 Milestones
            </Text>
            <View style={{ marginBottom: 20 }}>
              {goalMilestones.map((m) => (
                <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <View style={{
                    width: 20, height: 20, borderRadius: 10,
                    backgroundColor: m.completedAt ? theme.colors.success : 'transparent',
                    borderColor: m.completedAt ? theme.colors.success : theme.colors.border,
                    borderWidth: 2, marginRight: 10, alignItems: 'center', justifyContent: 'center',
                  }}>
                    {m.completedAt && <Text style={{ color: '#fff', fontSize: 10 }}>✓</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '600' }}>{m.title}</Text>
                    <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>
                      By {new Date(m.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Tasks by date */}
        <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '800', marginBottom: 12 }}>
          📋 All Tasks
        </Text>

        {sortedDates.length === 0 && (
          <Text style={{ color: theme.colors.textMuted, fontSize: 14 }}>No tasks yet.</Text>
        )}

        {sortedDates.map((date) => (
          <View key={date} style={{ marginBottom: 16 }}>
            <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              {formatDate(date)}
            </Text>
            {tasksByDate[date].map((task) => {
              const isCompleted = !!task.completedAt;
              return (
                <TouchableOpacity
                  key={task.id}
                  onPress={() => !isCompleted && completeTask(task.id)}
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderColor: isCompleted ? theme.colors.success : theme.colors.border,
                    borderWidth: 1,
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    opacity: isCompleted ? 0.6 : 1,
                  }}
                >
                  <View style={{
                    width: 22, height: 22, borderRadius: 11,
                    backgroundColor: isCompleted ? theme.colors.success : 'transparent',
                    borderColor: isCompleted ? theme.colors.success : theme.colors.border,
                    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isCompleted && <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '600', textDecorationLine: isCompleted ? 'line-through' : 'none' }}>
                      {task.title}
                    </Text>
                    {task.estimatedMinutes > 0 && !isCompleted && (
                      <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>~{task.estimatedMinutes} min</Text>
                    )}
                  </View>
                  {task.aiGenerated && !isCompleted && (
                    <View style={{ backgroundColor: theme.colors.primaryLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ color: theme.colors.primary, fontSize: 10, fontWeight: '700' }}>AI</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
