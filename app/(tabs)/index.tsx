import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useStreakStore } from '@/stores/streakStore';
import { useGoalStore } from '@/stores/goalStore';
import { StreakBadge } from '@/components/ui/StreakBadge';
import { TaskCard } from '@/components/ui/TaskCard';
import { getMilestoneQuote, getTodaysQuote } from '@/lib/quotes';
import { toDateString } from '@/lib/streak';

const USER_ID = 'local';

export default function TodayScreen() {
  const { theme } = useTheme();

  const {
    streak, isLoaded: streakLoaded,
    checkIn, useFreeze, streakState, loadStreak,
  } = useStreakStore();

  const {
    isLoaded: goalsLoaded, load,
    getTodaysTasks, completeTask, goals,
  } = useGoalStore();

  const [refreshing, setRefreshing] = useState(false);

  // Load data on mount
  useEffect(() => {
    if (!streakLoaded) loadStreak(USER_ID);
    if (!goalsLoaded) load();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadStreak(USER_ID), load()]);
    setRefreshing(false);
  }, []);

  const todaysTasks = getTodaysTasks();
  const completedCount = todaysTasks.filter((t) => !!t.completedAt).length;
  const totalCount = todaysTasks.length;
  const allDone = totalCount > 0 && completedCount === totalCount;

  const currentState = streakState() ?? 'new';
  const currentStreak = streak?.currentStreak ?? 0;
  const freezeCards = streak?.freezeCardsAvailable ?? 0;

  const handleCompleteTask = async (taskId: string) => {
    await completeTask(taskId);
  };

  const handleCheckIn = async () => {
    const { milestone } = await checkIn(completedCount, totalCount);
    if (milestone) {
      const milestoneQuote = getMilestoneQuote(milestone, theme.key);
      Alert.alert(
        `${theme.emoji.win} ${milestone}-Day Milestone!`,
        milestoneQuote,
        [{ text: theme.key === 'hardcore' ? 'Keep grinding.' : "Let's go!" }],
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
      `You have ${freezeCards} freeze card${freezeCards !== 1 ? 's' : ''} left.\n\n${theme.tone.freezeUsed}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Use Freeze',
          onPress: async () => {
            const ok = await useFreeze();
            if (!ok) Alert.alert('No freeze cards available!');
          },
        },
      ],
    );
  };

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? theme.tone.greeting
    : hour < 18 ? 'Good afternoon'
    : 'Good evening';

  const isLoading = !streakLoaded || !goalsLoaded;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.5 }}>
              {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
            <Text style={{ color: theme.colors.primary, fontWeight: '900', fontSize: 15, letterSpacing: 3 }}>
              SURGO
            </Text>
          </View>

          <Text style={{ color: theme.colors.text, fontSize: 28, fontWeight: '800', marginBottom: 16 }}>
            {greeting} 👋
          </Text>

          {/* Streak badge */}
          {streakLoaded && (
            <StreakBadge
              count={currentStreak}
              state={currentState}
              freezeCards={freezeCards}
              onFreezePress={handleFreezePress}
            />
          )}
        </View>

        {/* ── Motivation line ──────────────────────────────────────────────── */}
        <View style={{ backgroundColor: theme.colors.surfaceAlt, borderLeftColor: theme.colors.primary, borderLeftWidth: 3, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 24 }}>
          <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '600' }}>
            {theme.tone.taskMotivation}
          </Text>
        </View>

        {/* ── No goals yet ─────────────────────────────────────────────────── */}
        {!isLoading && goals.length === 0 && (
          <View style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: 16, padding: 28, alignItems: 'center' }}>
            <Text style={{ fontSize: 36, marginBottom: 12 }}>{theme.emoji.goal}</Text>
            <Text style={{ color: theme.colors.text, fontSize: 17, fontWeight: '700', marginBottom: 8, textAlign: 'center' }}>
              No goals yet
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 13, textAlign: 'center', marginBottom: 20 }}>
              Add your first goal and AI will generate today's tasks.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/goals')}
              style={{ backgroundColor: theme.colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 }}
            >
              <Text style={{ color: theme.colors.textInverse, fontWeight: '700' }}>
                + Add a Goal
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── No tasks today (but has goals) ──────────────────────────────── */}
        {!isLoading && goals.length > 0 && todaysTasks.length === 0 && (
          <View style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: 16, padding: 24, alignItems: 'center' }}>
            <Text style={{ fontSize: 32, marginBottom: 10 }}>✅</Text>
            <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '700', textAlign: 'center' }}>
              No tasks scheduled for today
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: 6 }}>
              Check your Goals tab to see upcoming tasks.
            </Text>
          </View>
        )}

        {/* ── Task list ────────────────────────────────────────────────────── */}
        {todaysTasks.length > 0 && (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ color: theme.colors.text, fontSize: 17, fontWeight: '800' }}>
                Today's Tasks
              </Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>
                {completedCount}/{totalCount} done
              </Text>
            </View>

            {/* Progress bar */}
            <View style={{ backgroundColor: theme.colors.border, height: 5, borderRadius: 3, marginBottom: 16 }}>
              <View
                style={{
                  backgroundColor: allDone ? theme.colors.success : theme.colors.primary,
                  height: 5,
                  borderRadius: 3,
                  width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                }}
              />
            </View>

            {todaysTasks.map((task) => (
              <TaskCard key={task.id} task={task} onComplete={handleCompleteTask} />
            ))}
          </>
        )}

        {/* ── Check-in button ──────────────────────────────────────────────── */}
        {allDone && currentState !== 'active' && (
          <TouchableOpacity
            onPress={handleCheckIn}
            style={{ backgroundColor: theme.colors.primary, marginTop: 20, paddingVertical: 16, borderRadius: 14, alignItems: 'center' }}
            activeOpacity={0.85}
          >
            <Text style={{ color: theme.colors.textInverse, fontSize: 16, fontWeight: '800' }}>
              {theme.emoji.win} Check In — Extend Streak
            </Text>
          </TouchableOpacity>
        )}

        {currentState === 'active' && (
          <View style={{ backgroundColor: theme.colors.success + '20', borderColor: theme.colors.success, borderWidth: 1, marginTop: 20, paddingVertical: 14, borderRadius: 14, alignItems: 'center' }}>
            <Text style={{ color: theme.colors.success, fontSize: 15, fontWeight: '700' }}>
              ✓ Checked in for today!
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
