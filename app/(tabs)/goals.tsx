import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useGoalStore } from '@/stores/goalStore';
import { GoalCategory } from '@/types';
import { generateGoalBreakdown } from '@/lib/claude';
import { toDateString, addDays } from '@/lib/streak';

const CATEGORIES: { key: GoalCategory; label: string; emoji: string }[] = [
  { key: 'fitness',       label: 'Fitness',       emoji: '💪' },
  { key: 'career',        label: 'Career',        emoji: '💼' },
  { key: 'learning',      label: 'Learning',      emoji: '📚' },
  { key: 'finance',       label: 'Finance',       emoji: '💰' },
  { key: 'health',        label: 'Health',        emoji: '🏥' },
  { key: 'relationships', label: 'Relationships', emoji: '❤️' },
  { key: 'creativity',    label: 'Creativity',    emoji: '🎨' },
  { key: 'other',         label: 'Other',         emoji: '⭐' },
];

const DEADLINES = [
  { label: '1 week',   days: 7   },
  { label: '1 month',  days: 30  },
  { label: '3 months', days: 90  },
  { label: '6 months', days: 180 },
  { label: '1 year',   days: 365 },
];

type Step = 'list' | 'create';

export default function GoalsScreen() {
  const { theme } = useTheme();
  const { goals, tasks, load, isLoaded, addGoal, addTasks, addMilestones, deleteGoal } = useGoalStore();
  const [step, setStep] = useState<Step>('list');

  // Form state
  const [title, setTitle]             = useState('');
  const [category, setCategory]       = useState<GoalCategory>('fitness');
  const [deadlineDays, setDeadlineDays] = useState(30);
  const [loading, setLoading]         = useState(false);

  useEffect(() => { if (!isLoaded) load(); }, []);

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Add a goal title', 'What do you want to achieve?');
      return;
    }

    const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
    if (!apiKey) {
      // No API key — create goal with placeholder tasks
      await createGoalWithPlaceholders();
      return;
    }

    setLoading(true);
    try {
      const targetDate = toDateString(
        new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000),
      );

      const goal = await addGoal({
        userId: 'local',
        title: title.trim(),
        category,
        targetDate,
        isActive: true,
      });

      // Call Claude for the breakdown
      const breakdown = await generateGoalBreakdown(
        title.trim(),
        targetDate,
        deadlineDays,
        theme.key,
      );

      // Save milestones
      await addMilestones(
        breakdown.milestones.map((m) => ({
          goalId: goal.id,
          title: m.title,
          targetDate: m.targetDate,
        })),
      );

      // Save week 1 tasks (map day number to actual date)
      const today = new Date();
      await addTasks(
        breakdown.weekTasks.map((t) => ({
          goalId: goal.id,
          userId: 'local',
          title: t.title,
          dueDate: toDateString(
            new Date(today.getTime() + (t.day - 1) * 24 * 60 * 60 * 1000),
          ),
          estimatedMinutes: t.estimatedMinutes,
          aiGenerated: true,
          isStretchTask: false,
        })),
      );

      // Also save today's special task if not already in week tasks
      const todayStr = toDateString(today);
      const hasTodayTask = breakdown.weekTasks.some((t) => t.day === 1);
      if (!hasTodayTask) {
        await addTasks([{
          goalId: goal.id,
          userId: 'local',
          title: breakdown.todayTask.title,
          dueDate: todayStr,
          estimatedMinutes: 15,
          aiGenerated: true,
          isStretchTask: false,
        }]);
      }

      resetForm();
      setStep('list');
      Alert.alert(
        `${theme.emoji.win} Goal Created!`,
        `AI has generated your first week of tasks. Check Today's tab to get started.`,
        [{ text: 'Let\'s go!' }],
      );
    } catch (err) {
      console.error(err);
      // Fallback — create goal without AI tasks
      await createGoalWithPlaceholders();
    } finally {
      setLoading(false);
    }
  };

  const createGoalWithPlaceholders = async () => {
    const targetDate = toDateString(
      new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000),
    );
    const goal = await addGoal({
      userId: 'local',
      title: title.trim(),
      category,
      targetDate,
      isActive: true,
    });
    // Add a starter task for today
    await addTasks([{
      goalId: goal.id,
      userId: 'local',
      title: `Start working on: ${title.trim()}`,
      dueDate: toDateString(new Date()),
      estimatedMinutes: 30,
      aiGenerated: false,
      isStretchTask: false,
    }]);
    resetForm();
    setStep('list');
  };

  const resetForm = () => {
    setTitle('');
    setCategory('fitness');
    setDeadlineDays(30);
  };

  const handleDelete = (goalId: string, goalTitle: string) => {
    Alert.alert(
      'Delete Goal',
      `Delete "${goalTitle}"? This will remove all its tasks too.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteGoal(goalId) },
      ],
    );
  };

  // ── List view ───────────────────────────────────────────────────────────────
  if (step === 'list') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <Text style={{ color: theme.colors.text, fontSize: 28, fontWeight: '800' }}>
              Goals
            </Text>
            <TouchableOpacity
              onPress={() => setStep('create')}
              style={{ backgroundColor: theme.colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}
            >
              <Text style={{ color: theme.colors.textInverse, fontWeight: '700' }}>+ New</Text>
            </TouchableOpacity>
          </View>

          {/* Empty state */}
          {goals.length === 0 && (
            <View style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: 16, padding: 32, alignItems: 'center' }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>{theme.emoji.goal}</Text>
              <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' }}>
                No goals yet
              </Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
                Set your first resolution and let AI break it into daily steps.
              </Text>
              <TouchableOpacity
                onPress={() => setStep('create')}
                style={{ backgroundColor: theme.colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
              >
                <Text style={{ color: theme.colors.textInverse, fontWeight: '700' }}>
                  + Add your first goal
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Goal cards */}
          {goals.map((goal) => {
            const goalTasks = tasks.filter((t) => t.goalId === goal.id);
            const doneTasks = goalTasks.filter((t) => !!t.completedAt).length;
            const cat = CATEGORIES.find((c) => c.key === goal.category);
            const daysLeft = Math.max(0, Math.ceil(
              (new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
            ));

            return (
              <TouchableOpacity
                key={goal.id}
                onPress={() => router.push(`/goal/${goal.id}`)}
                onLongPress={() => handleDelete(goal.id, goal.title)}
                style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 }}
                activeOpacity={0.8}
              >
                {/* Top row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ fontSize: 24, marginRight: 10 }}>{cat?.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '700' }}>
                      {goal.title}
                    </Text>
                    <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 2 }}>
                      {daysLeft} days left · {goalTasks.length} tasks
                    </Text>
                  </View>
                  <Text style={{ color: theme.colors.primary, fontWeight: '800', fontSize: 16 }}>
                    {goal.progress}%
                  </Text>
                </View>

                {/* Progress bar */}
                <View style={{ backgroundColor: theme.colors.border, height: 4, borderRadius: 2 }}>
                  <View style={{ backgroundColor: theme.colors.primary, height: 4, borderRadius: 2, width: `${goal.progress}%` }} />
                </View>

                <Text style={{ color: theme.colors.textMuted, fontSize: 11, marginTop: 6 }}>
                  Hold to delete · Tap for details
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Create view ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 28 }}>
            <TouchableOpacity onPress={() => { resetForm(); setStep('list'); }} style={{ marginRight: 12 }}>
              <Text style={{ color: theme.colors.primary, fontSize: 16 }}>← Back</Text>
            </TouchableOpacity>
            <Text style={{ color: theme.colors.text, fontSize: 22, fontWeight: '800' }}>
              New Goal
            </Text>
          </View>

          {/* Goal title */}
          <Text style={{ color: theme.colors.text, fontWeight: '700', marginBottom: 8 }}>
            What do you want to achieve?
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Run a 5K, Learn Spanish, Save $5000..."
            placeholderTextColor={theme.colors.textMuted}
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderWidth: 1,
              borderRadius: 12,
              padding: 14,
              color: theme.colors.text,
              fontSize: 15,
              marginBottom: 24,
            }}
            multiline
          />

          {/* Category */}
          <Text style={{ color: theme.colors.text, fontWeight: '700', marginBottom: 12 }}>
            Category
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                onPress={() => setCategory(cat.key)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 1.5,
                  borderColor: category === cat.key ? theme.colors.primary : theme.colors.border,
                  backgroundColor: category === cat.key ? theme.colors.primaryLight : theme.colors.surface,
                }}
              >
                <Text style={{ color: category === cat.key ? theme.colors.primary : theme.colors.textMuted, fontWeight: '600', fontSize: 13 }}>
                  {cat.emoji} {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Deadline */}
          <Text style={{ color: theme.colors.text, fontWeight: '700', marginBottom: 12 }}>
            Deadline
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
            {DEADLINES.map((d) => (
              <TouchableOpacity
                key={d.days}
                onPress={() => setDeadlineDays(d.days)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 1.5,
                  borderColor: deadlineDays === d.days ? theme.colors.primary : theme.colors.border,
                  backgroundColor: deadlineDays === d.days ? theme.colors.primaryLight : theme.colors.surface,
                }}
              >
                <Text style={{ color: deadlineDays === d.days ? theme.colors.primary : theme.colors.textMuted, fontWeight: '600' }}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* AI note */}
          <View style={{ backgroundColor: theme.colors.surfaceAlt, borderRadius: 12, padding: 12, marginBottom: 24, flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            <Text style={{ fontSize: 16 }}>✨</Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 13, flex: 1 }}>
              AI will break your goal into milestones and generate your first week of daily tasks automatically.
              {!process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY && '\n\nAdd EXPO_PUBLIC_ANTHROPIC_API_KEY to .env to enable AI.'}
            </Text>
          </View>

          {/* Submit */}
          <TouchableOpacity
            onPress={handleCreate}
            disabled={loading}
            style={{
              backgroundColor: loading ? theme.colors.border : theme.colors.primary,
              padding: 16,
              borderRadius: 14,
              alignItems: 'center',
            }}
          >
            {loading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ActivityIndicator color={theme.colors.textInverse} />
                <Text style={{ color: theme.colors.textInverse, fontWeight: '700' }}>
                  AI is building your plan...
                </Text>
              </View>
            ) : (
              <Text style={{ color: theme.colors.textInverse, fontWeight: '800', fontSize: 16 }}>
                {theme.emoji.goal} Create Goal
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
