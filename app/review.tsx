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
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useGoalStore } from '@/stores/goalStore';
import { useStreakStore } from '@/stores/streakStore';
import { generateNightlyAnalysis, NightlyAnalysis, DifficultyRating } from '@/lib/claude';
import { toDateString } from '@/lib/streak';

// ─── Hectic scale config ──────────────────────────────────────────────────────

const HECTIC_OPTIONS = [
  { value: 1, emoji: '😌', label: 'Easy',        desc: 'Very relaxed day' },
  { value: 2, emoji: '🙂', label: 'Manageable',  desc: 'Handled it well' },
  { value: 3, emoji: '😐', label: 'Normal',       desc: 'Average day' },
  { value: 4, emoji: '😓', label: 'Hectic',       desc: 'Quite draining' },
  { value: 5, emoji: '🤯', label: 'Overwhelmed',  desc: 'Too much today' },
];

const DIFFICULTY_OPTIONS: { value: DifficultyRating; label: string; desc: string; emoji: string }[] = [
  { value: 'too_easy',   label: 'Too Easy',    desc: 'Could have done more',   emoji: '😴' },
  { value: 'just_right', label: 'Just Right',  desc: 'Felt balanced',          emoji: '✅' },
  { value: 'too_hard',   label: 'Too Hard',    desc: 'Struggled to keep up',   emoji: '😤' },
];

type ReviewStep = 'form' | 'analyzing' | 'results';

export default function NightlyReviewScreen() {
  const { goalId } = useLocalSearchParams<{ goalId: string }>();
  const { theme } = useTheme();
  const {
    goals, getTodaysTasks, getOverallCompletionRate,
    getDaysElapsed, addReview, applyNightlyAnalysis,
    replaceTasksForGoal,
  } = useGoalStore();
  const { streak } = useStreakStore();

  const goal = goals.find((g) => g.id === goalId);
  const todaysTasks = getTodaysTasks().filter((t) => t.goalId === goalId);
  const completedToday = todaysTasks.filter((t) => !!t.completedAt).length;

  const [step, setStep]                 = useState<ReviewStep>('form');
  const [hecticRating, setHecticRating] = useState(3);
  const [difficulty, setDifficulty]     = useState<DifficultyRating>('just_right');
  const [note, setNote]                 = useState('');
  const [analysis, setAnalysis]         = useState<NightlyAnalysis | null>(null);

  if (!goal) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: theme.colors.textMuted }}>Goal not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: theme.colors.primary }}>← Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const originalDeadlineDays = Math.ceil(
    (new Date(goal.targetDate).getTime() - new Date(goal.createdAt).getTime()) / 86400000,
  );
  const daysElapsed = getDaysElapsed(goal.id);
  const overallRate = getOverallCompletionRate(goal.id);

  // ── Submit review → AI ────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setStep('analyzing');

    const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

    let result: NightlyAnalysis;

    if (apiKey) {
      try {
        result = await generateNightlyAnalysis({
          goalTitle: goal.title,
          originalDeadlineDays,
          daysElapsed,
          tasksCompletedToday: completedToday,
          tasksTotalToday: todaysTasks.length,
          overallCompletionRate: overallRate,
          hecticRating,
          difficultyRating: difficulty,
          userNote: note,
          minutesPerDay: goal.minutesPerDay ?? 30,
          currentStreak: streak?.currentStreak ?? 0,
          pace: theme.key,
        });
      } catch (err) {
        console.error(err);
        result = buildFallbackAnalysis();
      }
    } else {
      result = buildFallbackAnalysis();
    }

    // Save review
    await addReview({
      goalId: goal.id,
      date: toDateString(new Date()),
      hecticRating,
      difficultyRating: difficulty,
      userNote: note,
      tasksCompleted: completedToday,
      tasksTotal: todaysTasks.length,
      aiFeedback: result.feedback,
      aiDifficultyChange: result.difficultyChange,
      aiNewEtaDays: result.newEtaDays,
      aiEtaChangeDays: result.etaChangeDays,
      aiEtaReason: result.etaReason,
      aiTomorrowFocus: result.tomorrowFocus,
      aiTomorrowMinutes: result.tomorrowMinutes,
      aiClosingLine: result.closingLine,
    });

    // Apply ETA + time adjustments to goal
    await applyNightlyAnalysis(
      goal.id,
      result.newEtaDays,
      result.etaChangeDays,
      result.tomorrowMinutes,
    );

    setAnalysis(result);
    setStep('results');
  };

  function buildFallbackAnalysis(): NightlyAnalysis {
    const daysRemaining = originalDeadlineDays - daysElapsed;
    const etaChange = difficulty === 'too_hard' ? 7 : difficulty === 'too_easy' ? -3 : 0;
    return {
      feedback: `You completed ${completedToday}/${todaysTasks.length} tasks today. ${
        difficulty === 'too_hard' ? 'The workload seems challenging — consider reducing tomorrow.' :
        difficulty === 'too_easy' ? 'You had capacity for more. Try increasing tomorrow.' :
        'Good job staying consistent.'
      }`,
      difficultyChange: difficulty === 'too_hard' ? 'reduce' : difficulty === 'too_easy' ? 'increase' : 'maintain',
      difficultyReason: 'Based on your difficulty rating.',
      newEtaDays: Math.max(1, daysRemaining + etaChange),
      etaChangeDays: etaChange,
      etaReason: etaChange > 0 ? `Behind pace — added ${etaChange} days.` : etaChange < 0 ? `Ahead of pace — saved ${Math.abs(etaChange)} days.` : 'On track.',
      tomorrowFocus: `Keep working on "${goal!.title}" with focus.`,
      tomorrowMinutes: goal!.minutesPerDay ?? 30,
      closingLine: 'Rest up. Tomorrow we go again.',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Render: Form
  // ─────────────────────────────────────────────────────────────────────────────

  if (step === 'form') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>

            {/* Header */}
            <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 20 }}>
              <Text style={{ color: theme.colors.primary, fontSize: 16 }}>← Back</Text>
            </TouchableOpacity>

            <Text style={{ color: theme.colors.text, fontSize: 26, fontWeight: '800', marginBottom: 4 }}>
              End of Day Review
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 14, marginBottom: 24 }}>
              Be honest. AI uses this to adapt your plan and tell you if you need to slow down.
            </Text>

            {/* Goal + today's summary */}
            <View style={{ backgroundColor: theme.colors.surfaceAlt, borderRadius: 12, padding: 14, marginBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 28 }}>{theme.emoji.goal}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 14 }} numberOfLines={1}>{goal.title}</Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 2 }}>
                  {completedToday}/{todaysTasks.length} tasks done today · {goal.minutesPerDay ?? 30} min/day
                </Text>
              </View>
            </View>

            {/* How hectic was your day? */}
            <Text style={{ color: theme.colors.text, fontWeight: '800', fontSize: 15, marginBottom: 12 }}>
              How hectic was today?
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 28 }}>
              {HECTIC_OPTIONS.map((opt) => {
                const isSelected = hecticRating === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setHecticRating(opt.value)}
                    style={{
                      flex: 1,
                      backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                      borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                      borderWidth: 1.5,
                      borderRadius: 12,
                      padding: 10,
                      alignItems: 'center',
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 22 }}>{opt.emoji}</Text>
                    <Text style={{ color: isSelected ? theme.colors.textInverse : theme.colors.textMuted, fontSize: 10, fontWeight: '600', marginTop: 4, textAlign: 'center' }}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* How hard were the tasks? */}
            <Text style={{ color: theme.colors.text, fontWeight: '800', fontSize: 15, marginBottom: 12 }}>
              How difficult were the tasks?
            </Text>
            <View style={{ gap: 8, marginBottom: 28 }}>
              {DIFFICULTY_OPTIONS.map((opt) => {
                const isSelected = difficulty === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setDifficulty(opt.value)}
                    style={{
                      backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                      borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                      borderWidth: 1.5,
                      borderRadius: 12,
                      padding: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={{ fontSize: 22 }}>{opt.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: isSelected ? theme.colors.textInverse : theme.colors.text, fontWeight: '700', fontSize: 14 }}>{opt.label}</Text>
                      <Text style={{ color: isSelected ? theme.colors.textInverse + 'cc' : theme.colors.textMuted, fontSize: 12 }}>{opt.desc}</Text>
                    </View>
                    {isSelected && <Text style={{ color: theme.colors.textInverse, fontWeight: '800' }}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Optional note */}
            <Text style={{ color: theme.colors.text, fontWeight: '800', fontSize: 15, marginBottom: 8 }}>
              Anything else? <Text style={{ color: theme.colors.textMuted, fontWeight: '400' }}>(optional)</Text>
            </Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="e.g. Had back pain, couldn't run. Work was crazy today. Felt great actually..."
              placeholderTextColor={theme.colors.textMuted}
              style={{
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderWidth: 1.5,
                borderRadius: 12,
                padding: 14,
                color: theme.colors.text,
                fontSize: 14,
                minHeight: 80,
                textAlignVertical: 'top',
                marginBottom: 28,
              }}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              onPress={handleSubmit}
              style={{ backgroundColor: theme.colors.primary, padding: 16, borderRadius: 14, alignItems: 'center' }}
            >
              <Text style={{ color: theme.colors.textInverse, fontWeight: '800', fontSize: 16 }}>
                ✨ Get AI Feedback
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Render: Analyzing
  // ─────────────────────────────────────────────────────────────────────────────

  if (step === 'analyzing') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginBottom: 24 }} />
        <Text style={{ color: theme.colors.text, fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 8 }}>
          Analysing your day...
        </Text>
        <Text style={{ color: theme.colors.textMuted, fontSize: 14, textAlign: 'center' }}>
          AI is reviewing your pace, adjusting tomorrow's plan, and recalculating your goal timeline.
        </Text>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Render: Results
  // ─────────────────────────────────────────────────────────────────────────────

  if (step === 'results' && analysis) {
    const etaLabel = analysis.etaChangeDays === 0
      ? 'On track'
      : analysis.etaChangeDays > 0
        ? `+${analysis.etaChangeDays} days`
        : `${analysis.etaChangeDays} days`;

    const etaColor = analysis.etaChangeDays === 0
      ? theme.colors.success
      : analysis.etaChangeDays > 0
        ? theme.colors.danger
        : theme.colors.success;

    const diffIcons = { reduce: '⬇️', maintain: '➡️', increase: '⬆️' };
    const diffLabels = { reduce: 'Reducing difficulty', maintain: 'Keeping same pace', increase: 'Increasing challenge' };

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>

          {/* Header */}
          <Text style={{ color: theme.colors.text, fontSize: 24, fontWeight: '800', marginBottom: 4 }}>
            AI Feedback
          </Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: 13, marginBottom: 20 }}>
            Based on your day — here's what changes.
          </Text>

          {/* Honest feedback */}
          <View style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderWidth: 1,
            borderLeftColor: theme.colors.primary,
            borderLeftWidth: 4,
            borderRadius: 14,
            padding: 16,
            marginBottom: 14,
          }}>
            <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              📋 Today's Assessment
            </Text>
            <Text style={{ color: theme.colors.text, fontSize: 14, lineHeight: 22 }}>
              {analysis.feedback}
            </Text>
          </View>

          {/* ETA update */}
          <View style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 14 }}>
            <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              📅 Updated Goal Timeline
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <View>
                <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>New estimate</Text>
                <Text style={{ color: theme.colors.text, fontSize: 22, fontWeight: '800' }}>
                  {analysis.newEtaDays} days
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>Change</Text>
                <Text style={{ color: etaColor, fontSize: 20, fontWeight: '800' }}>
                  {etaLabel}
                </Text>
              </View>
            </View>
            <Text style={{ color: theme.colors.textMuted, fontSize: 13, lineHeight: 19 }}>
              {analysis.etaReason}
            </Text>
          </View>

          {/* Difficulty adjustment */}
          <View style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 14 }}>
            <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              {diffIcons[analysis.difficultyChange]} Plan Adjustment
            </Text>
            <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 14, marginBottom: 4 }}>
              {diffLabels[analysis.difficultyChange]}
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 13, lineHeight: 19, marginBottom: 8 }}>
              {analysis.difficultyReason}
            </Text>
            {analysis.tomorrowMinutes !== (goal.minutesPerDay ?? 30) && (
              <View style={{ backgroundColor: theme.colors.surfaceAlt, borderRadius: 8, padding: 10, flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>
                  Was: {goal.minutesPerDay ?? 30} min/day
                </Text>
                <Text style={{ color: theme.colors.primary, fontWeight: '700', fontSize: 12 }}>
                  Tomorrow: {analysis.tomorrowMinutes} min/day
                </Text>
              </View>
            )}
          </View>

          {/* Tomorrow's focus */}
          <View style={{ backgroundColor: theme.colors.surfaceAlt, borderRadius: 14, padding: 16, marginBottom: 24 }}>
            <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              ⚡ Tomorrow's Focus
            </Text>
            <Text style={{ color: theme.colors.text, fontSize: 14, lineHeight: 21 }}>
              {analysis.tomorrowFocus}
            </Text>
          </View>

          {/* Closing line */}
          <Text style={{ color: theme.colors.textMuted, fontSize: 14, fontStyle: 'italic', textAlign: 'center', marginBottom: 28 }}>
            "{analysis.closingLine}"
          </Text>

          {/* Done button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ backgroundColor: theme.colors.primary, padding: 16, borderRadius: 14, alignItems: 'center' }}
          >
            <Text style={{ color: theme.colors.textInverse, fontWeight: '800', fontSize: 16 }}>
              Done — see you tomorrow
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}
