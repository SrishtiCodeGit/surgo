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
import { useBlockedSlotStore } from '@/stores/blockedSlotStore';
import { GoalCategory, BlockedSlot } from '@/types';
import { analyzeGoal, GoalAnalysis } from '@/lib/claude';
import { toDateString } from '@/lib/streak';
import { WelcomeMascot } from '@/components/ui/WelcomeMascot';

const { width: SW } = Dimensions.get('window');

// ─── Category accent colours ──────────────────────────────────────────────────

const CATEGORY_COLORS: Record<GoalCategory, string> = {
  fitness:       '#FB923C',  // orange-400   — warm, energetic
  career:        '#818CF8',  // indigo-400   — focus, ambition
  learning:      '#38BDF8',  // sky-400      — open, curious
  finance:       '#34D399',  // emerald-400  — growth, money
  health:        '#F472B6',  // pink-400     — care, vitality
  relationships: '#FB7185',  // rose-400     — warmth, connection
  creativity:    '#C084FC',  // purple-400   — imagination
  other:         '#94A3B8',  // slate-400    — neutral
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

// ─── Preferred time slots ─────────────────────────────────────────────────────

export interface TimeSlot {
  key: string;
  label: string;
  icon: string;
  startTime: string; // "HH:MM" 24h
  endTime: string;   // "HH:MM" 24h — window boundary
  desc: string;
}

const TIME_SLOTS: TimeSlot[] = [
  { key: 'morning',  label: 'Morning',  icon: '🌅', startTime: '06:00', endTime: '09:00', desc: '6:00 – 9:00 AM'  },
  { key: 'midday',   label: 'Midday',   icon: '☀️', startTime: '12:00', endTime: '14:00', desc: '12:00 – 2:00 PM' },
  { key: 'evening',  label: 'Evening',  icon: '🌆', startTime: '17:00', endTime: '19:00', desc: '5:00 – 7:00 PM'  },
  { key: 'night',    label: 'Night',    icon: '🌙', startTime: '20:00', endTime: '22:00', desc: '8:00 – 10:00 PM' },
];

// ─── Time helpers ─────────────────────────────────────────────────────────────

const toMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const minsToTime = (n: number) =>
  `${String(Math.floor(n / 60) % 24).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
const fmt12 = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

function addMinutes(timeStr: string, mins: number): string {
  return minsToTime(toMins(timeStr) + mins);
}

/** Push cursor past any blocked windows that overlap the [cursor, cursor+taskMins) interval. */
function findNextFreeSlot(cursor: string, taskMins: number, blocked: BlockedSlot[]): string {
  let start = toMins(cursor);
  let changed = true;
  while (changed) {
    changed = false;
    const end = start + taskMins;
    for (const b of blocked) {
      const bs = toMins(b.startTime);
      const be = toMins(b.endTime);
      if (start < be && end > bs) { // overlap
        start = be;
        changed = true;
      }
    }
  }
  return minsToTime(start);
}

/** Returns true if the given time window conflicts with any blocked slot. */
function hasConflict(startTime: string, durationMins: number, blocked: BlockedSlot[]): BlockedSlot | null {
  const s = toMins(startTime);
  const e = s + durationMins;
  return blocked.find(b => s < toMins(b.endTime) && e > toMins(b.startTime)) ?? null;
}

/** Two time windows overlap when one starts before the other ends. */
function timeOverlaps(s1: string, e1: string, s2: string, e2: string): boolean {
  return toMins(s1) < toMins(e2) && toMins(e1) > toMins(s2);
}

// 30-min increments inside each broad window
const SLOT_TIMES: Record<string, string[]> = {
  morning: ['06:00','06:30','07:00','07:30','08:00','08:30'],
  midday:  ['12:00','12:30','13:00','13:30'],
  evening: ['17:00','17:30','18:00','18:30','19:00'],
  night:   ['20:00','20:30','21:00','21:30'],
};

type Step = 'list' | 'step1' | 'step2' | 'step3' | 'analyzing' | 'review' | 'conflict';

// ─── Local types ──────────────────────────────────────────────────────────────

type PendingTask = {
  goalId: string; userId: string; title: string; dueDate: string;
  estimatedMinutes: number; aiGenerated: boolean; isStretchTask: boolean;
  scheduledTime: string; scheduledEndTime: string;
};

type ConflictDetail = {
  date: string;
  newTaskTitle: string;
  existingTask: import('@/types').Task;
  existingGoal: import('@/types').Goal;
};

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
        <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: '500', lineHeight: 22 }}>
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
  const { goals, tasks, load, isLoaded, addGoal, addTasks, addMilestones, deleteGoal, rescheduleTask } = useGoalStore();
  const { slots: allSlots, isLoaded: slotsLoaded, load: loadSlots, getSlotsForDay } = useBlockedSlotStore();

  const [step, setStep]                         = useState<Step>('list');
  const [title, setTitle]                       = useState('');
  const [category, setCategory]                 = useState<GoalCategory>('fitness');
  const [deadlineDays, setDeadlineDays]         = useState(30);
  const [minutesPerDay, setMinutesPerDay]       = useState(30);
  const [preferredSlot, setPreferredSlot]       = useState<TimeSlot>(TIME_SLOTS[0]);
  const [exactStartTime, setExactStartTime]     = useState(TIME_SLOTS[0].startTime);
  const [analysis, setAnalysis]                 = useState<GoalAnalysis | null>(null);
  const [saving, setSaving]                     = useState(false);
  const [pendingTasks, setPendingTasks]         = useState<PendingTask[]>([]);
  const [conflictData, setConflictData]         = useState<ConflictDetail[]>([]);

  useEffect(() => { if (!isLoaded) load(); }, []);
  useEffect(() => { if (!slotsLoaded) loadSlots(); }, []);

  const resetForm = () => {
    setTitle(''); setCategory('fitness');
    setDeadlineDays(30); setMinutesPerDay(30);
    setPreferredSlot(TIME_SLOTS[0]); setExactStartTime(TIME_SLOTS[0].startTime); setAnalysis(null);
  };

  const handleStep1Next = () => {
    if (!title.trim()) { Alert.alert('Hey!', 'Tell me your goal first 😊'); return; }
    setStep('step2');
  };

  const handleStep2Next = () => setStep('step3');

  const handleAnalyze = async () => {
    const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
    if (!apiKey) { setAnalysis(buildPlaceholder()); setStep('review'); return; }
    setStep('analyzing');
    try {
      const targetDate = toDateString(new Date(Date.now() + deadlineDays * 86400000));
      const result = await analyzeGoal(
        title.trim(), targetDate, deadlineDays, minutesPerDay, theme.key,
        fmt12(exactStartTime),
        allSlots.map(s => ({ label: s.label, startTime: s.startTime, endTime: s.endTime, repeat: s.repeat })),
      );
      setAnalysis(result); setStep('review');
    } catch (err) {
      const msg = String(err);
      const detail = msg.includes('429') ? 'Rate limit hit — try again in a minute.' : msg.slice(0, 120);
      setAnalysis(buildPlaceholder()); setStep('review');
      Alert.alert('Used basic plan', detail);
    }
  };

  /** Build scheduled tasks for the new goal (block-aware). */
  const buildFinalTasks = (goalId: string): PendingTask[] => {
    const today = new Date();
    const byDay: Record<number, Array<{ title: string; day: number; estimatedMinutes: number }>> = {};
    analysis!.weekTasks.forEach(t => {
      if (!byDay[t.day]) byDay[t.day] = [];
      byDay[t.day].push(t);
    });

    const result: PendingTask[] = [];
    Object.entries(byDay).forEach(([dayStr, dayTasks]) => {
      const dayNum  = Number(dayStr);
      const dayDate = new Date(today.getTime() + (dayNum - 1) * 86400000);
      const dow     = dayDate.getDay();
      const blocked = getSlotsForDay(dow);
      let cursor    = exactStartTime;

      dayTasks.forEach(t => {
        const mins      = t.estimatedMinutes ?? minutesPerDay;
        const freeStart = findNextFreeSlot(cursor, mins, blocked);
        const freeEnd   = addMinutes(freeStart, mins);
        result.push({
          goalId, userId: 'local', title: t.title,
          dueDate: toDateString(dayDate),
          estimatedMinutes: mins, aiGenerated: true, isStretchTask: false,
          scheduledTime: freeStart, scheduledEndTime: freeEnd,
        });
        cursor = freeEnd;
      });
    });
    return result;
  };

  /** Detect clashes between new tasks and already-scheduled existing tasks. */
  const detectConflicts = (newTasks: PendingTask[]): ConflictDetail[] => {
    const result: ConflictDetail[] = [];
    for (const nt of newTasks) {
      const sameDayExisting = tasks.filter(t =>
        t.dueDate === nt.dueDate && t.scheduledTime && t.scheduledEndTime,
      );
      for (const ex of sameDayExisting) {
        if (timeOverlaps(nt.scheduledTime, nt.scheduledEndTime, ex.scheduledTime!, ex.scheduledEndTime!)) {
          const exGoal = goals.find(g => g.id === ex.goalId);
          if (exGoal) {
            result.push({ date: nt.dueDate, newTaskTitle: nt.title, existingTask: ex, existingGoal: exGoal });
          }
        }
      }
    }
    return result;
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

      const built    = buildFinalTasks(goal.id);
      const clashes  = detectConflicts(built);

      if (clashes.length > 0) {
        // Save the goal/milestones but hold tasks — show conflict resolution
        setPendingTasks(built);
        setConflictData(clashes);
        setStep('conflict');
        setSaving(false);
        return;
      }

      await addTasks(built);
      resetForm(); setStep('list');
      Alert.alert(
        'Goal locked in! 🗓️',
        `Tasks start at ${fmt12(exactStartTime)}${allSlots.length > 0 ? ', routed around your blocked times' : ''}. Check the Calendar tab!`,
        [{ text: "Let's go!" }],
      );
    } catch (err) {
      Alert.alert('Error', String(err));
    } finally { setSaving(false); }
  };

  /** Push new tasks to start after existing ones on each day, then save. */
  const handleRescheduleNew = async () => {
    setSaving(true);
    try {
      const rescheduled: PendingTask[] = [];
      const byDate: Record<string, PendingTask[]> = {};
      pendingTasks.forEach(t => { (byDate[t.dueDate] ??= []).push(t); });

      Object.entries(byDate).forEach(([date, newDayTasks]) => {
        // Latest end time of existing tasks that day
        const existingEnds = tasks
          .filter(t => t.dueDate === date && t.scheduledEndTime)
          .map(t => toMins(t.scheduledEndTime!));
        const latestEnd = existingEnds.length > 0 ? minsToTime(Math.max(...existingEnds)) : exactStartTime;

        const dow     = new Date(date).getDay();
        const blocked = getSlotsForDay(dow);
        let cursor    = latestEnd;

        newDayTasks.forEach(t => {
          const freeStart = findNextFreeSlot(cursor, t.estimatedMinutes, blocked);
          const freeEnd   = addMinutes(freeStart, t.estimatedMinutes);
          rescheduled.push({ ...t, scheduledTime: freeStart, scheduledEndTime: freeEnd });
          cursor = freeEnd;
        });
      });

      await addTasks(rescheduled);
      resetForm(); setStep('list');
      Alert.alert('Sorted! 🗓️', `New tasks pushed after existing ones. Check the Calendar tab!`, [{ text: "Let's go!" }]);
    } catch (err) {
      Alert.alert('Error', String(err));
    } finally { setSaving(false); }
  };

  /** Save new tasks as-is, then push conflicting existing tasks after them. */
  const handleRescheduleExisting = async () => {
    setSaving(true);
    try {
      await addTasks(pendingTasks);

      // Per-date: push existing conflicting tasks after the last new task
      const byDate: Record<string, PendingTask[]> = {};
      pendingTasks.forEach(t => { (byDate[t.dueDate] ??= []).push(t); });

      for (const [date, newDayTasks] of Object.entries(byDate)) {
        const latestNew = newDayTasks.reduce(
          (max, t) => toMins(t.scheduledEndTime) > toMins(max) ? t.scheduledEndTime : max,
          '00:00',
        );
        const dow       = new Date(date).getDay();
        const blocked   = getSlotsForDay(dow);
        let cursor      = latestNew;

        // Unique existing conflicting tasks for this day (sorted by original start)
        const dayConflicts = conflictData
          .filter(c => c.date === date)
          .filter((c, i, arr) => arr.findIndex(x => x.existingTask.id === c.existingTask.id) === i)
          .sort((a, b) => toMins(a.existingTask.scheduledTime!) - toMins(b.existingTask.scheduledTime!));

        for (const c of dayConflicts) {
          const mins      = c.existingTask.estimatedMinutes ?? 30;
          const freeStart = findNextFreeSlot(cursor, mins, blocked);
          const freeEnd   = addMinutes(freeStart, mins);
          await rescheduleTask(c.existingTask.id, freeStart, freeEnd);
          cursor = freeEnd;
        }
      }

      resetForm(); setStep('list');
      Alert.alert('Sorted! 🗓️', `Existing tasks rescheduled around your new goal. Check the Calendar tab!`, [{ text: "Let's go!" }]);
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
              <Text style={{ color: theme.colors.text, fontSize: 30, fontWeight: '600', letterSpacing: -0.5 }}>
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
                color: theme.colors.text, fontSize: 20, fontWeight: '500',
                marginTop: 18, marginBottom: 8, letterSpacing: -0.2, textAlign: 'center',
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
                <Text style={{ color: theme.colors.textInverse, fontWeight: '500', fontSize: 15 }}>
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
                  <Text style={{ color: cc, fontSize: 11, fontWeight: '500', letterSpacing: 1.2, textTransform: 'uppercase', flex: 1 }}>
                    {cat?.label}
                  </Text>
                  {/* ETA badge */}
                  {hasReview && (
                    <View style={{ backgroundColor: etaColor + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                      <Text style={{ color: etaColor, fontSize: 10, fontWeight: '400' }}>{etaLabel}</Text>
                    </View>
                  )}
                </View>

                {/* ── Card body ── */}
                <View style={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 16 }}>
                  {/* Title + % */}
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 10 }}>
                    <Text style={{ flex: 1, color: theme.colors.text, fontSize: 16, fontWeight: '500', lineHeight: 24 }} numberOfLines={2}>
                      {goal.title}
                    </Text>
                    <Text style={{ color: cc, fontSize: 24, fontWeight: '300', letterSpacing: -0.3 }}>
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
                      <Text style={{ color: cc, fontSize: 11, fontWeight: '400' }}>{daysLeft}d left</Text>
                    </View>
                    <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>·</Text>
                    <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '400' }}>
                      {completedTasks}/{goalTasks.length} tasks done
                    </Text>
                    {(goal.minutesPerDay ?? 0) > 0 && (
                      <>
                        <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>·</Text>
                        <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '400' }}>
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
                <Text style={{ color: theme.colors.primary, fontSize: 15, fontWeight: '400' }}>← Back</Text>
              </TouchableOpacity>
              <StepDots current={1} total={3} color={theme.colors.primary} />
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
            <Text style={{ color: theme.colors.text, fontSize: 12, fontWeight: '500', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>
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
                    <Text style={{ color: isSelected ? '#fff' : cc, fontSize: 8, fontWeight: '500', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Deadline */}
            <Text style={{ color: theme.colors.text, fontSize: 12, fontWeight: '500', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>
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
                    <Text style={{ color: isSelected ? theme.colors.textInverse : theme.colors.text, fontWeight: '400', fontSize: 13 }}>
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
              <Text style={{ color: theme.colors.textInverse, fontWeight: '500', fontSize: 16 }}>Next →</Text>
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
              <Text style={{ color: theme.colors.primary, fontSize: 15, fontWeight: '400' }}>← Back</Text>
            </TouchableOpacity>
            <StepDots current={2} total={3} color={theme.colors.primary} />
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
            <Text style={{ color: cc, fontWeight: '400', fontSize: 13, flex: 1 }} numberOfLines={1}>{title}</Text>
            <View style={{ backgroundColor: cc + '22', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
              <Text style={{ color: cc, fontSize: 11, fontWeight: '400' }}>
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
                    <Text style={{ color: isSelected ? '#fff' : theme.colors.primary, fontSize: 15, fontWeight: '500' }}>
                      {opt.label}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: isSelected ? '#fff' : theme.colors.text, fontWeight: '400', fontSize: 14 }}>{opt.desc}</Text>
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
            onPress={handleStep2Next}
            activeOpacity={0.85}
            style={{
              backgroundColor: theme.colors.primary,
              paddingVertical: 17, borderRadius: 16, alignItems: 'center',
              shadowColor: theme.colors.primary,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.32, shadowRadius: 14, elevation: 6,
            }}
          >
            <Text style={{ color: theme.colors.textInverse, fontWeight: '500', fontSize: 16 }}>Next →</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 3 — Surgo asks: When's your best time?
  // ───────────────────────────────────────────────────────────────────────────

  if (step === 'step3') {
    const exactTimes    = SLOT_TIMES[preferredSlot.key] ?? [];
    // Check conflict against ALL blocked slots (the goal spans the whole week)
    const conflict      = hasConflict(exactStartTime, minutesPerDay, allSlots);
    const conflictLabel = conflict ? `${conflict.emoji} ${conflict.label}` : null;

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>

          {/* Back + dots */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <TouchableOpacity onPress={() => setStep('step2')} activeOpacity={0.7}>
              <Text style={{ color: theme.colors.primary, fontSize: 15, fontWeight: '400' }}>← Back</Text>
            </TouchableOpacity>
            <StepDots current={3} total={3} color={theme.colors.primary} />
          </View>

          {/* Surgo speech bubble — changes if conflict detected */}
          <SurgoBubble
            themeKey={themeKey}
            pose={conflict ? 'sad' : 'happy'}
            headline={conflict
              ? `That time clashes with ${conflictLabel}!`
              : "When's your best time to work?"}
            sub={conflict
              ? `No worries — I'll automatically route your tasks around ${conflictLabel} when building your schedule. Or pick a different time below.`
              : "I'll schedule your tasks right into your calendar — pick the slot that feels natural."}
          />

          {/* ── Broad window cards ── */}
          <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: '400', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            Window
          </Text>
          <View style={{ gap: 10, marginBottom: 22 }}>
            {TIME_SLOTS.map((slot) => {
              const isSelected = preferredSlot.key === slot.key;
              return (
                <TouchableOpacity
                  key={slot.key}
                  onPress={() => {
                    setPreferredSlot(slot);
                    setExactStartTime(slot.startTime); // reset exact time to window start
                  }}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 14,
                    backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                    borderWidth: 1.5, borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                    borderRadius: 16, padding: 16,
                    shadowColor: isSelected ? theme.colors.primary : '#000',
                    shadowOffset: { width: 0, height: isSelected ? 4 : 1 },
                    shadowOpacity: isSelected ? 0.18 : 0.04,
                    shadowRadius: isSelected ? 10 : 4,
                    elevation: isSelected ? 4 : 1,
                  }}
                >
                  <View style={{
                    width: 44, height: 44, borderRadius: 22,
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.20)' : theme.colors.primaryLight,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: 20 }}>{slot.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: isSelected ? '#fff' : theme.colors.text, fontSize: 15, fontWeight: '500' }}>
                      {slot.label}
                    </Text>
                    <Text style={{ color: isSelected ? 'rgba(255,255,255,0.70)' : theme.colors.textMuted, fontSize: 12, marginTop: 1 }}>
                      {slot.desc}
                    </Text>
                  </View>
                  {isSelected && (
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Exact time picker ── */}
          <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: '400', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            Exact start time
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 22 }}>
            <View style={{ flexDirection: 'row', gap: 8, paddingRight: 8 }}>
              {exactTimes.map((t) => {
                const isSel  = exactStartTime === t;
                const clash  = hasConflict(t, minutesPerDay, allSlots);
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setExactStartTime(t)}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 10,
                      borderRadius: 12,
                      backgroundColor: isSel ? theme.colors.primary : clash ? theme.colors.danger + '14' : theme.colors.surface,
                      borderWidth: 1.5,
                      borderColor: isSel ? theme.colors.primary : clash ? theme.colors.danger + '60' : theme.colors.border,
                      alignItems: 'center', gap: 3,
                    }}
                  >
                    <Text style={{
                      color: isSel ? '#fff' : clash ? theme.colors.danger : theme.colors.text,
                      fontSize: 13, fontWeight: isSel ? '500' : '400',
                    }}>
                      {fmt12(t)}
                    </Text>
                    {clash && !isSel && (
                      <Text style={{ color: theme.colors.danger, fontSize: 8 }}>blocked</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Info / conflict strip */}
          <View style={{
            backgroundColor: conflict ? theme.colors.danger + '10' : theme.colors.primaryLight,
            borderRadius: 14, padding: 14, marginBottom: 24,
            flexDirection: 'row', gap: 10, alignItems: 'flex-start',
            borderWidth: 1, borderColor: conflict ? theme.colors.danger + '30' : 'transparent',
          }}>
            <Text style={{ fontSize: 16 }}>{conflict ? '⚠️' : '🗓️'}</Text>
            <Text style={{ flex: 1, color: conflict ? theme.colors.danger : theme.colors.primary, fontSize: 12, lineHeight: 18 }}>
              {conflict
                ? `Starting at ${fmt12(exactStartTime)} overlaps ${conflictLabel}. Tasks will be pushed to after ${fmt12(conflict.endTime)} automatically.`
                : `Tasks will start at ${fmt12(exactStartTime)} each day. You can always reschedule from the Calendar tab.`
              }
            </Text>
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
            <Text style={{ color: theme.colors.textInverse, fontWeight: '500', fontSize: 16 }}>
              Build My Plan
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CONFLICT — time collision detected
  // ───────────────────────────────────────────────────────────────────────────

  if (step === 'conflict') {
    // Deduplicate: unique conflicting existing goals
    const conflictingGoals = conflictData
      .filter((c, i, arr) => arr.findIndex(x => x.existingGoal.id === c.existingGoal.id) === i)
      .map(c => c.existingGoal);
    const datesAffected = [...new Set(conflictData.map(c => c.date))].length;
    const newGoalTitle  = title.trim();
    const existingGoalTitle = conflictingGoals[0]?.title ?? 'existing goal';
    const cc = CATEGORY_COLORS[category];

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 56 }}>

          {/* Surgo bubble */}
          <SurgoBubble
            themeKey={themeKey}
            pose="sad"
            headline="Whoa — time collision! 🚧"
            sub={`"${newGoalTitle}" overlaps with "${existingGoalTitle}" on ${datesAffected} day${datesAffected !== 1 ? 's' : ''}. One of them needs to move.`}
          />

          {/* Conflict summary card */}
          <View style={{
            backgroundColor: theme.colors.danger + '0D',
            borderRadius: 18, padding: 18, marginBottom: 20,
            borderWidth: 1, borderColor: theme.colors.danger + '30',
          }}>
            <Text style={{ color: theme.colors.danger, fontSize: 12, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>
              Conflicts detected
            </Text>
            {conflictData
              .filter((c, i, arr) => arr.findIndex(x => x.existingTask.id === c.existingTask.id) === i)
              .slice(0, 5)
              .map((c, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.danger, marginTop: 5 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '400' }}>
                      <Text style={{ fontWeight: '500' }}>{fmt12(c.existingTask.scheduledTime!)}</Text>
                      {' '}— "{c.existingTask.title}"
                    </Text>
                    <Text style={{ color: theme.colors.textMuted, fontSize: 11, marginTop: 1 }}>
                      from {c.existingGoal.title} · {new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                </View>
              ))}
            {conflictData.length > 5 && (
              <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 4 }}>
                + {conflictData.length - 5} more conflicts…
              </Text>
            )}
          </View>

          <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '500', marginBottom: 14, textAlign: 'center' }}>
            Which should move?
          </Text>

          {/* Option A — move new goal */}
          <TouchableOpacity
            onPress={handleRescheduleNew}
            disabled={saving}
            activeOpacity={0.85}
            style={{
              backgroundColor: cc + '14',
              borderRadius: 18, padding: 18, marginBottom: 12,
              borderWidth: 1.5, borderColor: cc + '40',
              flexDirection: 'row', alignItems: 'center', gap: 14,
              opacity: saving ? 0.5 : 1,
            }}
          >
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: cc + '28', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 20 }}>🆕</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: cc, fontSize: 14, fontWeight: '500' }}>Move my new goal</Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 2, lineHeight: 17 }}>
                "{newGoalTitle}" tasks will be pushed to after the existing ones each day.
              </Text>
            </View>
          </TouchableOpacity>

          {/* Option B — move existing goal */}
          <TouchableOpacity
            onPress={handleRescheduleExisting}
            disabled={saving}
            activeOpacity={0.85}
            style={{
              backgroundColor: theme.colors.primary + '0F',
              borderRadius: 18, padding: 18, marginBottom: 24,
              borderWidth: 1.5, borderColor: theme.colors.primary + '40',
              flexDirection: 'row', alignItems: 'center', gap: 14,
              opacity: saving ? 0.5 : 1,
            }}
          >
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.primary + '20', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 20 }}>📅</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.colors.primary, fontSize: 14, fontWeight: '500' }}>Move "{existingGoalTitle}"</Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 2, lineHeight: 17 }}>
                Existing tasks will be pushed to after your new goal's tasks each day.
              </Text>
            </View>
          </TouchableOpacity>

          {saving && <ActivityIndicator color={theme.colors.primary} style={{ marginBottom: 16 }} />}

          <TouchableOpacity onPress={() => setStep('review')} activeOpacity={0.7}>
            <Text style={{ color: theme.colors.textMuted, fontSize: 13, textAlign: 'center' }}>← Back to plan</Text>
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
          <Text style={{ color: theme.colors.text, fontSize: 20, fontWeight: '500', letterSpacing: -0.2, marginBottom: 8 }}>
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
            <Text style={{ color: theme.colors.primary, fontSize: 15, fontWeight: '400' }}>← Edit</Text>
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
              <Text style={{ color: 'rgba(255,255,255,0.80)', fontSize: 11, fontWeight: '500', letterSpacing: 1.4, textTransform: 'uppercase' }}>
                Your AI Plan
              </Text>
            </View>
            <Text style={{ color: '#fff', fontSize: 19, fontWeight: '500', lineHeight: 26, marginBottom: 10 }}>{title}</Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {[`${minutesPerDay} min/day`, DEADLINES.find(d => d.days === deadlineDays)?.label ?? '', theme.name].map((tag, i) => (
                <View key={i} style={{ backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9 }}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '400' }}>{tag}</Text>
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
                  <Text style={{ color: theme.colors.text, fontWeight: '500', fontSize: 14, flex: 1 }}>{act.activity}</Text>
                  <View style={{ backgroundColor: theme.colors.primaryLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                    <Text style={{ color: theme.colors.primary, fontSize: 11, fontWeight: '400' }}>{act.timePerWeek}</Text>
                  </View>
                </View>
                <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: '400', marginBottom: 2 }}>{act.why}</Text>
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
                  <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '400' }}>{m.title}</Text>
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
                  <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '400' }}>{t.title}</Text>
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
              : <Text style={{ color: theme.colors.textInverse, fontWeight: '500', fontSize: 16 }}>Start This Goal</Text>
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
      <Text style={{ color, fontSize: 11, fontWeight: '400', marginLeft: 2 }}>{current}/{total}</Text>
    </View>
  );
}

function ReviewCard({ title, children, theme }: { title: string; children: React.ReactNode; theme: any }) {
  return (
    <View style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: 18, overflow: 'hidden', marginBottom: 12 }}>
      <View style={{ height: 3, backgroundColor: theme.colors.primary, opacity: 0.35 }} />
      <View style={{ padding: 18 }}>
        <Text style={{ color: theme.colors.text, fontWeight: '500', fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12, opacity: 0.5 }}>
          {title}
        </Text>
        {children}
      </View>
    </View>
  );
}
