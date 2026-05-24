import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import Svg, { Circle, Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useStreakStore } from '@/stores/streakStore';
import { useGoalStore } from '@/stores/goalStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useProfileStore } from '@/stores/profileStore';
import { StreakBadge } from '@/components/ui/StreakBadge';
import { TaskCard } from '@/components/ui/TaskCard';
import { WelcomeMascot } from '@/components/ui/WelcomeMascot';
import { BellIcon, NotificationPanel } from '@/components/ui/NotificationPanel';
import { TaskCelebrationModal } from '@/components/ui/TaskCelebrationModal';
import { getMilestoneQuote, getTodaysQuote } from '@/lib/quotes';
import { toDateString } from '@/lib/streak';

const USER_ID = 'local';

export default function TodayScreen() {
  const { theme, themeKey } = useTheme();

  const {
    streak, isLoaded: streakLoaded,
    checkIn, useFreeze, streakState, loadStreak,
  } = useStreakStore();

  const {
    isLoaded: goalsLoaded, load,
    getTodaysTasks, completeTask, goals,
  } = useGoalStore();

  const [refreshing, setRefreshing]       = useState(false);
  const [showNotifs, setShowNotifs]       = useState(false);
  const [celebration, setCelebration]     = useState<{ remaining: number; total: number } | null>(null);

  const {
    notifs, isLoaded: notifsLoaded,
    load: loadNotifs, generate, markAllRead, unreadCount,
  } = useNotificationStore();

  const { profile, isLoaded: profileLoaded, load: loadProfile } = useProfileStore();

  // Load data on mount
  useEffect(() => {
    if (!streakLoaded) loadStreak(USER_ID);
    if (!goalsLoaded) load();
    if (!notifsLoaded) loadNotifs();
    if (!profileLoaded) loadProfile();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadStreak(USER_ID), load()]);
    setRefreshing(false);
  }, []);

  const rawTasks = getTodaysTasks();

  // Incomplete tasks first, completed tasks sink to bottom
  const todaysTasks = [...rawTasks].sort((a, b) => {
    if (!!a.completedAt === !!b.completedAt) return 0;
    return a.completedAt ? 1 : -1;
  });

  const completedCount = todaysTasks.filter((t) => !!t.completedAt).length;
  const totalCount = todaysTasks.length;
  const allDone = totalCount > 0 && completedCount === totalCount;

  const currentState = streakState() ?? 'new';

  const DONE_COLOR: Record<string, string> = {
    soft:     '#FFB6C1',
    balanced: '#1C1C1E',
    hardcore: '#FF2800',
  };
  const doneColor = DONE_COLOR[themeKey] ?? theme.colors.success;
  const currentStreak = streak?.currentStreak ?? 0;
  const freezeCards = streak?.freezeCardsAvailable ?? 0;

  const handleCompleteTask = async (taskId: string) => {
    // Animate the reorder before the state update lands
    LayoutAnimation.configureNext({
      duration: 350,
      create: { type: 'easeInEaseOut', property: 'opacity' },
      update: { type: 'spring',        springDamping: 0.8 },
      delete: { type: 'easeInEaseOut', property: 'opacity' },
    });
    await completeTask(taskId);

    // Show celebration after state settles
    const updated   = getTodaysTasks();
    const total     = updated.length;
    const remaining = updated.filter(t => !t.completedAt).length;
    setCelebration({ remaining, total });
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

  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const isLoading = !streakLoaded || !goalsLoaded;

  // Generate fresh notifications whenever data is ready
  useEffect(() => {
    if (streakLoaded && goalsLoaded) {
      generate({
        streak: streak?.currentStreak ?? 0,
        completedToday: completedCount,
        totalToday: totalCount,
        hasGoals: goals.length > 0,
        themeKey,
      });
    }
  }, [streakLoaded, goalsLoaded, completedCount]);

  const handleBellPress = () => {
    setShowNotifs(true);
    markAllRead();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Task completion celebration */}
      <TaskCelebrationModal
        visible={!!celebration}
        remaining={celebration?.remaining ?? 0}
        total={celebration?.total ?? 0}
        onDismiss={() => setCelebration(null)}
      />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >

        {/* ── Top bar: SURGO wordmark · bell · profile ─────────────────────── */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <View style={{ backgroundColor: theme.colors.primaryLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
            <Text style={{ color: theme.colors.primary, fontWeight: '900', fontSize: 11, letterSpacing: 2.5 }}>
              SURGO
            </Text>
          </View>

          {/* Right-side icons */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
            {/* Progress icon */}
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/progress')}
              activeOpacity={0.72}
            >
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Path d="M3 21V13" stroke={theme.colors.textMuted} strokeWidth="3.5" strokeLinecap="round" opacity={0.5} />
                <Path d="M10 21V9"  stroke={theme.colors.textMuted} strokeWidth="3.5" strokeLinecap="round" opacity={0.7} />
                <Path d="M17 21V4" stroke={theme.colors.textMuted} strokeWidth="3.5" strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>

            <BellIcon unread={unreadCount()} onPress={handleBellPress} />

            {/* Profile avatar / icon */}
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/profile')}
              activeOpacity={0.72}
            >
              {profile.photoUri ? (
                <View style={{
                  width: 30, height: 30, borderRadius: 15,
                  overflow: 'hidden',
                  borderWidth: 1.5,
                  borderColor: theme.colors.primary + '60',
                }}>
                  <Image
                    source={{ uri: profile.photoUri }}
                    style={{ width: 30, height: 30 }}
                  />
                </View>
              ) : (
                <View style={{
                  width: 30, height: 30, borderRadius: 15,
                  backgroundColor: theme.colors.primaryLight,
                  borderWidth: 1.5,
                  borderColor: theme.colors.primary + '40',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                    <Circle cx="12" cy="8" r="4" stroke={theme.colors.primary} strokeWidth="1.8" />
                    <Path
                      d="M4 20 C4 16.13 7.58 13 12 13 C16.42 13 20 16.13 20 20"
                      stroke={theme.colors.primary} strokeWidth="1.8" strokeLinecap="round"
                    />
                  </Svg>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Notification panel */}
        <NotificationPanel
          visible={showNotifs}
          notifs={notifs}
          onClose={() => setShowNotifs(false)}
        />

        {/* ── Companion hero ───────────────────────────────────────────────── */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.colors.surface,
            borderRadius: 24,
            borderColor: theme.colors.border,
            borderWidth: 1,
            paddingHorizontal: 18,
            paddingVertical: 20,
            marginBottom: 16,
            gap: 16,
            shadowColor: theme.colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.10,
            shadowRadius: 12,
            elevation: 3,
          }}
        >
          {/* Mascot — tap to preview all poses */}
          <TouchableOpacity onPress={() => router.push('/mascot-preview')} activeOpacity={0.8}>
            <WelcomeMascot themeKey={themeKey} size={110} />
          </TouchableOpacity>

          {/* Greeting text */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: theme.colors.textMuted,
                fontSize: 11,
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: 1.8,
                marginBottom: 6,
              }}
            >
              {dateStr}
            </Text>
            <Text
              style={{
                color: theme.colors.text,
                fontSize: 26,
                fontWeight: '800',
                letterSpacing: -0.5,
                lineHeight: 30,
              }}
            >
              {greeting}
            </Text>
            <Text
              style={{
                color: theme.colors.primary,
                fontSize: 13,
                fontWeight: '700',
                marginTop: 8,
                letterSpacing: 0.2,
              }}
            >
              {theme.tone.taskMotivation}
            </Text>
          </View>
        </View>

        {/* ── Streak badge ─────────────────────────────────────────────────── */}
        {streakLoaded && (
          <View style={{ marginBottom: 20 }}>
            <StreakBadge
              count={currentStreak}
              state={currentState}
              freezeCards={freezeCards}
              onFreezePress={handleFreezePress}
            />
          </View>
        )}

        {/* ── No goals yet ─────────────────────────────────────────────────── */}
        {!isLoading && goals.length === 0 && (
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderWidth: 1,
              borderRadius: 20,
              padding: 28,
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
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
              <Text style={{ color: theme.colors.textInverse, fontWeight: '700' }}>+ Add a Goal</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── No tasks today (but has goals) ──────────────────────────────── */}
        {!isLoading && goals.length > 0 && todaysTasks.length === 0 && (
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderWidth: 1,
              borderRadius: 20,
              padding: 24,
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
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
            {/* Header row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 }}>
                Today's Tasks
              </Text>
              <View
                style={{
                  backgroundColor: allDone ? doneColor + '22' : theme.colors.surfaceAlt,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: allDone ? doneColor : theme.colors.textMuted, fontSize: 12, fontWeight: '700' }}>
                  {completedCount}/{totalCount} done
                </Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={{ backgroundColor: theme.colors.border, height: 6, borderRadius: 3, marginBottom: 14, overflow: 'hidden' }}>
              <View
                style={{
                  backgroundColor: allDone ? doneColor : theme.colors.primary,
                  height: 6,
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
            style={{
              backgroundColor: theme.colors.primary,
              marginTop: 20,
              paddingVertical: 16,
              borderRadius: 14,
              alignItems: 'center',
              shadowColor: theme.colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius: 12,
              elevation: 4,
            }}
            activeOpacity={0.85}
          >
            <Text style={{ color: theme.colors.textInverse, fontSize: 16, fontWeight: '800' }}>
              {theme.emoji.win} Check In — Extend Streak
            </Text>
          </TouchableOpacity>
        )}

        {currentState === 'active' && (
          <View
            style={{
              backgroundColor: doneColor + '20',
              borderColor: doneColor,
              borderWidth: 1,
              marginTop: 20,
              paddingVertical: 14,
              borderRadius: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: doneColor, fontSize: 15, fontWeight: '700' }}>
              ✓ Checked in for today!
            </Text>
          </View>
        )}

        {/* ── Nightly Review section ───────────────────────────────────────── */}
        {goals.filter((g) => g.isActive).length > 0 && (
          <View style={{ marginTop: 28 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.border }} />
              <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                End of day
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.border }} />
            </View>

            {goals.filter((g) => g.isActive).map((goal) => (
              <TouchableOpacity
                key={goal.id}
                onPress={() => router.push(`/review?goalId=${goal.id}`)}
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderWidth: 1.5,
                  borderRadius: 18,
                  padding: 16,
                  marginBottom: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                }}
                activeOpacity={0.8}
              >
                <View
                  style={{
                    width: 44, height: 44, borderRadius: 22,
                    backgroundColor: theme.colors.primaryLight,
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 22 }}>🌙</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 15 }}>
                    Nightly Review
                  </Text>
                  <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                    {goal.title}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: theme.colors.primaryLight,
                    width: 32, height: 32, borderRadius: 16,
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: theme.colors.primary, fontSize: 16, fontWeight: '700' }}>→</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
