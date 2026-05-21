import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { useStreakStore } from '@/stores/streakStore';
import { StreakBadge } from '@/components/ui/StreakBadge';
import { TaskCard } from '@/components/ui/TaskCard';
import { Task } from '@/types';
import { useState, useCallback } from 'react';
import { toDateString } from '@/lib/streak';
import { getMilestoneQuote, getTodaysQuote } from '@/lib/quotes';

// ─── Mock data (replace with Supabase queries later) ─────────────────────────
const MOCK_USER_ID = 'demo-user';

const MOCK_TASKS: Task[] = [
  {
    id: '1',
    goalId: 'goal-1',
    userId: MOCK_USER_ID,
    title: 'Run for 20 minutes',
    dueDate: toDateString(new Date()),
    estimatedMinutes: 20,
    aiGenerated: true,
    isStretchTask: false,
  },
  {
    id: '2',
    goalId: 'goal-1',
    userId: MOCK_USER_ID,
    title: 'Log your meals for the day',
    dueDate: toDateString(new Date()),
    estimatedMinutes: 5,
    aiGenerated: true,
    isStretchTask: false,
  },
  {
    id: '3',
    goalId: 'goal-1',
    userId: MOCK_USER_ID,
    title: 'Drink 2L of water',
    dueDate: toDateString(new Date()),
    estimatedMinutes: 10,
    aiGenerated: false,
    isStretchTask: false,
  },
];

export default function TodayScreen() {
  const { theme } = useTheme();
  const { streak, isLoaded, checkIn, useFreeze, streakState, loadStreak } =
    useStreakStore();

  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStreak(MOCK_USER_ID);
    setRefreshing(false);
  }, [loadStreak]);

  // Load streak on first render
  useState(() => {
    if (!isLoaded) loadStreak(MOCK_USER_ID);
  });

  const completedCount = tasks.filter((t) => !!t.completedAt).length;
  const totalCount = tasks.length;
  const allDone = completedCount === totalCount;

  const currentState = streakState() ?? 'new';
  const currentStreak = streak?.currentStreak ?? 0;
  const freezeCards = streak?.freezeCardsAvailable ?? 0;

  const handleCompleteTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, completedAt: new Date().toISOString() } : t,
      ),
    );
  };

  const handleCheckIn = async () => {
    const { milestone } = await checkIn(completedCount, totalCount);
    if (milestone) {
      const milestoneQuote = getMilestoneQuote(milestone, theme.key);
      Alert.alert(
        `${theme.emoji.win} ${milestone}-Day Milestone!`,
        milestoneQuote,
        [{ text: theme.key === 'hardcore' ? 'Keep grinding.' : 'Let\'s go!' }],
      );
    } else {
      Alert.alert(
        `${theme.emoji.streak} Checked in!`,
        `${theme.tone.streakCongrats}\n\n"${getTodaysQuote(theme.key)}"`,
        [{ text: 'Done' }],
      );
    }
  };

  const handleFreezePress = () => {
    Alert.alert(
      '❄️ Use a Freeze Card?',
      `You have ${freezeCards} freeze card${freezeCards !== 1 ? 's' : ''} left. This will protect your streak for today.\n\n${theme.tone.freezeUsed}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Use Freeze',
          onPress: async () => {
            const success = await useFreeze();
            if (!success) Alert.alert('No freeze cards left!');
          },
        },
      ],
    );
  };

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12
      ? theme.tone.greeting
      : hour < 18
        ? 'Good afternoon'
        : 'Good evening';

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View className="mb-6">
          {/* App name + date row */}
          <View className="flex-row justify-between items-center mb-1">
            <Text
              style={{ color: theme.colors.textMuted }}
              className="text-sm font-medium uppercase tracking-widest"
            >
              {now.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <Text
              style={{ color: theme.colors.primary }}
              className="text-base font-black tracking-widest"
            >
              SURGO
            </Text>
          </View>
          <Text
            style={{ color: theme.colors.text }}
            className="text-3xl font-bold mb-4"
          >
            {greeting} 👋
          </Text>

          {/* Streak Badge */}
          {isLoaded && (
            <StreakBadge
              count={currentStreak}
              state={currentState}
              freezeCards={freezeCards}
              onFreezePress={handleFreezePress}
            />
          )}
        </View>

        {/* ── Motivation line ─────────────────────────────────────────────── */}
        <View
          style={{
            backgroundColor: theme.colors.surfaceAlt,
            borderLeftColor: theme.colors.primary,
            borderLeftWidth: 3,
          }}
          className="rounded-xl px-4 py-3 mb-6"
        >
          <Text
            style={{ color: theme.colors.text }}
            className="text-sm font-semibold"
          >
            {theme.tone.taskMotivation}
          </Text>
        </View>

        {/* ── Progress ────────────────────────────────────────────────────── */}
        <View className="mb-2 flex-row justify-between items-center">
          <Text
            style={{ color: theme.colors.text }}
            className="text-lg font-bold"
          >
            Today's Tasks
          </Text>
          <Text style={{ color: theme.colors.textMuted }} className="text-sm">
            {completedCount}/{totalCount} done
          </Text>
        </View>

        {/* Progress bar */}
        <View
          style={{ backgroundColor: theme.colors.border }}
          className="h-1.5 rounded-full mb-5"
        >
          <View
            style={{
              backgroundColor: allDone
                ? theme.colors.success
                : theme.colors.primary,
              width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
            }}
            className="h-1.5 rounded-full"
          />
        </View>

        {/* ── Task List ────────────────────────────────────────────────────── */}
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onComplete={handleCompleteTask}
          />
        ))}

        {/* ── Check-in Button ──────────────────────────────────────────────── */}
        {allDone && currentState !== 'active' && (
          <TouchableOpacity
            onPress={handleCheckIn}
            style={{ backgroundColor: theme.colors.primary }}
            className="mt-6 py-4 rounded-2xl items-center"
            activeOpacity={0.85}
          >
            <Text
              style={{ color: theme.colors.textInverse }}
              className="text-base font-bold"
            >
              {theme.emoji.win} Check In — Extend Streak
            </Text>
          </TouchableOpacity>
        )}

        {currentState === 'active' && (
          <View
            style={{
              backgroundColor: theme.colors.success + '20',
              borderColor: theme.colors.success,
              borderWidth: 1,
            }}
            className="mt-6 py-4 rounded-2xl items-center"
          >
            <Text style={{ color: theme.colors.success }} className="text-base font-bold">
              ✓ Checked in for today!
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
