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
import { analyzeGoal, GoalAnalysis } from '@/lib/claude';
import { toDateString } from '@/lib/streak';

// ─── Config ───────────────────────────────────────────────────────────────────

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

const TIME_OPTIONS = [
  { label: '15 min',   minutes: 15,  desc: 'Quick daily habit' },
  { label: '30 min',   minutes: 30,  desc: 'Solid commitment' },
  { label: '1 hour',   minutes: 60,  desc: 'Serious progress' },
  { label: '1.5 hrs',  minutes: 90,  desc: 'Strong dedication' },
  { label: '2 hours',  minutes: 120, desc: 'High performer' },
  { label: '3+ hours', minutes: 180, desc: 'All in' },
];

type Step = 'list' | 'step1' | 'step2' | 'analyzing' | 'review';

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function GoalsScreen() {
  const { theme } = useTheme();
  const { goals, tasks, load, isLoaded, addGoal, addTasks, addMilestones, deleteGoal } = useGoalStore();

  const [step, setStep]               = useState<Step>('list');
  const [title, setTitle]             = useState('');
  const [category, setCategory]       = useState<GoalCategory>('fitness');
  const [deadlineDays, setDeadlineDays] = useState(30);
  const [minutesPerDay, setMinutesPerDay] = useState(30);
  const [analysis, setAnalysis]       = useState<GoalAnalysis | null>(null);
  const [saving, setSaving]           = useState(false);

  useEffect(() => { if (!isLoaded) load(); }, []);

  const resetForm = () => {
    setTitle(''); setCategory('fitness');
    setDeadlineDays(30); setMinutesPerDay(30);
    setAnalysis(null);
  };

  // ── Step 1 → Step 2 ──────────────────────────────────────────────────────

  const handleStep1Next = () => {
    if (!title.trim()) {
      Alert.alert('Enter your goal', 'What do you want to achieve?');
      return;
    }
    setStep('step2');
  };

  // ── Step 2 → Analyzing ────────────────────────────────────────────────────

  const handleAnalyze = async () => {
    const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
    if (!apiKey) {
      // No API key — skip to review with placeholder data
      setAnalysis(buildPlaceholderAnalysis());
      setStep('review');
      return;
    }

    setStep('analyzing');
    try {
      const targetDate = toDateString(
        new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000),
      );
      const result = await analyzeGoal(
        title.trim(), targetDate, deadlineDays, minutesPerDay, theme.key,
      );
      setAnalysis(result);
      setStep('review');
    } catch (err) {
      console.error(err);
      setAnalysis(buildPlaceholderAnalysis());
      setStep('review');
      Alert.alert('AI unavailable', 'Using a basic plan. Add your Anthropic API key for full AI coaching.');
    }
  };

  // ── Review → Save ─────────────────────────────────────────────────────────

  const handleConfirm = async () => {
    if (!analysis) return;
    setSaving(true);
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
        minutesPerDay,
        overview: analysis.overview,
        achievabilityNote: analysis.achievabilityNote,
        timeBreakdown: analysis.timeBreakdown,
      });

      await addMilestones(
        analysis.milestones.map((m) => ({
          goalId: goal.id,
          title: m.title,
          targetDate: m.targetDate,
        })),
      );

      const today = new Date();
      await addTasks(
        analysis.weekTasks.map((t) => ({
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

      resetForm();
      setStep('list');
      Alert.alert(
        `${theme.emoji.win} Goal Created!`,
        `Your AI plan is ready. Check the Today tab to start your first task.`,
        [{ text: "Let's go!" }],
      );
    } catch (err) {
      Alert.alert('Error saving goal', String(err));
    } finally {
      setSaving(false);
    }
  };

  // ── Placeholder when no API key ───────────────────────────────────────────

  function buildPlaceholderAnalysis(): GoalAnalysis {
    return {
      overview: `You want to achieve: "${title}". This is a great goal. With ${minutesPerDay} minutes per day over ${deadlineDays} days, you have ${minutesPerDay * deadlineDays} total minutes to invest.`,
      achievabilityNote: `This goal is achievable with consistent daily effort.`,
      timeBreakdown: `Spend your ${minutesPerDay} minutes per day focused entirely on this goal.`,
      keyActivities: [
        { activity: 'Daily focused work', timePerWeek: `${minutesPerDay * 7} mins/week`, why: 'Consistency is the key to any goal.', howTo: 'Show up every day and do the work.' },
      ],
      milestones: [
        { title: '25% complete', targetDate: toDateString(new Date(Date.now() + deadlineDays * 0.25 * 86400000)) },
        { title: '50% complete', targetDate: toDateString(new Date(Date.now() + deadlineDays * 0.5 * 86400000)) },
        { title: '75% complete', targetDate: toDateString(new Date(Date.now() + deadlineDays * 0.75 * 86400000)) },
        { title: 'Goal achieved!', targetDate: toDateString(new Date(Date.now() + deadlineDays * 86400000)) },
      ],
      weekTasks: [1,2,3,4,5,6,7].map((day) => ({
        title: `Day ${day}: Work on "${title}"`,
        day,
        estimatedMinutes: minutesPerDay,
      })),
      todayTask: { title: `Start working on: ${title}`, why: 'The first step is the most important.' },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  // ── Goal list ─────────────────────────────────────────────────────────────
  if (step === 'list') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <Text style={{ color: theme.colors.text, fontSize: 28, fontWeight: '800' }}>Goals</Text>
            <TouchableOpacity
              onPress={() => setStep('step1')}
              style={{ backgroundColor: theme.colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}
            >
              <Text style={{ color: theme.colors.textInverse, fontWeight: '700' }}>+ New</Text>
            </TouchableOpacity>
          </View>

          {goals.length === 0 && (
            <View style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: 16, padding: 32, alignItems: 'center' }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>{theme.emoji.goal}</Text>
              <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' }}>No goals yet</Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
                Set your first resolution. AI will build your entire plan.
              </Text>
              <TouchableOpacity
                onPress={() => setStep('step1')}
                style={{ backgroundColor: theme.colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
              >
                <Text style={{ color: theme.colors.textInverse, fontWeight: '700' }}>+ Add your first goal</Text>
              </TouchableOpacity>
            </View>
          )}

          {goals.map((goal) => {
            const goalTasks = tasks.filter((t) => t.goalId === goal.id);
            const cat = CATEGORIES.find((c) => c.key === goal.category);
            const daysLeft = Math.max(0, Math.ceil(
              (new Date(goal.targetDate).getTime() - Date.now()) / 86400000,
            ));
            return (
              <TouchableOpacity
                key={goal.id}
                onPress={() => router.push(`/goal/${goal.id}`)}
                onLongPress={() => Alert.alert('Delete Goal', `Delete "${goal.title}"?`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => deleteGoal(goal.id) },
                ])}
                style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 }}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ fontSize: 24, marginRight: 10 }}>{cat?.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '700' }}>{goal.title}</Text>
                    <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 2 }}>
                      {daysLeft} days left · {goalTasks.length} tasks
                      {goal.minutesPerDay ? ` · ${goal.minutesPerDay} min/day` : ''}
                    </Text>
                  </View>
                  <Text style={{ color: theme.colors.primary, fontWeight: '800', fontSize: 16 }}>{goal.progress}%</Text>
                </View>
                <View style={{ backgroundColor: theme.colors.border, height: 4, borderRadius: 2 }}>
                  <View style={{ backgroundColor: theme.colors.primary, height: 4, borderRadius: 2, width: `${goal.progress}%` }} />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Step 1: Goal info ─────────────────────────────────────────────────────
  if (step === 'step1') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <TouchableOpacity onPress={() => { resetForm(); setStep('list'); }} style={{ marginBottom: 20 }}>
              <Text style={{ color: theme.colors.primary, fontSize: 16 }}>← Back</Text>
            </TouchableOpacity>

            {/* Progress indicator */}
            <StepIndicator current={1} total={2} theme={theme} />

            <Text style={{ color: theme.colors.text, fontSize: 24, fontWeight: '800', marginBottom: 4 }}>
              What's your goal?
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 14, marginBottom: 24 }}>
              Be specific — the more detail you give, the better AI can coach you.
            </Text>

            {/* Title input */}
            <Text style={{ color: theme.colors.text, fontWeight: '700', marginBottom: 8 }}>Describe your goal</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Run a 5K in under 30 minutes, Learn conversational Spanish, Save $10,000 for a trip..."
              placeholderTextColor={theme.colors.textMuted}
              style={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderWidth: 1.5,
                borderRadius: 12,
                padding: 14,
                color: theme.colors.text,
                fontSize: 15,
                marginBottom: 24,
                minHeight: 80,
                textAlignVertical: 'top',
              }}
              multiline
              numberOfLines={3}
            />

            {/* Category */}
            <Text style={{ color: theme.colors.text, fontWeight: '700', marginBottom: 12 }}>Category</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  onPress={() => setCategory(cat.key)}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
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
            <Text style={{ color: theme.colors.text, fontWeight: '700', marginBottom: 12 }}>Deadline</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
              {DEADLINES.map((d) => (
                <TouchableOpacity
                  key={d.days}
                  onPress={() => setDeadlineDays(d.days)}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
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

            <TouchableOpacity
              onPress={handleStep1Next}
              style={{ backgroundColor: theme.colors.primary, padding: 16, borderRadius: 14, alignItems: 'center' }}
            >
              <Text style={{ color: theme.colors.textInverse, fontWeight: '800', fontSize: 16 }}>
                Next → How much time?
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Step 2: Time per day ──────────────────────────────────────────────────
  if (step === 'step2') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <TouchableOpacity onPress={() => setStep('step1')} style={{ marginBottom: 20 }}>
            <Text style={{ color: theme.colors.primary, fontSize: 16 }}>← Back</Text>
          </TouchableOpacity>

          <StepIndicator current={2} total={2} theme={theme} />

          <Text style={{ color: theme.colors.text, fontSize: 24, fontWeight: '800', marginBottom: 4 }}>
            How much time per day?
          </Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: 14, marginBottom: 8 }}>
            Be honest — AI will build your plan around this. Better to under-commit and over-deliver.
          </Text>

          {/* Goal summary pill */}
          <View style={{ backgroundColor: theme.colors.primaryLight, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 16 }}>{CATEGORIES.find(c => c.key === category)?.emoji}</Text>
            <Text style={{ color: theme.colors.primary, fontWeight: '600', fontSize: 13, flex: 1 }} numberOfLines={1}>
              {title} · {DEADLINES.find(d => d.days === deadlineDays)?.label}
            </Text>
          </View>

          {/* Time options */}
          <View style={{ gap: 10, marginBottom: 32 }}>
            {TIME_OPTIONS.map((opt) => {
              const isSelected = minutesPerDay === opt.minutes;
              const weeklyHours = ((opt.minutes * 7) / 60).toFixed(1);
              return (
                <TouchableOpacity
                  key={opt.minutes}
                  onPress={() => setMinutesPerDay(opt.minutes)}
                  style={{
                    backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                    borderWidth: 1.5,
                    borderRadius: 14,
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  activeOpacity={0.8}
                >
                  <View>
                    <Text style={{ color: isSelected ? theme.colors.textInverse : theme.colors.text, fontWeight: '700', fontSize: 17 }}>
                      {opt.label}
                    </Text>
                    <Text style={{ color: isSelected ? theme.colors.textInverse + 'cc' : theme.colors.textMuted, fontSize: 12, marginTop: 2 }}>
                      {opt.desc} · {weeklyHours} hrs/week
                    </Text>
                  </View>
                  {isSelected && (
                    <View style={{ backgroundColor: theme.colors.textInverse + '30', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: theme.colors.textInverse, fontWeight: '800' }}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* AI hint */}
          <View style={{ backgroundColor: theme.colors.surfaceAlt, borderRadius: 12, padding: 14, marginBottom: 24, gap: 6 }}>
            <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 13 }}>✨ What AI will do next</Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>
              • Analyse if your goal is achievable in {deadlineDays} days with {minutesPerDay} mins/day{'\n'}
              • Tell you exactly what activities to do and why{'\n'}
              • Show how to split your {minutesPerDay} minutes per day{'\n'}
              • Generate a full week of specific daily tasks
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleAnalyze}
            style={{ backgroundColor: theme.colors.primary, padding: 16, borderRadius: 14, alignItems: 'center' }}
          >
            <Text style={{ color: theme.colors.textInverse, fontWeight: '800', fontSize: 16 }}>
              ✨ Build My AI Plan
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Analyzing (loading) ───────────────────────────────────────────────────
  if (step === 'analyzing') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginBottom: 24 }} />
        <Text style={{ color: theme.colors.text, fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 8 }}>
          Building your plan...
        </Text>
        <Text style={{ color: theme.colors.textMuted, fontSize: 14, textAlign: 'center' }}>
          AI is analysing your goal, calculating what it takes, and generating your first week of tasks.
        </Text>
      </SafeAreaView>
    );
  }

  // ── Review AI plan ────────────────────────────────────────────────────────
  if (step === 'review' && analysis) {
    const todayTasks = analysis.weekTasks.filter((t) => t.day === 1);
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
          <TouchableOpacity onPress={() => setStep('step2')} style={{ marginBottom: 20 }}>
            <Text style={{ color: theme.colors.primary, fontSize: 16 }}>← Edit</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={{ backgroundColor: theme.colors.primary, borderRadius: 16, padding: 18, marginBottom: 20 }}>
            <Text style={{ color: theme.colors.textInverse, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>
              ✨ Your AI Plan
            </Text>
            <Text style={{ color: theme.colors.textInverse, fontSize: 20, fontWeight: '800', marginBottom: 8 }}>
              {title}
            </Text>
            <Text style={{ color: theme.colors.textInverse + 'cc', fontSize: 13 }}>
              {minutesPerDay} min/day · {DEADLINES.find(d => d.days === deadlineDays)?.label} · {theme.name} pace
            </Text>
          </View>

          {/* Overview */}
          <SectionCard title="📋 Overview" theme={theme}>
            <Text style={{ color: theme.colors.text, fontSize: 14, lineHeight: 22 }}>{analysis.overview}</Text>
          </SectionCard>

          {/* Achievability */}
          <SectionCard title="🎯 Achievability" theme={theme}>
            <Text style={{ color: theme.colors.text, fontSize: 14, lineHeight: 22 }}>{analysis.achievabilityNote}</Text>
          </SectionCard>

          {/* Time breakdown */}
          <SectionCard title={`⏱ How to use your ${minutesPerDay} minutes/day`} theme={theme}>
            <Text style={{ color: theme.colors.text, fontSize: 14, lineHeight: 22 }}>{analysis.timeBreakdown}</Text>
          </SectionCard>

          {/* Key activities */}
          <SectionCard title="🔑 What you need to do" theme={theme}>
            {analysis.keyActivities.map((act, i) => (
              <View key={i} style={{ marginBottom: i < analysis.keyActivities.length - 1 ? 16 : 0 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 14, flex: 1 }}>{act.activity}</Text>
                  <View style={{ backgroundColor: theme.colors.primaryLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                    <Text style={{ color: theme.colors.primary, fontSize: 11, fontWeight: '600' }}>{act.timePerWeek}</Text>
                  </View>
                </View>
                <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: '600', marginBottom: 3 }}>
                  Why: {act.why}
                </Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: 13, lineHeight: 19 }}>
                  How: {act.howTo}
                </Text>
                {i < analysis.keyActivities.length - 1 && (
                  <View style={{ height: 1, backgroundColor: theme.colors.border, marginTop: 14 }} />
                )}
              </View>
            ))}
          </SectionCard>

          {/* Milestones */}
          <SectionCard title="🏁 Milestones" theme={theme}>
            {analysis.milestones.map((m, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: i < analysis.milestones.length - 1 ? 10 : 0 }}>
                <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: theme.colors.primary, marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '600' }}>{m.title}</Text>
                  <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>
                    By {new Date(m.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              </View>
            ))}
          </SectionCard>

          {/* Today's tasks preview */}
          <SectionCard title={`📅 Today's tasks (${todayTasks.length})`} theme={theme}>
            {todayTasks.map((t, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: i < todayTasks.length - 1 ? 10 : 0, gap: 8 }}>
                <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: theme.colors.border, marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '600' }}>{t.title}</Text>
                  {t.estimatedMinutes > 0 && (
                    <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>~{t.estimatedMinutes} min</Text>
                  )}
                </View>
              </View>
            ))}
            <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 10 }}>
              + {analysis.weekTasks.length - todayTasks.length} more tasks across the next 7 days
            </Text>
          </SectionCard>

          {/* Confirm button */}
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={saving}
            style={{ backgroundColor: saving ? theme.colors.border : theme.colors.primary, padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 8 }}
          >
            {saving ? (
              <ActivityIndicator color={theme.colors.textInverse} />
            ) : (
              <Text style={{ color: theme.colors.textInverse, fontWeight: '800', fontSize: 16 }}>
                {theme.emoji.goal} Start This Goal
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function StepIndicator({ current, total, theme }: { current: number; total: number; theme: any }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 20 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            flex: 1, height: 4, borderRadius: 2,
            backgroundColor: i < current ? theme.colors.primary : theme.colors.border,
          }}
        />
      ))}
    </View>
  );
}

function SectionCard({ title, children, theme }: { title: string; children: React.ReactNode; theme: any }) {
  return (
    <View style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 14 }}>
      <Text style={{ color: theme.colors.text, fontWeight: '800', fontSize: 14, marginBottom: 12 }}>{title}</Text>
      {children}
    </View>
  );
}
