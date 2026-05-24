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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useGoalStore } from '@/stores/goalStore';
import { GoalCategory } from '@/types';
import { analyzeGoal, GoalAnalysis } from '@/lib/claude';
import { toDateString } from '@/lib/streak';
import { WelcomeMascot } from '@/components/ui/WelcomeMascot';

const { width: SW } = Dimensions.get('window');

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

const CATEGORIES: { key: GoalCategory; label: string; emoji: string }[] = [
  { key: 'fitness',       label: 'Fitness',  emoji: '💪' },
  { key: 'career',        label: 'Career',   emoji: '💼' },
  { key: 'learning',      label: 'Learning', emoji: '📚' },
  { key: 'finance',       label: 'Finance',  emoji: '💰' },
  { key: 'health',        label: 'Health',   emoji: '🏥' },
  { key: 'relationships', label: 'Love',     emoji: '❤️' },
  { key: 'creativity',    label: 'Creative', emoji: '🎨' },
  { key: 'other',         label: 'Other',    emoji: '⭐' },
];

const DEADLINES = [
  { label: '1 week',   days: 7   },
  { label: '1 month',  days: 30  },
  { label: '3 months', days: 90  },
  { label: '6 months', days: 180 },
  { label: '1 year',   days: 365 },
];

const TIME_OPTIONS = [
  { label: '15 min',   minutes: 15,  desc: 'Quick daily habit',  hrs: '1.75 hrs/week' },
  { label: '30 min',   minutes: 30,  desc: 'Solid commitment',   hrs: '3.5 hrs/week'  },
  { label: '1 hour',   minutes: 60,  desc: 'Serious progress',   hrs: '7 hrs/week'    },
  { label: '1.5 hrs',  minutes: 90,  desc: 'Strong dedication',  hrs: '10.5 hrs/week' },
  { label: '2 hours',  minutes: 120, desc: 'High performer',     hrs: '14 hrs/week'   },
  { label: '3+ hours', minutes: 180, desc: 'All in',             hrs: '21+ hrs/week'  },
];

type Step = 'list' | 'step1' | 'step2' | 'analyzing' | 'review';

// ─── Surgo speech bubble ──────────────────────────────────────────────────────

function SurgoBubble({
  themeKey, pose = 'happy', headline, sub,
}: {
  themeKey: any;
  pose?: any;
  headline: string;
  sub?: string;
}) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 28 }}>
      <WelcomeMascot themeKey={themeKey} size={88} pose={pose} />
      <View style={{
        flex: 1,
        backgroundColor: theme.colors.surface,
        borderRadius: 18,
        borderBottomLeftRadius: 4,
        padding: 14,
        marginLeft: 10,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: theme.colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2,
      }}>
        {/* Bubble tail */}
        <View style={{
          position: 'absolute', left: -7, bottom: 14,
          width: 0, height: 0,
          borderTopWidth: 7, borderTopColor: 'transparent',
          borderBottomWidth: 7, borderBottomColor: 'transparent',
          borderRightWidth: 7, borderRightColor: theme.colors.surface,
        }} />
        <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: '800', lineHeight: 22 }}>
          {headline}
        </Text>
        {sub && (
          <Text style={{ color: theme.colors.textMuted, fontSize: 13, marginTop: 4, lineHeight: 19 }}>
            {sub}
          </Text>
        )}
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function GoalsScreen() {
  const { theme, themeKey } = useTheme();
  const { goals, tasks, load, isLoaded, addGoal, addTasks, addMilestones, deleteGoal } = useGoalStore();

  const [step, setStep]                   = useState<Step>('list');
  const [title, setTitle]                 = useState('');
  const [category, setCategory]           = useState<GoalCategory>('fitness');
  const [deadlineDays, setDeadlineDays]   = useState(30);
  const [minutesPerDay, setMinutesPerDay] = useState(30);
  const [analysis, setAnalysis]           = useState<GoalAnalysis | null>(null);
  const [saving, setSaving]               = useState(false);

  useEffect(() => { if (!isLoaded) load(); }, []);

  const resetForm = () => {
    setTitle(''); setCategory('fitness');
    setDeadlineDays(30); setMinutesPerDay(30); setAnalysis(null);
  };

  const handleStep1Next = () => {
    if (!title.trim()) { Alert.alert('Hey!', 'Tell me your goal first 😊'); return; }
    setStep('step2');
  };

  const handleAnalyze = async () => {
    const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
    if (!apiKey) { setAnalysis(buildPlaceholder()); setStep('review'); return; }
    setStep('analyzing');
    try {
      const targetDate = toDateString(new Date(Date.now() + deadlineDays * 86400000));
      const result = await analyzeGoal(title.trim(), targetDate, deadlineDays, minutesPerDay, theme.key);
      setAnalysis(result); setStep('review');
    } catch (err) {
      const msg = String(err);
      const detail = msg.includes('429') ? 'Rate limit hit — try again in a minute.' : msg.slice(0, 120);
      setAnalysis(buildPlaceholder()); setStep('review');
      Alert.alert('Used basic plan', detail);
    }
  };

  const handleConfirm = async () => {
    if (!analysis) return;
    setSaving(true);
    try {
      const targetDate = toDateString(new Date(Date.now() + deadlineDays * 86400000));
      const goal = await addGoal({
        userId: 'local', title: title.trim(), category,
        targetDate, isActive: true, minutesPerDay,
        overview: analysis.overview,
        achievabilityNote: analysis.achievabilityNote,
        timeBreakdown: analysis.timeBreakdown,
      });
      await addMilestones(analysis.milestones.map(m => ({ goalId: goal.id, title: m.title, targetDate: m.targetDate })));
      const today = new Date();
      await addTasks(analysis.weekTasks.map(t => ({
        goalId: goal.id, userId: 'local', title: t.title,
        dueDate: toDateString(new Date(today.getTime() + (t.day - 1) * 86400000)),
        estimatedMinutes: t.estimatedMinutes, aiGenerated: true, isStretchTask: false,
      })));
      resetForm(); setStep('list');
      Alert.alert('Goal locked in!', 'Check Today tab to start your first task.', [{ text: "Let's go!" }]);
    } catch (err) {
      Alert.alert('Error', String(err));
    } finally { setSaving(false); }
  };

  function buildPlaceholder(): GoalAnalysis {
    return {
      overview: `Love this goal! ${deadlineDays} days with ${minutesPerDay} min/day is totally doable if you stay consistent.`,
      achievabilityNote: `Yep, this is realistic — just show up every day.`,
      timeBreakdown: `Use all ${minutesPerDay} mins focused on this goal each day.`,
      keyActivities: [{ activity: 'Daily focused work', timePerWeek: `${minutesPerDay * 7} mins/week`, why: 'Consistency beats intensity.', howTo: 'Block the time and just start.' }],
      milestones: [
        { title: '25% done', targetDate: toDateString(new Date(Date.now() + deadlineDays * 0.25 * 86400000)) },
        { title: 'Halfway!',  targetDate: toDateString(new Date(Date.now() + deadlineDays * 0.5  * 86400000)) },
        { title: '75% done', targetDate: toDateString(new Date(Date.now() + deadlineDays * 0.75 * 86400000)) },
        { title: 'Goal achieved!', targetDate: toDateString(new Date(Date.now() + deadlineDays * 86400000)) },
      ],
      weekTasks: [1,2,3,4,5,6,7].map(day => ({ title: `Day ${day}: Work on "${title}"`, day, estimatedMinutes: minutesPerDay })),
      todayTask: { title: `Start: ${title}`, why: 'The first step is everything.' },
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // GOAL LIST
  // ───────────────────────────────────────────────────────────────────────────

  if (step === 'list') {
    const activeCount = goals.filter(g => g.isActive).length;

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>

          {/* ── Header: title left, Surgo + "+" right ── */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
            <View>
              <Text style={{ color: theme.colors.text, fontSize: 32, fontWeight: '900', letterSpacing: -1 }}>
                My Goals
              </Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: 13, marginTop: 3 }}>
                {activeCount > 0 ? `${activeCount} active goal${activeCount !== 1 ? 's' : ''}` : 'No goals yet'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
              <WelcomeMascot themeKey={themeKey} size={72} pose="happy" />
              <TouchableOpacity
                onPress={() => setStep('step1')}
                style={{
                  backgroundColor: theme.colors.primary,
                  width: 46, height: 46, borderRadius: 23,
                  alignItems: 'center', justifyContent: 'center',
                  marginBottom: 6,
                  shadowColor: theme.colors.primary,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
                }}
              >
                <Text style={{ color: theme.colors.textInverse, fontSize: 28, lineHeight: 32, fontWeight: '300' }}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Empty state ── */}
          {goals.length === 0 && (
            <View style={{
              backgroundColor: theme.colors.surface,
              borderRadius: 28, paddingHorizontal: 28,
              paddingTop: 40, paddingBottom: 36,
              alignItems: 'center',
              borderWidth: 1, borderColor: theme.colors.border,
              shadowColor: theme.colors.primary,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.08, shadowRadius: 20, elevation: 4,
            }}>
              <WelcomeMascot themeKey={themeKey} size={130} pose="happy" />
              <Text style={{
                color: theme.colors.text, fontSize: 22, fontWeight: '900',
                marginTop: 18, marginBottom: 8, letterSpacing: -0.5, textAlign: 'center',
              }}>
                I'm ready when you are!
              </Text>
              <Text style={{
                color: theme.colors.textMuted, fontSize: 14,
                textAlign: 'center', lineHeight: 21, marginBottom: 28,
              }}>
                Set your first goal and I'll build your entire daily plan — tasks, milestones, everything.
              </Text>
              <TouchableOpacity
                onPress={() => setStep('step1')}
                style={{
                  backgroundColor: theme.colors.primary,
                  paddingHorizontal: 32, paddingVertical: 15,
                  borderRadius: 16,
                  shadowColor: theme.colors.primary,
                  shadowOffset: { width: 0, height: 5 },
                  shadowOpacity: 0.30, shadowRadius: 12, elevation: 5,
                }}
              >
                <Text style={{ color: theme.colors.textInverse, fontWeight: '800', fontSize: 15 }}>
                  Set My First Goal
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Goal cards ── */}
          {goals.map((goal) => {
            const goalTasks      = tasks.filter(t => t.goalId === goal.id);
            const cat            = CATEGORIES.find(c => c.key === goal.category);
            const cc             = CATEGORY_COLORS[goal.category] ?? theme.colors.primary;
            const daysLeft       = Math.max(0, Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / 86400000));
            const completedTasks = goalTasks.filter(t => !!t.completedAt).length;
            const progress       = goal.progress ?? 0;
            const etaShift       = goal.totalEtaShiftDays ?? 0;
            const hasReview      = goal.lastReviewDate != null;
            const etaColor       = etaShift < 0 ? '#22C55E' : etaShift > 0 ? theme.colors.danger : theme.colors.textMuted;
            const etaLabel       = etaShift < 0 ? `${Math.abs(etaShift)}d ahead` : etaShift > 0 ? `+${etaShift}d behind` : 'On track';

            return (
              <TouchableOpacity
                key={goal.id}
                onPress={() => router.push(`/goal/${goal.id}`)}
                onLongPress={() => Alert.alert('Delete goal?', `"${goal.title}"`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => deleteGoal(goal.id) },
                ])}
                activeOpacity={0.84}
                style={{
                  borderRadius: 22,
                  marginBottom: 16,
                  overflow: 'hidden',
                  backgroundColor: theme.colors.surface,
                  shadowColor: cc,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.14, shadowRadius: 16, elevation: 4,
                  borderWidth: 1, borderColor: cc + '20',
                }}
              >
                {/* ── Coloured header strip ── */}
                <View style={{ backgroundColor: cc + '16', paddingHorizontal: 18, paddingVertical: 14, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{
                    width: 38, height: 38, borderRadius: 12,
                    backgroundColor: cc + '28',
                    alignItems: 'center', justifyContent: 'center',
                    marginRight: 10,
                  }}>
                    <Text style={{ fontSize: 18 }}>{cat?.emoji}</Text>
                  </View>
                  <Text style={{ color: cc, fontSize: 11, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase', flex: 1 }}>
                    {cat?.label}
                  </Text>
                  {/* ETA badge */}
                  {hasReview && (
                    <View style={{ backgroundColor: etaColor + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                      <Text style={{ color: etaColor, fontSize: 10, fontWeight: '800' }}>{etaLabel}</Text>
                    </View>
                  )}
                </View>

                {/* ── Card body ── */}
                <View style={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 16 }}>
                  {/* Title + % */}
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 10 }}>
                    <Text style={{ flex: 1, color: theme.colors.text, fontSize: 17, fontWeight: '800', lineHeight: 24 }} numberOfLines={2}>
                      {goal.title}
                    </Text>
                    <Text style={{ color: cc, fontSize: 24, fontWeight: '900', letterSpacing: -0.5 }}>
                      {progress}%
                    </Text>
                  </View>

                  {/* Progress bar */}
                  <View style={{ height: 7, borderRadius: 4, backgroundColor: cc + '1A', marginBottom: 12 }}>
                    <View style={{ height: 7, borderRadius: 4, backgroundColor: cc, width: `${progress}%` }} />
                  </View>

                  {/* Meta */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ backgroundColor: cc + '14', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 }}>
                      <Text style={{ color: cc, fontSize: 11, fontWeight: '700' }}>{daysLeft}d left</Text>
                    </View>
                    <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>·</Text>
                    <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '500' }}>
                      {completedTasks}/{goalTasks.length} tasks done
                    </Text>
                    {(goal.minutesPerDay ?? 0) > 0 && (
                      <>
                        <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>·</Text>
                        <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '500' }}>
                          {goal.minutesPerDay}m/day
                        </Text>
                      </>
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

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 1 — Surgo asks: What's your goal?
  // ───────────────────────────────────────────────────────────────────────────

  if (step === 'step1') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">

            {/* Back + dots */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <TouchableOpacity onPress={() => { resetForm(); setStep('list'); }} activeOpacity={0.7}>
                <Text style={{ color: theme.colors.primary, fontSize: 15, fontWeight: '700' }}>← Back</Text>
              </TouchableOpacity>
              <StepDots current={1} total={2} color={theme.colors.primary} />
            </View>

            {/* Surgo speech bubble */}
            <SurgoBubble
              themeKey={themeKey}
              pose="happy"
              headline="What's your goal?"
              sub="Tell me what you want to achieve — be as specific as you like!"
            />

            {/* Text input */}
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Run a 5K in 30 min, learn Spanish, save $5k…"
              placeholderTextColor={theme.colors.textMuted}
              multiline
              numberOfLines={3}
              style={{
                backgroundColor: theme.colors.surface,
                borderColor: title ? theme.colors.primary : theme.colors.border,
                borderWidth: 2,
                borderRadius: 18,
                padding: 16,
                color: theme.colors.text,
                fontSize: 16,
                lineHeight: 24,
                minHeight: 96,
                textAlignVertical: 'top',
                marginBottom: 32,
              }}
            />

            {/* Category */}
            <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>
              Category
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 32 }}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.key;
                const cc = CATEGORY_COLORS[cat.key];
                return (
                  <TouchableOpacity
                    key={cat.key}
                    onPress={() => setCategory(cat.key)}
                    activeOpacity={0.8}
                    style={{
                      width: '22%', aspectRatio: 1,
                      borderRadius: 18,
                      backgroundColor: isSelected ? cc : cc + '14',
                      borderWidth: 2, borderColor: isSelected ? cc : 'transparent',
                      alignItems: 'center', justifyContent: 'center', gap: 4,
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>{cat.emoji}</Text>
                    <Text style={{ color: isSelected ? '#fff' : cc, fontSize: 8, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Deadline */}
            <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>
              Deadline
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 36 }}>
              {DEADLINES.map((d) => {
                const isSelected = deadlineDays === d.days;
                return (
                  <TouchableOpacity
                    key={d.days}
                    onPress={() => setDeadlineDays(d.days)}
                    activeOpacity={0.8}
                    style={{
                      paddingHorizontal: 18, paddingVertical: 11,
                      borderRadius: 14,
                      backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                      borderWidth: 1.5,
                      borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                    }}
                  >
                    <Text style={{ color: isSelected ? theme.colors.textInverse : theme.colors.text, fontWeight: '700', fontSize: 13 }}>
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={handleStep1Next}
              activeOpacity={0.85}
              style={{
                backgroundColor: theme.colors.primary,
                paddingVertical: 17, borderRadius: 16,
                alignItems: 'center',
                shadowColor: theme.colors.primary,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.32, shadowRadius: 14, elevation: 6,
              }}
            >
              <Text style={{ color: theme.colors.textInverse, fontWeight: '800', fontSize: 16 }}>Next →</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 2 — Surgo asks: How much time?
  // ───────────────────────────────────────────────────────────────────────────

  if (step === 'step2') {
    const cat = CATEGORIES.find(c => c.key === category);
    const cc  = CATEGORY_COLORS[category];

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>

          {/* Back + dots */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <TouchableOpacity onPress={() => setStep('step1')} activeOpacity={0.7}>
              <Text style={{ color: theme.colors.primary, fontSize: 15, fontWeight: '700' }}>← Back</Text>
            </TouchableOpacity>
            <StepDots current={2} total={2} color={theme.colors.primary} />
          </View>

          {/* Surgo speech bubble */}
          <SurgoBubble
            themeKey={themeKey}
            pose="thumbsUp"
            headline="How much time can you give me?"
            sub="Be honest — I'll build your plan around whatever you've got!"
          />

          {/* Goal recap pill */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 10,
            backgroundColor: cc + '12', borderRadius: 14,
            paddingHorizontal: 14, paddingVertical: 12,
            marginBottom: 24, borderWidth: 1, borderColor: cc + '22',
          }}>
            <Text style={{ fontSize: 18 }}>{cat?.emoji}</Text>
            <Text style={{ color: cc, fontWeight: '700', fontSize: 13, flex: 1 }} numberOfLines={1}>{title}</Text>
            <View style={{ backgroundColor: cc + '22', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
              <Text style={{ color: cc, fontSize: 11, fontWeight: '700' }}>
                {DEADLINES.find(d => d.days === deadlineDays)?.label}
              </Text>
            </View>
          </View>

          {/* Time options */}
          <View style={{ gap: 10, marginBottom: 30 }}>
            {TIME_OPTIONS.map((opt) => {
              const isSelected = minutesPerDay === opt.minutes;
              return (
                <TouchableOpacity
                  key={opt.minutes}
                  onPress={() => setMinutesPerDay(opt.minutes)}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 14,
                    backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                    borderWidth: 1.5, borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                    borderRadius: 16, padding: 16,
                  }}
                >
                  <View style={{
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.20)' : theme.colors.primaryLight,
                    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, minWidth: 68, alignItems: 'center',
                  }}>
                    <Text style={{ color: isSelected ? '#fff' : theme.colors.primary, fontSize: 15, fontWeight: '900' }}>
                      {opt.label}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: isSelected ? '#fff' : theme.colors.text, fontWeight: '700', fontSize: 14 }}>{opt.desc}</Text>
                    <Text style={{ color: isSelected ? 'rgba(255,255,255,0.65)' : theme.colors.textMuted, fontSize: 12, marginTop: 2 }}>{opt.hrs}</Text>
                  </View>
                  {isSelected && (
                    <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '900' }}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            onPress={handleAnalyze}
            activeOpacity={0.85}
            style={{
              backgroundColor: theme.colors.primary,
              paddingVertical: 17, borderRadius: 16, alignItems: 'center',
              shadowColor: theme.colors.primary,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.32, shadowRadius: 14, elevation: 6,
            }}
          >
            <Text style={{ color: theme.colors.textInverse, fontWeight: '800', fontSize: 16 }}>
              Build My Plan
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ANALYZING
  // ───────────────────────────────────────────────────────────────────────────

  if (step === 'analyzing') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <View style={{
          backgroundColor: theme.colors.surface,
          borderRadius: 28, padding: 36,
          alignItems: 'center', width: '100%',
          borderWidth: 1, borderColor: theme.colors.border,
          shadowColor: theme.colors.primary,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.14, shadowRadius: 28, elevation: 8,
        }}>
          <WelcomeMascot themeKey={themeKey} size={130} pose="motivating" />
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20, marginBottom: 18 }} />
          <Text style={{ color: theme.colors.text, fontSize: 20, fontWeight: '900', letterSpacing: -0.4, marginBottom: 8 }}>
            On it!
          </Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 21 }}>
            Building your personal plan — tasks, milestones, everything.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REVIEW
  // ───────────────────────────────────────────────────────────────────────────

  if (step === 'review' && analysis) {
    const todayTasks = analysis.weekTasks.filter(t => t.day === 1);
    const cat = CATEGORIES.find(c => c.key === category);
    const cc  = CATEGORY_COLORS[category];

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 56 }}>

          {/* Back */}
          <TouchableOpacity onPress={() => setStep('step2')} style={{ marginBottom: 20 }} activeOpacity={0.7}>
            <Text style={{ color: theme.colors.primary, fontSize: 15, fontWeight: '700' }}>← Edit</Text>
          </TouchableOpacity>

          {/* Surgo reaction bubble */}
          <SurgoBubble
            themeKey={themeKey}
            pose="thumbsUp"
            headline="Here's your plan!"
            sub="Looks good to me — tap Start when you're ready!"
          />

          {/* Hero card */}
          <View style={{
            backgroundColor: theme.colors.primary,
            borderRadius: 22, padding: 22, marginBottom: 16,
            shadowColor: theme.colors.primary,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.28, shadowRadius: 20, elevation: 6,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.20)', borderRadius: 10, width: 34, height: 34, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 17 }}>{cat?.emoji}</Text>
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.80)', fontSize: 11, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase' }}>
                Your AI Plan
              </Text>
            </View>
            <Text style={{ color: '#fff', fontSize: 19, fontWeight: '800', lineHeight: 26, marginBottom: 10 }}>{title}</Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {[`${minutesPerDay} min/day`, DEADLINES.find(d => d.days === deadlineDays)?.label ?? '', theme.name].map((tag, i) => (
                <View key={i} style={{ backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9 }}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>

          <ReviewCard title="Overview" theme={theme}><Text style={{ color: theme.colors.text, fontSize: 14, lineHeight: 22 }}>{analysis.overview}</Text></ReviewCard>
          <ReviewCard title="Achievability" theme={theme}><Text style={{ color: theme.colors.text, fontSize: 14, lineHeight: 22 }}>{analysis.achievabilityNote}</Text></ReviewCard>
          <ReviewCard title={`Your ${minutesPerDay} min/day`} theme={theme}><Text style={{ color: theme.colors.text, fontSize: 14, lineHeight: 22 }}>{analysis.timeBreakdown}</Text></ReviewCard>

          <ReviewCard title="What to do" theme={theme}>
            {analysis.keyActivities.map((act, i) => (
              <View key={i} style={{ marginBottom: i < analysis.keyActivities.length - 1 ? 14 : 0 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 14, flex: 1 }}>{act.activity}</Text>
                  <View style={{ backgroundColor: theme.colors.primaryLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                    <Text style={{ color: theme.colors.primary, fontSize: 11, fontWeight: '600' }}>{act.timePerWeek}</Text>
                  </View>
                </View>
                <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: '600', marginBottom: 2 }}>{act.why}</Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: 13, lineHeight: 19 }}>{act.howTo}</Text>
                {i < analysis.keyActivities.length - 1 && <View style={{ height: 1, backgroundColor: theme.colors.border, marginTop: 12 }} />}
              </View>
            ))}
          </ReviewCard>

          <ReviewCard title="Milestones" theme={theme}>
            {analysis.milestones.map((m, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: i < analysis.milestones.length - 1 ? 12 : 0 }}>
                <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '600' }}>{m.title}</Text>
                  <Text style={{ color: theme.colors.textMuted, fontSize: 11, marginTop: 1 }}>
                    {new Date(m.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              </View>
            ))}
          </ReviewCard>

          <ReviewCard title={`Today's tasks (${todayTasks.length})`} theme={theme}>
            {todayTasks.map((t, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: i < todayTasks.length - 1 ? 10 : 0 }}>
                <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: theme.colors.border, marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '600' }}>{t.title}</Text>
                  {t.estimatedMinutes > 0 && <Text style={{ color: theme.colors.textMuted, fontSize: 11, marginTop: 1 }}>~{t.estimatedMinutes} min</Text>}
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
            activeOpacity={0.85}
            style={{
              backgroundColor: saving ? theme.colors.border : theme.colors.primary,
              paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginTop: 8,
              shadowColor: saving ? 'transparent' : theme.colors.primary,
              shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.30, shadowRadius: 14, elevation: 6,
            }}
          >
            {saving
              ? <ActivityIndicator color={theme.colors.textInverse} />
              : <Text style={{ color: theme.colors.textInverse, fontWeight: '800', fontSize: 16 }}>Start This Goal</Text>
            }
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
        <View key={i} style={{ width: i + 1 === current ? 22 : 8, height: 8, borderRadius: 4, backgroundColor: i + 1 <= current ? color : color + '28' }} />
      ))}
      <Text style={{ color, fontSize: 11, fontWeight: '700', marginLeft: 2 }}>{current}/{total}</Text>
    </View>
  );
}

function ReviewCard({ title, children, theme }: { title: string; children: React.ReactNode; theme: any }) {
  return (
    <View style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: 18, overflow: 'hidden', marginBottom: 12 }}>
      <View style={{ height: 3, backgroundColor: theme.colors.primary, opacity: 0.35 }} />
      <View style={{ padding: 18 }}>
        <Text style={{ color: theme.colors.text, fontWeight: '800', fontSize: 12, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12, opacity: 0.55 }}>
          {title}
        </Text>
        {children}
      </View>
    </View>
  );
}
