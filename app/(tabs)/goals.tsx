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

// ─── Category accent colours ──────────────────────────────────────────────────

const CATEGORY_COLORS: Record<GoalCategory, string> = {
  fitness:       '#F97316',
  career:        '#6366F1',
  learning:      '#0EA5E9',
  finance:       '#22C55E',
  health:        '#EC4899',
  relationships: '#F43F5E',
  creativity:    '#A855F7',
  other:         '#94A3B8',
};

// ─── Config ───────────────────────────────────────────────────────────────────

const CATEGORIES: { key: GoalCategory; label: string; emoji: string }[] = [
  { key: 'fitness',       label: 'Fitness',       emoji: '💪' },
  { key: 'career',        label: 'Career',        emoji: '💼' },
  { key: 'learning',      label: 'Learning',      emoji: '📚' },
  { key: 'finance',       label: 'Finance',       emoji: '💰' },
  { key: 'health',        label: 'Health',        emoji: '🏥' },
  { key: 'relationships', label: 'Love',          emoji: '❤️' },
  { key: 'creativity',    label: 'Creative',      emoji: '🎨' },
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
  { label: '15 min',   minutes: 15,  desc: 'Quick daily habit',  hrs: '1.75' },
  { label: '30 min',   minutes: 30,  desc: 'Solid commitment',   hrs: '3.5'  },
  { label: '1 hour',   minutes: 60,  desc: 'Serious progress',   hrs: '7'    },
  { label: '1.5 hrs',  minutes: 90,  desc: 'Strong dedication',  hrs: '10.5' },
  { label: '2 hours',  minutes: 120, desc: 'High performer',     hrs: '14'   },
  { label: '3+ hours', minutes: 180, desc: 'All in',             hrs: '21+'  },
];

type Step = 'list' | 'step1' | 'step2' | 'analyzing' | 'review';

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function GoalsScreen() {
  const { theme, themeKey } = useTheme();
  const { goals, tasks, load, isLoaded, addGoal, addTasks, addMilestones, deleteGoal } = useGoalStore();

  const [step, setStep]                 = useState<Step>('list');
  const [title, setTitle]               = useState('');
  const [category, setCategory]         = useState<GoalCategory>('fitness');
  const [deadlineDays, setDeadlineDays] = useState(30);
  const [minutesPerDay, setMinutesPerDay] = useState(30);
  const [analysis, setAnalysis]         = useState<GoalAnalysis | null>(null);
  const [saving, setSaving]             = useState(false);

  useEffect(() => { if (!isLoaded) load(); }, []);

  const resetForm = () => {
    setTitle(''); setCategory('fitness');
    setDeadlineDays(30); setMinutesPerDay(30);
    setAnalysis(null);
  };

  const handleStep1Next = () => {
    if (!title.trim()) {
      Alert.alert('Enter your goal', 'What do you want to achieve?');
      return;
    }
    setStep('step2');
  };

  const handleAnalyze = async () => {
    const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
    if (!apiKey) {
      setAnalysis(buildPlaceholderAnalysis());
      setStep('review');
      return;
    }
    setStep('analyzing');
    try {
      const targetDate = toDateString(new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000));
      const result = await analyzeGoal(title.trim(), targetDate, deadlineDays, minutesPerDay, theme.key);
      setAnalysis(result);
      setStep('review');
    } catch (err) {
      const msg = String(err);
      const isQuota   = msg.includes('429') || msg.includes('quota') || msg.includes('rate_limit');
      const isInvalid = msg.includes('401') || msg.includes('403') || msg.includes('invalid_api_key');
      const detail =
        isQuota   ? 'Groq free tier limit hit — resets in minutes.' :
        isInvalid ? 'Groq API key is invalid. Check EXPO_PUBLIC_GROQ_API_KEY.' :
        msg.slice(0, 180);
      setAnalysis(buildPlaceholderAnalysis());
      setStep('review');
      Alert.alert('AI unavailable — basic plan used', detail);
    }
  };

  const handleConfirm = async () => {
    if (!analysis) return;
    setSaving(true);
    try {
      const targetDate = toDateString(new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000));
      const goal = await addGoal({
        userId: 'local', title: title.trim(), category,
        targetDate, isActive: true, minutesPerDay,
        overview: analysis.overview,
        achievabilityNote: analysis.achievabilityNote,
        timeBreakdown: analysis.timeBreakdown,
      });
      await addMilestones(analysis.milestones.map((m) => ({
        goalId: goal.id, title: m.title, targetDate: m.targetDate,
      })));
      const today = new Date();
      await addTasks(analysis.weekTasks.map((t) => ({
        goalId: goal.id, userId: 'local', title: t.title,
        dueDate: toDateString(new Date(today.getTime() + (t.day - 1) * 24 * 60 * 60 * 1000)),
        estimatedMinutes: t.estimatedMinutes, aiGenerated: true, isStretchTask: false,
      })));
      resetForm();
      setStep('list');
      Alert.alert(`${theme.emoji.win} Goal Created!`, `Your AI plan is ready. Check Today tab to start.`, [{ text: "Let's go!" }]);
    } catch (err) {
      Alert.alert('Error saving goal', String(err));
    } finally {
      setSaving(false);
    }
  };

  function buildPlaceholderAnalysis(): GoalAnalysis {
    return {
      overview: `You want to achieve: "${title}". With ${minutesPerDay} minutes per day over ${deadlineDays} days, you have ${minutesPerDay * deadlineDays} total minutes to invest.`,
      achievabilityNote: `This goal is achievable with consistent daily effort.`,
      timeBreakdown: `Spend your ${minutesPerDay} minutes per day focused entirely on this goal.`,
      keyActivities: [{ activity: 'Daily focused work', timePerWeek: `${minutesPerDay * 7} mins/week`, why: 'Consistency is the key.', howTo: 'Show up every day.' }],
      milestones: [
        { title: '25% complete', targetDate: toDateString(new Date(Date.now() + deadlineDays * 0.25 * 86400000)) },
        { title: '50% complete', targetDate: toDateString(new Date(Date.now() + deadlineDays * 0.5  * 86400000)) },
        { title: '75% complete', targetDate: toDateString(new Date(Date.now() + deadlineDays * 0.75 * 86400000)) },
        { title: 'Goal achieved!',targetDate: toDateString(new Date(Date.now() + deadlineDays * 86400000)) },
      ],
      weekTasks: [1,2,3,4,5,6,7].map((day) => ({
        title: `Day ${day}: Work on "${title}"`, day, estimatedMinutes: minutesPerDay,
      })),
      todayTask: { title: `Start working on: ${title}`, why: 'The first step is the most important.' },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GOAL LIST
  // ─────────────────────────────────────────────────────────────────────────────

  if (step === 'list') {
    const activeCount = goals.filter(g => g.isActive).length;

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

          {/* ── Header ── */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <View>
              <Text style={{ color: theme.colors.text, fontSize: 30, fontWeight: '900', letterSpacing: -0.8 }}>
                My Goals
              </Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: 13, fontWeight: '500', marginTop: 2 }}>
                {activeCount > 0 ? `${activeCount} active goal${activeCount !== 1 ? 's' : ''}` : 'Nothing yet — start your first'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setStep('step1')}
              style={{
                backgroundColor: theme.colors.primary,
                width: 44, height: 44, borderRadius: 22,
                alignItems: 'center', justifyContent: 'center',
                shadowColor: theme.colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.30,
                shadowRadius: 10,
                elevation: 5,
              }}
            >
              <Text style={{ color: theme.colors.textInverse, fontSize: 26, lineHeight: 30, fontWeight: '400' }}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: theme.colors.border, marginBottom: 24, marginTop: 6 }} />

          {/* ── Empty state ── */}
          {goals.length === 0 && (
            <View style={{
              backgroundColor: theme.colors.surface,
              borderRadius: 24,
              padding: 36,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: theme.colors.border,
              marginTop: 16,
            }}>
              <View style={{
                width: 80, height: 80, borderRadius: 40,
                backgroundColor: theme.colors.primaryLight,
                alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
              }}>
                <Text style={{ fontSize: 38 }}>{theme.emoji.goal}</Text>
              </View>
              <Text style={{ color: theme.colors.text, fontSize: 20, fontWeight: '800', marginBottom: 8, letterSpacing: -0.4 }}>
                Dream it. Do it.
              </Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: 28 }}>
                Set your first resolution and AI will build your entire daily plan — tasks, milestones, the works.
              </Text>
              <TouchableOpacity
                onPress={() => setStep('step1')}
                style={{
                  backgroundColor: theme.colors.primary,
                  paddingHorizontal: 28, paddingVertical: 14,
                  borderRadius: 14,
                  shadowColor: theme.colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.28,
                  shadowRadius: 10,
                  elevation: 4,
                }}
              >
                <Text style={{ color: theme.colors.textInverse, fontWeight: '800', fontSize: 15 }}>
                  + Set Your First Goal
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Goal cards ── */}
          {goals.map((goal) => {
            const goalTasks  = tasks.filter((t) => t.goalId === goal.id);
            const cat        = CATEGORIES.find((c) => c.key === goal.category);
            const catColor   = CATEGORY_COLORS[goal.category] ?? theme.colors.primary;
            const daysLeft   = Math.max(0, Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / 86400000));
            const etaShift   = goal.totalEtaShiftDays ?? 0;
            const hasReview  = goal.lastReviewDate != null;
            const etaColor   = etaShift < 0 ? '#22C55E' : etaShift > 0 ? theme.colors.danger : theme.colors.textMuted;
            const etaLabel   = etaShift < 0 ? `${Math.abs(etaShift)}d ahead` : etaShift > 0 ? `+${etaShift}d behind` : 'on track';
            const completedTasks = goalTasks.filter((t) => !!t.completedAt).length;
            const progress   = goal.progress ?? 0;

            return (
              <TouchableOpacity
                key={goal.id}
                onPress={() => router.push(`/goal/${goal.id}`)}
                onLongPress={() => Alert.alert('Delete Goal', `Delete "${goal.title}"?`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => deleteGoal(goal.id) },
                ])}
                activeOpacity={0.82}
                style={{
                  backgroundColor: theme.colors.surface,
                  borderRadius: 20,
                  marginBottom: 14,
                  overflow: 'hidden',
                  shadowColor: catColor,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.12,
                  shadowRadius: 14,
                  elevation: 3,
                  borderWidth: 1,
                  borderColor: catColor + '22',
                }}
              >
                {/* ── Coloured category header ── */}
                <View style={{
                  backgroundColor: catColor + '14',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                }}>
                  <View style={{
                    width: 34, height: 34, borderRadius: 10,
                    backgroundColor: catColor + '25',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: 17 }}>{cat?.emoji}</Text>
                  </View>
                  <Text style={{
                    color: catColor, fontSize: 11,
                    fontWeight: '800', letterSpacing: 1.4,
                    textTransform: 'uppercase', flex: 1,
                  }}>
                    {cat?.label}
                  </Text>
                  {hasReview && (
                    <View style={{ backgroundColor: etaColor + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                      <Text style={{ color: etaColor, fontSize: 10, fontWeight: '700' }}>{etaLabel}</Text>
                    </View>
                  )}
                </View>

                {/* ── Card body ── */}
                <View style={{ padding: 16 }}>
                  {/* Title + % */}
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 10 }}>
                    <Text style={{
                      flex: 1, color: theme.colors.text,
                      fontSize: 16, fontWeight: '700', lineHeight: 22,
                    }} numberOfLines={2}>
                      {goal.title}
                    </Text>
                    <Text style={{ color: catColor, fontSize: 22, fontWeight: '900' }}>
                      {progress}%
                    </Text>
                  </View>

                  {/* Progress bar */}
                  <View style={{
                    backgroundColor: catColor + '18',
                    height: 6, borderRadius: 3, marginBottom: 12,
                  }}>
                    <View style={{
                      backgroundColor: catColor, height: 6,
                      borderRadius: 3, width: `${progress}%`,
                    }} />
                  </View>

                  {/* Meta row */}
                  <View style={{ flexDirection: 'row', gap: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ fontSize: 11 }}>📅</Text>
                      <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '500' }}>
                        {daysLeft}d left
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ fontSize: 11 }}>✅</Text>
                      <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '500' }}>
                        {completedTasks}/{goalTasks.length} tasks
                      </Text>
                    </View>
                    {(goal.minutesPerDay ?? 0) > 0 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontSize: 11 }}>⏱</Text>
                        <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '500' }}>
                          {goal.minutesPerDay}m/day
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 1 — What's your goal?
  // ─────────────────────────────────────────────────────────────────────────────

  if (step === 'step1') {
    const catColor = CATEGORY_COLORS[category];
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">

            {/* Back + step dots */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
              <TouchableOpacity onPress={() => { resetForm(); setStep('list'); }} activeOpacity={0.7}>
                <Text style={{ color: theme.colors.primary, fontSize: 15, fontWeight: '700' }}>← Back</Text>
              </TouchableOpacity>
              <StepDots current={1} total={2} color={theme.colors.primary} />
            </View>

            {/* Heading */}
            <Text style={{ color: theme.colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.6, marginBottom: 6 }}>
              What's your goal?
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 14, lineHeight: 20, marginBottom: 28 }}>
              Be specific — the more detail you share, the better AI can coach you.
            </Text>

            {/* Text input */}
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={`e.g. Run a 5K in under 30 minutes…`}
              placeholderTextColor={theme.colors.textMuted}
              multiline
              numberOfLines={3}
              style={{
                backgroundColor: theme.colors.surface,
                borderColor: title ? theme.colors.primary : theme.colors.border,
                borderWidth: 1.5,
                borderRadius: 16,
                padding: 16,
                color: theme.colors.text,
                fontSize: 15,
                lineHeight: 22,
                minHeight: 90,
                textAlignVertical: 'top',
                marginBottom: 32,
              }}
            />

            {/* Category label */}
            <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 14 }}>
              Category
            </Text>

            {/* Category grid — 4 columns */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 32 }}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.key;
                const cc = CATEGORY_COLORS[cat.key];
                return (
                  <TouchableOpacity
                    key={cat.key}
                    onPress={() => setCategory(cat.key)}
                    style={{
                      width: '22%',
                      aspectRatio: 1,
                      borderRadius: 16,
                      backgroundColor: isSelected ? cc : cc + '12',
                      borderWidth: 2,
                      borderColor: isSelected ? cc : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={{ fontSize: 22 }}>{cat.emoji}</Text>
                    <Text style={{
                      color: isSelected ? '#fff' : cc,
                      fontSize: 8, fontWeight: '900',
                      letterSpacing: 0.6, textTransform: 'uppercase',
                    }}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Deadline label */}
            <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 14 }}>
              Deadline
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 36 }}>
              {DEADLINES.map((d) => {
                const isSelected = deadlineDays === d.days;
                return (
                  <TouchableOpacity
                    key={d.days}
                    onPress={() => setDeadlineDays(d.days)}
                    style={{
                      paddingHorizontal: 16, paddingVertical: 10,
                      borderRadius: 12,
                      backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                      borderWidth: 1.5,
                      borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={{
                      color: isSelected ? theme.colors.textInverse : theme.colors.text,
                      fontWeight: '700', fontSize: 13,
                    }}>
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Next button */}
            <TouchableOpacity
              onPress={handleStep1Next}
              style={{
                backgroundColor: theme.colors.primary,
                paddingVertical: 17,
                borderRadius: 16,
                alignItems: 'center',
                shadowColor: theme.colors.primary,
                shadowOffset: { width: 0, height: 5 },
                shadowOpacity: 0.30,
                shadowRadius: 12,
                elevation: 5,
              }}
              activeOpacity={0.85}
            >
              <Text style={{ color: theme.colors.textInverse, fontWeight: '800', fontSize: 16 }}>
                Next  →
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 2 — How much time per day?
  // ─────────────────────────────────────────────────────────────────────────────

  if (step === 'step2') {
    const cat = CATEGORIES.find(c => c.key === category);
    const catColor = CATEGORY_COLORS[category];

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>

          {/* Back + step dots */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
            <TouchableOpacity onPress={() => setStep('step1')} activeOpacity={0.7}>
              <Text style={{ color: theme.colors.primary, fontSize: 15, fontWeight: '700' }}>← Back</Text>
            </TouchableOpacity>
            <StepDots current={2} total={2} color={theme.colors.primary} />
          </View>

          {/* Heading */}
          <Text style={{ color: theme.colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.6, marginBottom: 6 }}>
            Time per day?
          </Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: 14, lineHeight: 20, marginBottom: 20 }}>
            Be honest — better to under-commit and over-deliver.
          </Text>

          {/* Goal recap pill */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 10,
            backgroundColor: catColor + '12',
            borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11,
            marginBottom: 28,
            borderWidth: 1, borderColor: catColor + '22',
          }}>
            <Text style={{ fontSize: 18 }}>{cat?.emoji}</Text>
            <Text style={{ color: catColor, fontWeight: '700', fontSize: 13, flex: 1 }} numberOfLines={1}>
              {title}
            </Text>
            <View style={{ backgroundColor: catColor + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
              <Text style={{ color: catColor, fontSize: 11, fontWeight: '700' }}>
                {DEADLINES.find(d => d.days === deadlineDays)?.label}
              </Text>
            </View>
          </View>

          {/* Time options */}
          <View style={{ gap: 10, marginBottom: 28 }}>
            {TIME_OPTIONS.map((opt) => {
              const isSelected = minutesPerDay === opt.minutes;
              return (
                <TouchableOpacity
                  key={opt.minutes}
                  onPress={() => setMinutesPerDay(opt.minutes)}
                  style={{
                    flexDirection: 'row', alignItems: 'center',
                    backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                    borderWidth: 1.5,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                    borderRadius: 16,
                    padding: 16,
                    gap: 14,
                  }}
                  activeOpacity={0.8}
                >
                  {/* Time badge */}
                  <View style={{
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.18)' : theme.colors.primaryLight,
                    borderRadius: 10,
                    paddingHorizontal: 10, paddingVertical: 6,
                    minWidth: 64, alignItems: 'center',
                  }}>
                    <Text style={{
                      color: isSelected ? theme.colors.textInverse : theme.colors.primary,
                      fontSize: 15, fontWeight: '900',
                    }}>
                      {opt.label}
                    </Text>
                  </View>

                  {/* Description */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: isSelected ? theme.colors.textInverse : theme.colors.text, fontWeight: '700', fontSize: 14 }}>
                      {opt.desc}
                    </Text>
                    <Text style={{ color: isSelected ? 'rgba(255,255,255,0.65)' : theme.colors.textMuted, fontSize: 12, marginTop: 2 }}>
                      {opt.hrs} hrs/week
                    </Text>
                  </View>

                  {/* Check */}
                  {isSelected && (
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* AI hint */}
          <View style={{
            backgroundColor: theme.colors.surfaceAlt,
            borderRadius: 14, padding: 16, marginBottom: 28,
            borderWidth: 1, borderColor: theme.colors.border,
            gap: 6,
          }}>
            <Text style={{ color: theme.colors.text, fontWeight: '800', fontSize: 13 }}>✨ What happens next</Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 13, lineHeight: 20 }}>
              AI will check if your goal is achievable in {deadlineDays} days, tell you exactly what to do and why, and generate a full week of daily tasks.
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleAnalyze}
            style={{
              backgroundColor: theme.colors.primary,
              paddingVertical: 17, borderRadius: 16,
              alignItems: 'center',
              shadowColor: theme.colors.primary,
              shadowOffset: { width: 0, height: 5 },
              shadowOpacity: 0.30, shadowRadius: 12, elevation: 5,
            }}
            activeOpacity={0.85}
          >
            <Text style={{ color: theme.colors.textInverse, fontWeight: '800', fontSize: 16 }}>
              ✨ Build My AI Plan
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ANALYZING
  // ─────────────────────────────────────────────────────────────────────────────

  if (step === 'analyzing') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
        <View style={{
          backgroundColor: theme.colors.surface,
          borderRadius: 28, padding: 36,
          alignItems: 'center', width: '100%',
          borderWidth: 1, borderColor: theme.colors.border,
          shadowColor: theme.colors.primary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12, shadowRadius: 24, elevation: 6,
        }}>
          <View style={{
            width: 72, height: 72, borderRadius: 36,
            backgroundColor: theme.colors.primaryLight,
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 20,
          }}>
            <Text style={{ fontSize: 32 }}>✨</Text>
          </View>
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginBottom: 20 }} />
          <Text style={{ color: theme.colors.text, fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 8, letterSpacing: -0.4 }}>
            Building your plan…
          </Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 21 }}>
            AI is analysing your goal, figuring out what it takes, and creating your first week of tasks.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // REVIEW
  // ─────────────────────────────────────────────────────────────────────────────

  if (step === 'review' && analysis) {
    const todayTasks = analysis.weekTasks.filter((t) => t.day === 1);
    const cat = CATEGORIES.find(c => c.key === category);
    const catColor = CATEGORY_COLORS[category];

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 56 }}>

          {/* Back */}
          <TouchableOpacity onPress={() => setStep('step2')} style={{ marginBottom: 20 }} activeOpacity={0.7}>
            <Text style={{ color: theme.colors.primary, fontSize: 15, fontWeight: '700' }}>← Edit</Text>
          </TouchableOpacity>

          {/* Hero header */}
          <View style={{
            backgroundColor: theme.colors.primary,
            borderRadius: 22, padding: 22, marginBottom: 20,
            shadowColor: theme.colors.primary,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.28, shadowRadius: 20, elevation: 6,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 10, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 18 }}>{cat?.emoji}</Text>
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.80)', fontSize: 11, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase' }}>
                ✨ Your AI Plan
              </Text>
            </View>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', lineHeight: 26, marginBottom: 8 }}>
              {title}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[
                `${minutesPerDay} min/day`,
                DEADLINES.find(d => d.days === deadlineDays)?.label ?? '',
                theme.name,
              ].map((tag, i) => (
                <View key={i} style={{ backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 }}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>

          <ReviewCard emoji="📋" title="Overview" theme={theme}>
            <Text style={{ color: theme.colors.text, fontSize: 14, lineHeight: 22 }}>{analysis.overview}</Text>
          </ReviewCard>

          <ReviewCard emoji="🎯" title="Achievability" theme={theme}>
            <Text style={{ color: theme.colors.text, fontSize: 14, lineHeight: 22 }}>{analysis.achievabilityNote}</Text>
          </ReviewCard>

          <ReviewCard emoji="⏱" title={`Using your ${minutesPerDay} min/day`} theme={theme}>
            <Text style={{ color: theme.colors.text, fontSize: 14, lineHeight: 22 }}>{analysis.timeBreakdown}</Text>
          </ReviewCard>

          <ReviewCard emoji="🔑" title="What you need to do" theme={theme}>
            {analysis.keyActivities.map((act, i) => (
              <View key={i} style={{ marginBottom: i < analysis.keyActivities.length - 1 ? 16 : 0 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 14, flex: 1 }}>{act.activity}</Text>
                  <View style={{ backgroundColor: theme.colors.primaryLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                    <Text style={{ color: theme.colors.primary, fontSize: 11, fontWeight: '600' }}>{act.timePerWeek}</Text>
                  </View>
                </View>
                <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: '600', marginBottom: 3 }}>Why: {act.why}</Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: 13, lineHeight: 19 }}>How: {act.howTo}</Text>
                {i < analysis.keyActivities.length - 1 && (
                  <View style={{ height: 1, backgroundColor: theme.colors.border, marginTop: 14 }} />
                )}
              </View>
            ))}
          </ReviewCard>

          <ReviewCard emoji="🏁" title="Milestones" theme={theme}>
            {analysis.milestones.map((m, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: i < analysis.milestones.length - 1 ? 12 : 0 }}>
                <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '600' }}>{m.title}</Text>
                  <Text style={{ color: theme.colors.textMuted, fontSize: 11, marginTop: 1 }}>
                    By {new Date(m.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              </View>
            ))}
          </ReviewCard>

          <ReviewCard emoji="📅" title={`Today's tasks (${todayTasks.length})`} theme={theme}>
            {todayTasks.map((t, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: i < todayTasks.length - 1 ? 10 : 0 }}>
                <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: theme.colors.border, marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '600' }}>{t.title}</Text>
                  {t.estimatedMinutes > 0 && (
                    <Text style={{ color: theme.colors.textMuted, fontSize: 11, marginTop: 1 }}>~{t.estimatedMinutes} min</Text>
                  )}
                </View>
              </View>
            ))}
            <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 12 }}>
              + {analysis.weekTasks.length - todayTasks.length} more tasks across the next 7 days
            </Text>
          </ReviewCard>

          {/* Confirm */}
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={saving}
            style={{
              backgroundColor: saving ? theme.colors.border : theme.colors.primary,
              paddingVertical: 18, borderRadius: 16,
              alignItems: 'center', marginTop: 8,
              shadowColor: saving ? 'transparent' : theme.colors.primary,
              shadowOffset: { width: 0, height: 5 },
              shadowOpacity: 0.28, shadowRadius: 14, elevation: 5,
            }}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color={theme.colors.textInverse} />
            ) : (
              <Text style={{ color: theme.colors.textInverse, fontWeight: '800', fontSize: 16 }}>
                {theme.emoji.goal}  Start This Goal
              </Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepDots({ current, total, color }: { current: number; total: number; color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            width:  i + 1 === current ? 20 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i + 1 <= current ? color : color + '28',
          }}
        />
      ))}
      <Text style={{ color, fontSize: 11, fontWeight: '700', marginLeft: 4 }}>
        {current}/{total}
      </Text>
    </View>
  );
}

function ReviewCard({ emoji, title, children, theme }: { emoji: string; title: string; children: React.ReactNode; theme: any }) {
  return (
    <View style={{
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: 18,
      padding: 18,
      marginBottom: 12,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Text style={{ fontSize: 16 }}>{emoji}</Text>
        <Text style={{ color: theme.colors.text, fontWeight: '800', fontSize: 14 }}>{title}</Text>
      </View>
      {children}
    </View>
  );
}
